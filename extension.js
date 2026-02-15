import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { StatisticsStorage } from './utils/storage.js';
import { formatBytes, formatTemp } from './utils/formatters.js';
import { TemperatureMonitor } from './monitors/temperatureMonitor.js';
import { DiskMonitor } from './monitors/diskMonitor.js';
import { SpeedGraph } from './widgets/speedGraph.js';
import { SystemGraph } from './widgets/systemGraph.js';
import { QuotaBar } from './widgets/quotaBar.js';
import { NotificationManager } from './utils/notifications.js';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// Format speed:
// - if >= 1 Mbit/s -> show Mbit/s
// - else -> show KB/s or B/s (bytes per second)
function formatSpeed(bytesPerSec) {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) {
    return '0 B/s';
  }

  const bitsPerSec = bytesPerSec * 8;

  // Use decimal for Mbit/s (1000-based) to match common network units
  if (bitsPerSec >= 1_000_000) {
    const mbit = bitsPerSec / 1_000_000;
    return `${mbit.toFixed(1)} Mbit/s`;
  }

  // Below 1 Mbit/s -> show KB/s or B/s
  if (bytesPerSec >= 1024) {
    const kb = bytesPerSec / 1024;
    return `${kb.toFixed(1)} KB/s`;
  }

  return `${Math.round(bytesPerSec)} B/s`;
}

// Read /proc/net/dev and return map: iface -> { rxBytes, txBytes }
function readNetDev() {
  const path = '/proc/net/dev';
  try {
    const [ok, bytes] = GLib.file_get_contents(path);
    if (!ok) return {};

    const text = new TextDecoder('utf-8').decode(bytes);
    const lines = text.split('\n');

    const map = {};
    for (const line of lines) {
      if (!line.includes(':')) continue;

      const [ifaceRaw, dataRaw] = line.split(':');
      const iface = ifaceRaw.trim();
      const data = dataRaw.trim().split(/\s+/);

      const rxBytes = Number(data[0] ?? 0);
      const txBytes = Number(data[8] ?? 0);

      if (!Number.isFinite(rxBytes) || !Number.isFinite(txBytes)) continue;
      map[iface] = { rxBytes, txBytes };
    }
    return map;
  } catch {
    return {};
  }
}

// Get all available interfaces (excluding loopback)
function getAllInterfaces(stats) {
  return Object.keys(stats).filter(iface => iface !== 'lo');
}

// Pick main iface (not lo) based on largest total traffic
function pickIface(stats) {
  let best = null;
  let bestTotal = -1;

  for (const [iface, v] of Object.entries(stats)) {
    if (iface === 'lo') continue;
    const total = v.rxBytes + v.txBytes;
    if (total > bestTotal) {
      bestTotal = total;
      best = iface;
    }
  }

  return best;
}

// Read /proc/meminfo and return memory usage percentage (0-100)
function readMemoryPercent() {
  const path = '/proc/meminfo';
  try {
    const [ok, bytes] = GLib.file_get_contents(path);
    if (!ok) return 0;

    const text = new TextDecoder('utf-8').decode(bytes);
    const lines = text.split('\n');

    let memTotal = 0;
    let memAvailable = 0;

    for (const line of lines) {
      if (line.startsWith('MemTotal:')) {
        const parts = line.split(/\s+/);
        memTotal = Number(parts[1] ?? 0);
      } else if (line.startsWith('MemAvailable:')) {
        const parts = line.split(/\s+/);
        memAvailable = Number(parts[1] ?? 0);
      }
    }

    if (memTotal <= 0) return 0;

    const used = memTotal - memAvailable;
    const percent = (used / memTotal) * 100;
    return clamp(percent, 0, 100);
  } catch {
    return 0;
  }
}

// Read /proc/stat and return CPU usage percentage (0-100)
function readCpuPercent(prevStats) {
  const path = '/proc/stat';
  try {
    const [ok, bytes] = GLib.file_get_contents(path);
    if (!ok) return { percent: 0, stats: null };

    const text = new TextDecoder('utf-8').decode(bytes);
    const lines = text.split('\n');

    // Parse first line: "cpu user nice system idle iowait irq softirq steal guest guest_nice"
    const cpuLine = lines.find(line => line.startsWith('cpu '));
    if (!cpuLine) return { percent: 0, stats: null };

    const parts = cpuLine.split(/\s+/).slice(1); // Skip 'cpu' label
    const user = Number(parts[0] ?? 0);
    const nice = Number(parts[1] ?? 0);
    const system = Number(parts[2] ?? 0);
    const idle = Number(parts[3] ?? 0);
    const iowait = Number(parts[4] ?? 0);
    const irq = Number(parts[5] ?? 0);
    const softirq = Number(parts[6] ?? 0);
    const steal = Number(parts[7] ?? 0);

    const currentStats = {
      idle: idle + iowait,
      total: user + nice + system + idle + iowait + irq + softirq + steal,
    };

    // Need previous stats to calculate delta
    if (!prevStats || !prevStats.total) {
      return { percent: 0, stats: currentStats };
    }

    const totalDelta = currentStats.total - prevStats.total;
    const idleDelta = currentStats.idle - prevStats.idle;

    if (totalDelta <= 0) return { percent: 0, stats: currentStats };

    const percent = ((totalDelta - idleDelta) / totalDelta) * 100;
    return { percent: clamp(percent, 0, 100), stats: currentStats };
  } catch {
    return { percent: 0, stats: null };
  }
}

export default class NetSpeedAnimalsExtension extends Extension {
  enable() {
    // Load settings first (needed for language override)
    this._settings = this.getSettings();

    // Apply language override before any gettext calls
    const lang = this._settings.get_string('language');
    this._origLanguage = GLib.getenv('LANGUAGE') || '';
    if (lang) {
      GLib.setenv('LANGUAGE', lang, true);
    }

    // Initialize gettext
    const domain = this.metadata['gettext-domain'] || this.metadata.uuid;
    this._ = this.gettext.bind(this);

    // Indicator with built-in popup menu (left click)
    this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

    // Create a box to hold icon and speed label
    const box = new St.BoxLayout({
      style_class: 'panel-status-menu-box',
      style: 'padding-right: 20px;',
    });

    this._icon = new St.Icon({
        gicon: null,
        icon_size: 32,
        style_class: 'system-status-icon netspeed-icon',
    });

    this._blobIcon = new St.Icon({
        gicon: null,
        icon_size: 32,
        style_class: 'system-status-icon netspeed-blob-icon',
    });

    this._cpuIcon = new St.Icon({
        gicon: null,
        icon_size: 32,
        style_class: 'system-status-icon netspeed-cpu-icon',
    });

    this._temperatureIcon = new St.Icon({
        gicon: null,
        icon_size: 32,
        style_class: 'system-status-icon netspeed-temperature-icon',
    });

    this._speedLabel = new St.Label({
        text: '-- B/s',
        style_class: 'netspeed-label',
        style: 'min-width: 70px; text-align: right;',
      });

    this._memoryLabel = new St.Label({
        text: '-- %',
        style_class: 'netspeed-memory-label',
      });

    this._cpuLabel = new St.Label({
        text: '-- %',
        style_class: 'netspeed-cpu-label',
      });

    this._temperatureLabel = new St.Label({
        text: '--°C',
        style_class: 'netspeed-temperature-label',
      });

    this._diskIcon = new St.Icon({
        gicon: null,
        icon_size: 32,
        style_class: 'system-status-icon netspeed-disk-icon',
    });

    this._diskLabel = new St.Label({
        text: '-- MB/s',
        style_class: 'netspeed-disk-label',
      });

    // Initially set visibility based on settings
    const showAnimalIcon = this._settings.get_boolean('show-animal-icon');
    this._icon.visible = showAnimalIcon;

    const showMemoryIcon = this._settings.get_boolean('show-memory-icon');
    this._blobIcon.visible = showMemoryIcon;

    const showCpuIcon = this._settings.get_boolean('show-cpu-icon');
    this._cpuIcon.visible = showCpuIcon;

    const showSpeedLabel = this._settings.get_boolean('show-speed-label');
    this._speedLabel.visible = showSpeedLabel;

    const showMemoryLabel = this._settings.get_boolean('show-memory-label');
    this._memoryLabel.visible = showMemoryLabel;

    const showCpuLabel = this._settings.get_boolean('show-cpu-label');
    this._cpuLabel.visible = showCpuLabel;

    const showTemperatureIcon = this._settings.get_boolean('show-temperature-icon');
    this._temperatureIcon.visible = showTemperatureIcon;

    const showTemperatureLabel = this._settings.get_boolean('show-temperature-label');
    this._temperatureLabel.visible = showTemperatureLabel;

    const showDiskIcon = this._settings.get_boolean('show-disk-icon');
    this._diskIcon.visible = showDiskIcon;

    const showDiskLabel = this._settings.get_boolean('show-disk-label');
    this._diskLabel.visible = showDiskLabel;

    // Listen for changes to show-animal-icon setting
    this._settings.connect('changed::show-animal-icon', () => {
      const shouldShow = this._settings.get_boolean('show-animal-icon');
      if (this._icon) {
        this._icon.visible = shouldShow;
      }
    });

    // Listen for changes to show-memory-icon setting
    this._settings.connect('changed::show-memory-icon', () => {
      const shouldShow = this._settings.get_boolean('show-memory-icon');
      if (this._blobIcon) {
        this._blobIcon.visible = shouldShow;
      }
    });

    // Listen for changes to show-cpu-icon setting
    this._settings.connect('changed::show-cpu-icon', () => {
      const shouldShow = this._settings.get_boolean('show-cpu-icon');
      if (this._cpuIcon) {
        this._cpuIcon.visible = shouldShow;
      }
    });

    // Listen for changes to show-speed-label setting
    this._settings.connect('changed::show-speed-label', () => {
      const shouldShow = this._settings.get_boolean('show-speed-label');
      if (this._speedLabel) {
        this._speedLabel.visible = shouldShow;
      }
    });

    // Listen for changes to show-memory-label setting
    this._settings.connect('changed::show-memory-label', () => {
      const shouldShow = this._settings.get_boolean('show-memory-label');
      if (this._memoryLabel) {
        this._memoryLabel.visible = shouldShow;
      }
    });

    // Listen for changes to show-cpu-label setting
    this._settings.connect('changed::show-cpu-label', () => {
      const shouldShow = this._settings.get_boolean('show-cpu-label');
      if (this._cpuLabel) {
        this._cpuLabel.visible = shouldShow;
      }
    });

    // Listen for changes to show-temperature-icon setting
    this._settings.connect('changed::show-temperature-icon', () => {
      const shouldShow = this._settings.get_boolean('show-temperature-icon');
      if (this._temperatureIcon) {
        this._temperatureIcon.visible = shouldShow;
      }
    });

    // Listen for changes to show-temperature-label setting
    this._settings.connect('changed::show-temperature-label', () => {
      const shouldShow = this._settings.get_boolean('show-temperature-label');
      if (this._temperatureLabel) {
        this._temperatureLabel.visible = shouldShow;
      }
    });

    // Listen for changes to show-disk-icon setting
    this._settings.connect('changed::show-disk-icon', () => {
      const shouldShow = this._settings.get_boolean('show-disk-icon');
      if (this._diskIcon) {
        this._diskIcon.visible = shouldShow;
      }
    });

    // Listen for changes to show-disk-label setting
    this._settings.connect('changed::show-disk-label', () => {
      const shouldShow = this._settings.get_boolean('show-disk-label');
      if (this._diskLabel) {
        this._diskLabel.visible = shouldShow;
      }
    });

    // Listen for changes to disable-animation setting
    this._settings.connect('changed::disable-animation', () => {
      this._applyFrame(true);
    });

    this._sepLabelSpped = new St.Label({
      text: '  ',
      style_class: 'separate-label',
    });
    
    this._sepLabelMem = new St.Label({
      text: '  ',
      style_class: 'separate-label',
    });

    this._sepLabelCpu = new St.Label({
      text: '  ',
      style_class: 'separate-label',
    });

    
    box.add_child(this._icon);
    box.add_child(this._speedLabel);
    
    // if(this._speedLabel || this._icon)
    box.add_child(this._sepLabelSpped);

    
    box.add_child(this._blobIcon);
    box.add_child(this._memoryLabel);
    // if(this._blobIcon || this._memoryLabel)
    box.add_child(this._sepLabelMem);

    
    box.add_child(this._cpuIcon);
    box.add_child(this._cpuLabel);
    // if(this._cpuIcon || this._cpuLabel)
    box.add_child(this._sepLabelCpu);
    
    box.add_child(this._temperatureIcon);
    box.add_child(this._temperatureLabel);

    box.add_child(this._diskIcon);
    box.add_child(this._diskLabel);

    // Make box reactive to capture click events
    box.reactive = true;
    box.track_hover = true;

    // Left-click: Cycle through speed display modes
    box.connect('button-press-event', (actor, event) => {
      const button = event.get_button();

      if (button === 1) { // Left-click
        // Only cycle if the setting is enabled
        if (this._settings.get_boolean('enable-left-click-cycle')) {
          this._cycleSpeedDisplayMode();
          return true; // Event handled
        }
      } else if (button === 2) { // Middle-click
        if (this._settings.get_boolean('enable-middle-click-preference')) {
          this.openPreferences();
          return true; // Event handled
        }
      }

      return false; // Let other handlers process
    });

    // Scroll: Cycle through network interfaces
    box.connect('scroll-event', (actor, event) => {
      // Only allow scrolling if the setting is enabled
      if (!this._settings.get_boolean('enable-scroll-interface-switch')) {
        return false;
      }

      const direction = event.get_scroll_direction();

      if (direction === 0 || direction === 1) { // Up or Down
        this._cycleNetworkInterface(direction === 0 ? 1 : -1);
        return true; // Event handled
      }

      return false;
    });

    this._indicator.add_child(box);

    // Menu content
    this._speedItem = new PopupMenu.PopupMenuItem(this._('Speed: --'), { reactive: false });
    this._ifaceItem = new PopupMenu.PopupMenuItem(this._('Interface: --'), { reactive: false });
    // this._animalItem = new PopupMenu.PopupMenuItem(this._('Animal: --'), { reactive: false });
    this._memoryItem = new PopupMenu.PopupMenuItem(this._('Memory: --'), { reactive: false });
    this._cpuItem = new PopupMenu.PopupMenuItem(this._('CPU: --'), { reactive: false });
    this._temperatureItem = new PopupMenu.PopupMenuItem(this._('Temperature: --'), { reactive: false });
    this._diskItem = new PopupMenu.PopupMenuItem(this._('Disk I/O: --'), { reactive: false })

    this._indicator.menu.addMenuItem(this._speedItem);
    this._indicator.menu.addMenuItem(this._ifaceItem);
    // this._indicator.menu.addMenuItem(this._animalItem);
    this._indicator.menu.addMenuItem(this._memoryItem);
    this._indicator.menu.addMenuItem(this._cpuItem);
    this._indicator.menu.addMenuItem(this._temperatureItem);
    this._indicator.menu.addMenuItem(this._diskItem);
    this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    // Speed graph (conditionally shown)
    this._speedGraph = new SpeedGraph({
      width: 300,
      height: 60,
      maxDataPoints: 60,
    });

    // Wrap graph in a PopupMenuItem container
    this._graphMenuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    const speedGraphBox = new St.BoxLayout({ vertical: true, x_expand: true });
    const speedGraphTopLabel = new St.Label({
      text: 'Mbit/s',
      style: 'font-size: 9px; color: #4ade80; margin-bottom: 2px;',
      x_align: 1, // Clutter.ActorAlign.START
      x_expand: true,
    });
    speedGraphBox.add_child(speedGraphTopLabel);
    speedGraphBox.add_child(this._speedGraph);
    speedGraphBox.add_child(new St.Label({
      text: 'Network',
      style: 'font-size: 9px; color: #4ade80; text-align: right; margin-top: 2px;',
      x_align: 2,
      x_expand: true,
    }));
    this._graphMenuItem.add_child(speedGraphBox);

    // Initially hide graph if disabled
    const showGraph = this._settings.get_boolean('show-speed-graph');
    this._graphMenuItem.visible = showGraph;

    // Listen for changes to show-speed-graph setting
    this._settings.connect('changed::show-speed-graph', () => {
      const shouldShow = this._settings.get_boolean('show-speed-graph');
      if (this._graphMenuItem) this._graphMenuItem.visible = shouldShow;
    });

    this._indicator.menu.addMenuItem(this._graphMenuItem);

    // Memory graph
    this._memoryGraph = new SystemGraph({
      width: 300,
      height: 60,
      maxDataPoints: 60,
      lineColor: '#fbbf24', // Yellow
      title: 'Memory Usage',
      unit: '%',
      minValue: 0,
      maxValue: 100,
    });

    this._memoryGraphMenuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    const memoryGraphBox = new St.BoxLayout({ vertical: true, x_expand: true });
    memoryGraphBox.add_child(new St.Label({
      text: '%',
      style: 'font-size: 9px; color: #fbbf24; margin-bottom: 2px;',
      x_align: 1,
      x_expand: true,
    }));
    memoryGraphBox.add_child(this._memoryGraph);
    memoryGraphBox.add_child(new St.Label({
      text: 'Memory',
      style: 'font-size: 9px; color: #fbbf24; text-align: right; margin-top: 2px;',
      x_align: 2,
      x_expand: true,
    }));
    this._memoryGraphMenuItem.add_child(memoryGraphBox);

    const showMemoryGraph = this._settings.get_boolean('show-memory-graph');
    this._memoryGraphMenuItem.visible = showMemoryGraph;

    this._settings.connect('changed::show-memory-graph', () => {
      const shouldShow = this._settings.get_boolean('show-memory-graph');
      if (this._memoryGraphMenuItem) this._memoryGraphMenuItem.visible = shouldShow;
    });

    this._indicator.menu.addMenuItem(this._memoryGraphMenuItem);

    // CPU graph
    this._cpuGraph = new SystemGraph({
      width: 300,
      height: 60,
      maxDataPoints: 60,
      lineColor: '#60a5fa', // Blue
      title: 'CPU Usage',
      unit: '%',
      minValue: 0,
      maxValue: 100,
    });

    this._cpuGraphMenuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    const cpuGraphBox = new St.BoxLayout({ vertical: true, x_expand: true });
    cpuGraphBox.add_child(new St.Label({
      text: '%',
      style: 'font-size: 9px; color: #60a5fa; margin-bottom: 2px;',
      x_align: 1,
      x_expand: true,
    }));
    cpuGraphBox.add_child(this._cpuGraph);
    cpuGraphBox.add_child(new St.Label({
      text: 'CPU',
      style: 'font-size: 9px; color: #60a5fa; text-align: right; margin-top: 2px;',
      x_align: 2,
      x_expand: true,
    }));
    this._cpuGraphMenuItem.add_child(cpuGraphBox);

    const showCpuGraph = this._settings.get_boolean('show-cpu-graph');
    this._cpuGraphMenuItem.visible = showCpuGraph;

    this._settings.connect('changed::show-cpu-graph', () => {
      const shouldShow = this._settings.get_boolean('show-cpu-graph');
      if (this._cpuGraphMenuItem) this._cpuGraphMenuItem.visible = shouldShow;
    });

    this._indicator.menu.addMenuItem(this._cpuGraphMenuItem);

    // Temperature graph
    this._temperatureGraph = new SystemGraph({
      width: 300,
      height: 60,
      maxDataPoints: 60,
      lineColor: '#f87171', // Red
      title: 'Temperature',
      unit: '°C',
      minValue: 20,
      maxValue: 100,
    });

    this._temperatureGraphMenuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    const tempGraphBox = new St.BoxLayout({ vertical: true, x_expand: true });
    tempGraphBox.add_child(new St.Label({
      text: '°C',
      style: 'font-size: 9px; color: #f87171; margin-bottom: 2px;',
      x_align: 1,
      x_expand: true,
    }));
    tempGraphBox.add_child(this._temperatureGraph);
    tempGraphBox.add_child(new St.Label({
      text: 'Temperature',
      style: 'font-size: 9px; color: #f87171; text-align: right; margin-top: 2px;',
      x_align: 2,
      x_expand: true,
    }));
    this._temperatureGraphMenuItem.add_child(tempGraphBox);

    const showTemperatureGraph = this._settings.get_boolean('show-temperature-graph');
    this._temperatureGraphMenuItem.visible = showTemperatureGraph;

    this._settings.connect('changed::show-temperature-graph', () => {
      const shouldShow = this._settings.get_boolean('show-temperature-graph');
      if (this._temperatureGraphMenuItem) this._temperatureGraphMenuItem.visible = shouldShow;
    });

    this._indicator.menu.addMenuItem(this._temperatureGraphMenuItem);

    // Disk I/O graph
    this._diskGraph = new SystemGraph({
      width: 300,
      height: 60,
      maxDataPoints: 60,
      lineColor: '#a78bfa', // Purple
      title: 'Disk I/O',
      unit: 'MB/s',
      minValue: 0,
      maxValue: 100, // Will auto-scale
    });

    this._diskGraphMenuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    const diskGraphBox = new St.BoxLayout({ vertical: true, x_expand: true });
    diskGraphBox.add_child(new St.Label({
      text: 'MB/s',
      style: 'font-size: 9px; color: #a78bfa; margin-bottom: 2px;',
      x_align: 1,
      x_expand: true,
    }));
    diskGraphBox.add_child(this._diskGraph);
    diskGraphBox.add_child(new St.Label({
      text: 'Disk I/O',
      style: 'font-size: 9px; color: #a78bfa; text-align: right; margin-top: 2px;',
      x_align: 2,
      x_expand: true,
    }));
    this._diskGraphMenuItem.add_child(diskGraphBox);

    const showDiskGraph = this._settings.get_boolean('show-disk-graph');
    this._diskGraphMenuItem.visible = showDiskGraph;

    this._settings.connect('changed::show-disk-graph', () => {
      const shouldShow = this._settings.get_boolean('show-disk-graph');
      if (this._diskGraphMenuItem) this._diskGraphMenuItem.visible = shouldShow;
    });

    this._indicator.menu.addMenuItem(this._diskGraphMenuItem);
    this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    // Statistics submenu (conditionally shown)
    this._statsSubmenu = new PopupMenu.PopupSubMenuMenuItem(this._('Network Statistics'));

    // Statistics menu items
    this._statsSessionItem = new PopupMenu.PopupMenuItem(this._('Session: --'), { reactive: false });
    this._statsDailyItem = new PopupMenu.PopupMenuItem(this._('Daily: --'), { reactive: false });
    this._statsWeeklyItem = new PopupMenu.PopupMenuItem(this._('Weekly: --'), { reactive: false });
    this._statsMonthlyItem = new PopupMenu.PopupMenuItem(this._('Monthly: --'), { reactive: false });

    this._statsSubmenu.menu.addMenuItem(this._statsSessionItem);
    this._statsSubmenu.menu.addMenuItem(this._statsDailyItem);
    this._statsSubmenu.menu.addMenuItem(this._statsWeeklyItem);
    this._statsSubmenu.menu.addMenuItem(this._statsMonthlyItem);
    this._statsSubmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    // Reset session stats button
    this._resetStatsItem = new PopupMenu.PopupMenuItem(this._('Reset Session Stats'));
    this._resetStatsItem.connect('activate', () => {
      if (this._statsStorage) {
        this._statsStorage.resetSession();
        this._updateStatisticsMenu();
      }
    });
    this._statsSubmenu.menu.addMenuItem(this._resetStatsItem);

    // Initially hide statistics submenu if disabled
    const showStats = this._settings.get_boolean('show-statistics');
    this._statsSubmenu.visible = showStats;

    // Listen for changes to show-statistics setting
    this._settings.connect('changed::show-statistics', () => {
      const shouldShow = this._settings.get_boolean('show-statistics');
      if (this._statsSubmenu) this._statsSubmenu.visible = shouldShow;
    });

    this._indicator.menu.addMenuItem(this._statsSubmenu);

    // Bandwidth quota bar
    this._quotaBar = new QuotaBar({
      width: 300,
      height: 24,
    });

    this._quotaMenuItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      can_focus: false,
    });
    this._quotaMenuItem.add_child(this._quotaBar);

    // Only show if quota is configured (> 0)
    const quotaGB = this._settings.get_double('bandwidth-quota-gb');
    this._quotaMenuItem.visible = quotaGB > 0;

    this._settings.connect('changed::bandwidth-quota-gb', () => {
      const q = this._settings.get_double('bandwidth-quota-gb');
      if (this._quotaMenuItem) this._quotaMenuItem.visible = q > 0;
    });

    this._indicator.menu.addMenuItem(this._quotaMenuItem);
    this._indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const prefsItem = new PopupMenu.PopupMenuItem(this._('Preferences'));
    prefsItem.connect('activate', () => {
      this._settings.set_string('prefs-start-page', 'general');
      this.openPreferences();
    });
    this._indicator.menu.addMenuItem(prefsItem);

    const aboutItem = new PopupMenu.PopupMenuItem(_('About'));
    aboutItem.connect('activate', () => {
      // Set requested start page then open prefs
      this._settings.set_string('prefs-start-page', 'about');
      this.openPreferences();
    });
    this._indicator.menu.addMenuItem(aboutItem);

    const restartItem = new PopupMenu.PopupMenuItem(this._('Restart Extension'));
    restartItem.connect('activate', () => {
      const uuid = this.uuid;
      Main.extensionManager.disableExtension(uuid);
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 300, () => {
        Main.extensionManager.enableExtension(uuid);
        return GLib.SOURCE_REMOVE;
      });
    });
    this._indicator.menu.addMenuItem(restartItem);
    // this._indicator.menu.addMenuItem(disableItem);

    Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');

    // Load frames
    this._frames = {
      snail: this._loadFrames('snail', 8),
      turtle: this._loadFrames('turtle', 8),
      rabbit: this._loadFrames('rabbit', 8),
    };

    // Load blob icons for memory usage (4 levels: 0-25%, 25-50%, 50-75%, 75-100%)
    this._blobFrames = this._loadFrames('blob', 4);

    // Load CPU icons (4 levels similar to memory blob)
    this._cpuFrames = this._loadFrames('cpu', 4);

    // Load temperature icons (4 levels: cool, warm, hot, critical)
    this._temperatureFrames = this._loadFrames('temperature', 4);

    // Load disk icons (4 levels: idle, low, medium, high)
    this._diskFrames = this._loadFrames('disk', 4);

    // Load fixed (static) icons for each animal
    this._fixedFrames = {
      snail: this._loadFixedIcon('snail'),
      turtle: this._loadFixedIcon('turtle'),
      rabbit: this._loadFixedIcon('rabbit'),
    };

    this._animal = 'snail';
    this._frameIndex = 0;

    // Network measurement state
    this._prevStats = readNetDev();
    this._iface = pickIface(this._prevStats);
    this._prevTimeUs = GLib.get_monotonic_time();

    // CPU measurement state
    this._cpuStats = null;
    const cpuResult = readCpuPercent(null);
    this._cpuStats = cpuResult.stats;

    // Temperature monitoring
    this._temperatureMonitor = new TemperatureMonitor();
    if (this._temperatureMonitor.isAvailable()) {
      const zoneName = this._settings.get_string('temperature-zone');
      if (zoneName) {
        this._temperatureMonitor.setZoneByName(zoneName);
      }
    }

    // Disk I/O monitoring
    this._diskMonitor = new DiskMonitor();
    if (this._diskMonitor.isAvailable()) {
      const deviceName = this._settings.get_string('disk-device');
      if (deviceName) {
        this._diskMonitor.setDevice(deviceName);
      }
    }

    // Statistics storage
    this._statsStorage = null;
    if (this._settings.get_boolean('track-statistics')) {
      const dataDir = GLib.build_filenamev([GLib.get_user_data_dir(), 'gnome-shell', 'extensions', this.metadata.uuid]);
      this._statsStorage = new StatisticsStorage(dataDir);
      this._statsStorage.startAutoSave(60); // Save every 60 seconds
      this._updateStatisticsMenu();
    }

    // Notification manager
    this._notificationManager = null;
    if (this._settings.get_boolean('enable-notifications')) {
      this._notificationManager = new NotificationManager(this._settings);
    }

    // Animation timer state
    this._animIntervalMs = 250;
    this._animTimerId = 0;

    // Apply first frame and start timers
    this._applyFrame(true);

    this._measureTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
      this._updateSpeedAndUi();
      return GLib.SOURCE_CONTINUE;
    });

    this._animTimerId = this._startAnimTimer(this._animIntervalMs);
  }

  disable() {
    // Restore original LANGUAGE env
    if (this._origLanguage) {
      GLib.setenv('LANGUAGE', this._origLanguage, true);
    } else {
      GLib.unsetenv('LANGUAGE');
    }

    // Clean timers
    if (this._measureTimerId) {
      GLib.source_remove(this._measureTimerId);
      this._measureTimerId = 0;
    }
    if (this._animTimerId) {
      GLib.source_remove(this._animTimerId);
      this._animTimerId = 0;
    }

    // Destroy indicator
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }

    // Clear refs
    this._icon = null;
    this._blobIcon = null;
    this._cpuIcon = null;
    this._temperatureIcon = null;
    this._diskIcon = null;
    this._speedLabel = null;
    this._memoryLabel = null;
    this._cpuLabel = null;
    this._temperatureLabel = null;
    this._diskLabel = null;
    this._speedItem = null;
    this._ifaceItem = null;
    this._animalItem = null;
    this._memoryItem = null;
    this._cpuItem = null;
    this._temperatureItem = null;
    this._diskItem = null;
    this._frames = null;
    this._fixedFrames = null;
    this._blobFrames = null;
    this._cpuFrames = null;
    this._temperatureFrames = null;
    this._diskFrames = null;
    this._prevStats = null;
    this._iface = null;
    this._cpuStats = null;
    this._temperatureMonitor = null;

    // Clean up disk monitor
    if (this._diskMonitor) {
      this._diskMonitor.destroy();
      this._diskMonitor = null;
    }

    // Clean up statistics storage
    if (this._statsStorage) {
      this._statsStorage.destroy();
      this._statsStorage = null;
    }

    // Clean up speed graph
    if (this._speedGraph) {
      this._speedGraph.destroy();
      this._speedGraph = null;
    }
    this._graphMenuItem = null;

    // Clean up memory graph
    if (this._memoryGraph) {
      this._memoryGraph.destroy();
      this._memoryGraph = null;
    }
    this._memoryGraphMenuItem = null;

    // Clean up CPU graph
    if (this._cpuGraph) {
      this._cpuGraph.destroy();
      this._cpuGraph = null;
    }
    this._cpuGraphMenuItem = null;

    // Clean up temperature graph
    if (this._temperatureGraph) {
      this._temperatureGraph.destroy();
      this._temperatureGraph = null;
    }
    this._temperatureGraphMenuItem = null;

    // Clean up disk graph
    if (this._diskGraph) {
      this._diskGraph.destroy();
      this._diskGraph = null;
    }
    this._diskGraphMenuItem = null;

    // Clean up quota bar
    if (this._quotaBar) {
      this._quotaBar.destroy();
      this._quotaBar = null;
    }
    this._quotaMenuItem = null;

    // Clean up notification manager
    if (this._notificationManager) {
      this._notificationManager.destroy();
      this._notificationManager = null;
    }

    this._statsSubmenu = null;
    this._statsSessionItem = null;
    this._statsDailyItem = null;
    this._statsWeeklyItem = null;
    this._statsMonthlyItem = null;
    this._resetStatsItem = null;

    this._settings = null;
  }

  _loadFrames(animal, count) {
    const arr = [];
    for (let i = 1; i <= count; i++) {
      const filePath = `${this.path}/icons/${animal}/${animal}-${i}.svg`;
      const file = Gio.File.new_for_path(filePath);
      if (file.query_exists(null)) {
        arr.push(new Gio.FileIcon({ file }));
      }
    }
    return arr;
  }

  _loadFixedIcon(animal) {
    const filePath = `${this.path}/icons/${animal}/fixed-${animal}.svg`;
    const file = Gio.File.new_for_path(filePath);
    if (file.query_exists(null)) {
      return new Gio.FileIcon({ file });
    }
    return null;
  }

  _startAnimTimer(intervalMs) {
    if (this._animTimerId) GLib.source_remove(this._animTimerId);
    return GLib.timeout_add(GLib.PRIORITY_DEFAULT, intervalMs, () => {
      this._tickAnim();
      return GLib.SOURCE_CONTINUE;
    });
  }

  _tickAnim() {
    if (!this._icon || !this._frames) return;
    if (this._settings && this._settings.get_boolean('disable-animation')) return;

    const frames = this._frames[this._animal] ?? [];
    if (frames.length === 0) return;

    this._frameIndex = (this._frameIndex + 1) % frames.length;
    this._icon.gicon = frames[this._frameIndex];
  }

  _applyFrame(forceFirst = false) {
    if (!this._icon || !this._frames) return;

    // Static icon mode: use fixed-<animal>.svg if available, otherwise system icon
    if (this._settings && this._settings.get_boolean('disable-animation')) {
      const fixedIcon = this._fixedFrames?.[this._animal];
      if (fixedIcon) {
        this._icon.gicon = fixedIcon;
      } else {
        this._icon.gicon = new Gio.ThemedIcon({ name: 'network-transmit-receive-symbolic' });
      }
      return;
    }

    const frames = this._frames[this._animal] ?? [];
    if (frames.length === 0) {
      this._icon.gicon = new Gio.ThemedIcon({ name: 'network-transmit-receive-symbolic' });
      return;
    }

    if (forceFirst) this._frameIndex = 0;
    this._icon.gicon = frames[this._frameIndex];
  }

  _selectInterface(stats) {
    const mode = this._settings.get_string('interface-mode');

    if (mode === 'manual') {
      const pinned = this._settings.get_string('pinned-interface');
      if (pinned && stats[pinned]) {
        return pinned;
      }
    }

    // Fallback to auto-detection
    return pickIface(stats);
  }

  _updateSpeedAndUi() {
    const nowUs = GLib.get_monotonic_time();
    const dtSec = (nowUs - this._prevTimeUs) / 1_000_000;
    this._prevTimeUs = nowUs;

    const cur = readNetDev();

    if (!this._iface) this._iface = this._selectInterface(cur);

    const prev = this._prevStats?.[this._iface];
    const curr = cur?.[this._iface];

    // If iface missing, repick and update ui
    if (!prev || !curr) {
      this._prevStats = cur;
      this._iface = this._selectInterface(cur);
      const memoryPercent = readMemoryPercent();
      const cpuResult = readCpuPercent(this._cpuStats);
      this._cpuStats = cpuResult.stats;
      const cpuPercent = cpuResult.percent;
      const temperature = this._temperatureMonitor ? this._temperatureMonitor.readTemperature() : null;
      const diskIO = this._diskMonitor ? this._diskMonitor.readDiskIO() : { readSpeed: 0, writeSpeed: 0 };
      this._renderUi(null, null, null, null, null, memoryPercent, cpuPercent, temperature, diskIO.readSpeed, diskIO.writeSpeed);
      return;
    }

    const dRx = curr.rxBytes - prev.rxBytes;
    const dTx = curr.txBytes - prev.txBytes;

    // Add traffic to statistics if tracking is enabled
    if (this._statsStorage && dRx >= 0 && dTx >= 0) {
      this._statsStorage.addTraffic(dRx, dTx);
    }

    const rxBytesPerSec = dRx / Math.max(dtSec, 0.001);
    const txBytesPerSec = dTx / Math.max(dtSec, 0.001);
    const bytesPerSec = (dRx + dTx) / Math.max(dtSec, 0.001);
    this._prevStats = cur;

    const mbit = (bytesPerSec * 8) / 1_000_000;

    // Get thresholds from settings
    const turtleThreshold = this._settings.get_double('turtle-threshold');
    const rabbitThreshold = this._settings.get_double('rabbit-threshold');
    const minAnimSpeed = this._settings.get_int('min-anim-speed');
    const maxAnimSpeed = this._settings.get_int('max-anim-speed');

    // Animal thresholds (from settings)
    let animal = 'snail';
    if (mbit >= rabbitThreshold) animal = 'rabbit';
    else if (mbit >= turtleThreshold) animal = 'turtle';

    // Animation speed based on settings
    // lower mbit => higher interval (slower), higher mbit => lower interval (faster)
    const maxMbit = Math.max(rabbitThreshold * 2, 100);
    const t = clamp(mbit / maxMbit, 0, 1);
    const targetInterval = Math.round(maxAnimSpeed - t * (maxAnimSpeed - minAnimSpeed));

    const animalChanged = animal !== this._animal;
    this._animal = animal;

    if (animalChanged) {
      this._applyFrame(true);
    }

    if (Math.abs(targetInterval - this._animIntervalMs) > 30) {
      this._animIntervalMs = targetInterval;
      this._animTimerId = this._startAnimTimer(this._animIntervalMs);
    }

    // Get memory usage
    const memoryPercent = readMemoryPercent();

    // Get CPU usage
    const cpuResult = readCpuPercent(this._cpuStats);
    this._cpuStats = cpuResult.stats;
    const cpuPercent = cpuResult.percent;

    // Get temperature
    const temperature = this._temperatureMonitor ? this._temperatureMonitor.readTemperature() : null;

    // Get disk I/O
    const diskIO = this._diskMonitor ? this._diskMonitor.readDiskIO() : { readSpeed: 0, writeSpeed: 0 };

    // IMPORTANT: pass bytesPerSec for formatting
    this._renderUi(bytesPerSec, rxBytesPerSec, txBytesPerSec, this._iface, this._animal, memoryPercent, cpuPercent, temperature, diskIO.readSpeed, diskIO.writeSpeed);

    // Update statistics menu if enabled
    if (this._statsStorage && this._settings.get_boolean('show-statistics')) {
      this._updateStatisticsMenu();
    }
  }

  _applyColorThemes(bytesPerSec, memoryPercent, cpuPercent, temperature = null) {
    // Apply color theme to speed label
    if (this._speedLabel) {
      const mbit = (bytesPerSec * 8) / 1_000_000;
      const turtleThreshold = this._settings.get_double('turtle-threshold');
      const rabbitThreshold = this._settings.get_double('rabbit-threshold');

      this._speedLabel.remove_style_class_name('speed-low');
      this._speedLabel.remove_style_class_name('speed-medium');
      this._speedLabel.remove_style_class_name('speed-high');

      if (mbit < turtleThreshold) {
        this._speedLabel.add_style_class_name('speed-low');
      } else if (mbit < rabbitThreshold) {
        this._speedLabel.add_style_class_name('speed-medium');
      } else {
        this._speedLabel.add_style_class_name('speed-high');
      }
    }

    // Apply color theme to CPU label
    if (this._cpuLabel) {
      const cpuLevel1 = this._settings.get_double('cpu-level-1');
      const cpuLevel2 = this._settings.get_double('cpu-level-2');
      const cpuLevel3 = this._settings.get_double('cpu-level-3');

      this._cpuLabel.remove_style_class_name('cpu-idle');
      this._cpuLabel.remove_style_class_name('cpu-low');
      this._cpuLabel.remove_style_class_name('cpu-medium');
      this._cpuLabel.remove_style_class_name('cpu-high');

      if (cpuPercent < cpuLevel1) {
        this._cpuLabel.add_style_class_name('cpu-idle');
      } else if (cpuPercent < cpuLevel2) {
        this._cpuLabel.add_style_class_name('cpu-low');
      } else if (cpuPercent < cpuLevel3) {
        this._cpuLabel.add_style_class_name('cpu-medium');
      } else {
        this._cpuLabel.add_style_class_name('cpu-high');
      }
    }

    // Apply color theme to memory label
    if (this._memoryLabel) {
      const memLevel2 = this._settings.get_double('memory-level-2');
      const memLevel3 = this._settings.get_double('memory-level-3');

      this._memoryLabel.remove_style_class_name('mem-low');
      this._memoryLabel.remove_style_class_name('mem-medium');
      this._memoryLabel.remove_style_class_name('mem-high');

      if (memoryPercent < memLevel2) {
        this._memoryLabel.add_style_class_name('mem-low');
      } else if (memoryPercent < memLevel3) {
        this._memoryLabel.add_style_class_name('mem-medium');
      } else {
        this._memoryLabel.add_style_class_name('mem-high');
      }
    }

    // Apply color theme to temperature label
    if (this._temperatureLabel && temperature !== null) {
      const warm = this._settings.get_double('temperature-threshold-warm');
      const hot = this._settings.get_double('temperature-threshold-hot');
      const critical = this._settings.get_double('temperature-threshold-critical');

      this._temperatureLabel.remove_style_class_name('temp-cool');
      this._temperatureLabel.remove_style_class_name('temp-warm');
      this._temperatureLabel.remove_style_class_name('temp-hot');
      this._temperatureLabel.remove_style_class_name('temp-critical');

      if (temperature >= critical) {
        this._temperatureLabel.add_style_class_name('temp-critical');
      } else if (temperature >= hot) {
        this._temperatureLabel.add_style_class_name('temp-hot');
      } else if (temperature >= warm) {
        this._temperatureLabel.add_style_class_name('temp-warm');
      } else {
        this._temperatureLabel.add_style_class_name('temp-cool');
      }
    }
  }

  _renderUi(bytesPerSec, rxBytesPerSec, txBytesPerSec, iface, animal, memoryPercent = 0, cpuPercent = 0, temperature = null, diskReadSpeed = 0, diskWriteSpeed = 0) {
    // Update speed label in the panel - adaptive units (Mbit/s, KB/s, or B/s)
    if (this._speedLabel) {
      const displayMode = this._settings.get_string('speed-display-mode');

      if (bytesPerSec === null || bytesPerSec === undefined) {
        this._speedLabel.text = formatSpeed(0);
      } else {
        switch (displayMode) {
          case 'separate':
            this._speedLabel.text = `↓ ${formatSpeed(rxBytesPerSec)} ↑ ${formatSpeed(txBytesPerSec)}`;
            break;
          case 'download-only':
            this._speedLabel.text = `↓ ${formatSpeed(rxBytesPerSec)}`;
            break;
          case 'upload-only':
            this._speedLabel.text = `↑ ${formatSpeed(txBytesPerSec)}`;
            break;
          case 'combined':
          default:
            this._speedLabel.text = formatSpeed(bytesPerSec);
            break;
        }
      }
    }

    // Update memory label in the panel
    if (this._memoryLabel) {
      this._memoryLabel.text = `${memoryPercent.toFixed(1)}%`;
    }

    // Update CPU label in the panel
    if (this._cpuLabel) {
      this._cpuLabel.text = `${cpuPercent.toFixed(1)}%`;
    }

    // Update temperature label in the panel
    if (this._temperatureLabel) {
      if (temperature !== null) {
        this._temperatureLabel.text = formatTemp(temperature);
      } else {
        this._temperatureLabel.text = '--°C';
      }
    }

    // Update disk label in the panel
    if (this._diskLabel) {
      const diskDisplayMode = this._settings.get_string('disk-display-mode');
      const totalDiskSpeed = diskReadSpeed + diskWriteSpeed;

      switch (diskDisplayMode) {
        case 'separate':
          this._diskLabel.text = `R:${formatSpeed(diskReadSpeed)} W:${formatSpeed(diskWriteSpeed)}`;
          break;
        case 'read-only':
          this._diskLabel.text = `R:${formatSpeed(diskReadSpeed)}`;
          break;
        case 'write-only':
          this._diskLabel.text = `W:${formatSpeed(diskWriteSpeed)}`;
          break;
        case 'combined':
        default:
          this._diskLabel.text = formatSpeed(totalDiskSpeed);
          break;
      }
    }

    // Apply color themes if enabled
    if (this._settings.get_boolean('enable-color-themes')) {
      this._applyColorThemes(bytesPerSec, memoryPercent, cpuPercent, temperature);
    }

    // Update blob icon based on memory usage percentage
    if (this._blobIcon && this._blobFrames && this._blobFrames.length > 0) {
      // Get memory level thresholds from settings
      const level1 = this._settings.get_double('memory-level-1');
      const level2 = this._settings.get_double('memory-level-2');
      const level3 = this._settings.get_double('memory-level-3');

      // Determine blob frame index based on memory percent and thresholds
      let blobIndex = 0; // Below level 1
      if (memoryPercent >= level3) {
        blobIndex = 3; // Level 3 and above
      } else if (memoryPercent >= level2) {
        blobIndex = 2; // Level 2 to level 3
      } else if (memoryPercent >= level1) {
        blobIndex = 1; // Level 1 to level 2
      }
      this._blobIcon.gicon = this._blobFrames[blobIndex];
    }

    // Update CPU icon based on CPU usage percentage
    if (this._cpuIcon && this._cpuFrames && this._cpuFrames.length > 0) {
      // Get CPU level thresholds from settings
      const level1 = this._settings.get_double('cpu-level-1');
      const level2 = this._settings.get_double('cpu-level-2');
      const level3 = this._settings.get_double('cpu-level-3');

      // Determine CPU frame index based on CPU percent and thresholds
      let cpuIndex = 0; // Below level 1
      if (cpuPercent >= level3) {
        cpuIndex = 3; // Level 3 and above
      } else if (cpuPercent >= level2) {
        cpuIndex = 2; // Level 2 to level 3
      } else if (cpuPercent >= level1) {
        cpuIndex = 1; // Level 1 to level 2
      }
      this._cpuIcon.gicon = this._cpuFrames[cpuIndex];
    }

    // Update temperature icon based on temperature thresholds
    if (this._temperatureIcon && this._temperatureFrames && this._temperatureFrames.length > 0 && temperature !== null) {
      // Get temperature thresholds from settings
      const warm = this._settings.get_double('temperature-threshold-warm');
      const hot = this._settings.get_double('temperature-threshold-hot');
      const critical = this._settings.get_double('temperature-threshold-critical');

      // Determine temperature frame index based on thresholds
      let tempIndex = 0; // Cool (below warm)
      if (temperature >= critical) {
        tempIndex = 3; // Critical
      } else if (temperature >= hot) {
        tempIndex = 2; // Hot
      } else if (temperature >= warm) {
        tempIndex = 1; // Warm
      }
      this._temperatureIcon.gicon = this._temperatureFrames[tempIndex];
    }

    // Update disk icon based on I/O activity
    if (this._diskIcon && this._diskFrames && this._diskFrames.length > 0 && this._diskMonitor) {
      const diskLevel = this._diskMonitor.getDiskLevel(diskReadSpeed, diskWriteSpeed);
      this._diskIcon.gicon = this._diskFrames[diskLevel];
    }

    if (this._speedItem) {
      if (bytesPerSec === null || bytesPerSec === undefined) {
        this._speedItem.label.text = this._('Speed: --');
      } else {
        const formatted = formatSpeed(bytesPerSec);
        this._speedItem.label.text = `${this._('Speed')}: ${formatted}`;
      }
    }

    if (this._memoryItem) {
      this._memoryItem.label.text = `${this._('Memory')}: ${memoryPercent.toFixed(1)}%`;
    }

    if (this._cpuItem) {
      this._cpuItem.label.text = `CPU: ${cpuPercent.toFixed(1)}%`;
    }

    if (this._temperatureItem) {
      if (temperature !== null) {
        this._temperatureItem.label.text = `${this._('Temperature')}: ${formatTemp(temperature)}`;
      } else {
        this._temperatureItem.label.text = `${this._('Temperature')}: --`;
      }
    }

    if (this._diskItem) {
      const totalDiskSpeed = diskReadSpeed + diskWriteSpeed;
      if (totalDiskSpeed > 0 || diskReadSpeed > 0 || diskWriteSpeed > 0) {
        this._diskItem.label.text = `${this._('Disk I/O')}: R:${formatSpeed(diskReadSpeed)} W:${formatSpeed(diskWriteSpeed)}`;
      } else {
        this._diskItem.label.text = `${this._('Disk I/O')}: --`;
      }
    }

    if (this._ifaceItem) {
      this._ifaceItem.label.text = `${this._('Interface')}: ${iface ?? '--'}`;
    }

    // Update speed graph with new data point
    if (this._speedGraph && this._settings.get_boolean('show-speed-graph')) {
      const downloadSpeed = rxBytesPerSec || 0;
      const uploadSpeed = txBytesPerSec || 0;
      this._speedGraph.addDataPoint(downloadSpeed, uploadSpeed);
    }

    // Update memory graph
    if (this._memoryGraph && this._settings.get_boolean('show-memory-graph')) {
      this._memoryGraph.addDataPoint(memoryPercent);
    }

    // Update CPU graph
    if (this._cpuGraph && this._settings.get_boolean('show-cpu-graph')) {
      this._cpuGraph.addDataPoint(cpuPercent);
    }

    // Update temperature graph
    if (this._temperatureGraph && this._settings.get_boolean('show-temperature-graph')) {
      if (temperature !== null) {
        this._temperatureGraph.addDataPoint(temperature);
      }
    }

    // Update disk I/O graph
    if (this._diskGraph && this._settings.get_boolean('show-disk-graph')) {
      const totalDiskSpeed = (diskReadSpeed + diskWriteSpeed) / (1024 * 1024); // Convert to MB/s
      this._diskGraph.addDataPoint(totalDiskSpeed);
    }

    // Check for notification alerts
    if (this._notificationManager && this._settings.get_boolean('enable-notifications')) {
      // Check network dropout
      if (bytesPerSec !== null && bytesPerSec !== undefined) {
        this._notificationManager.checkNetworkDropout(bytesPerSec);
      }

      // Check CPU high
      if (cpuPercent !== null && cpuPercent !== undefined) {
        this._notificationManager.checkCpuHigh(cpuPercent);
      }

      // Check memory high
      if (memoryPercent !== null && memoryPercent !== undefined) {
        this._notificationManager.checkMemoryHigh(memoryPercent);
      }

      // Check temperature high
      if (temperature !== null) {
        this._notificationManager.checkTemperatureHigh(temperature);
      }

      // Check quota warning (if statistics tracking is enabled)
      if (this._statsStorage) {
        const stats = this._statsStorage.getStats();
        const quotaGB = this._settings.get_double('bandwidth-quota-gb');
        if (quotaGB > 0) {
          const quotaBytes = quotaGB * (1024 ** 3);
          const usedBytes = stats.monthly.total;
          this._notificationManager.checkQuotaWarning(usedBytes, quotaBytes);
        }
      }
    }

    // if (this._animalItem) {
    //   const label = animal === 'snail' ? _('Escargot') : animal === 'turtle' ? _('Tortue') : _('Lapin');
    //   this._animalItem.label.text = `${_('Animal')}: ${animal ? label : '--'}`;
    // }
  }

  _updateStatisticsMenu() {
    if (!this._statsStorage) return;

    const stats = this._statsStorage.getStats();

    if (this._statsSessionItem) {
      this._statsSessionItem.label.text = `${this._('Session')}: ↓ ${formatBytes(stats.session.rx)} ↑ ${formatBytes(stats.session.tx)}`;
    }

    if (this._statsDailyItem) {
      this._statsDailyItem.label.text = `${this._('Daily')}: ↓ ${formatBytes(stats.daily.rx)} ↑ ${formatBytes(stats.daily.tx)}`;
    }

    if (this._statsWeeklyItem) {
      this._statsWeeklyItem.label.text = `${this._('Weekly')}: ↓ ${formatBytes(stats.weekly.rx)} ↑ ${formatBytes(stats.weekly.tx)}`;
    }

    if (this._statsMonthlyItem) {
      this._statsMonthlyItem.label.text = `${this._('Monthly')}: ↓ ${formatBytes(stats.monthly.rx)} ↑ ${formatBytes(stats.monthly.tx)}`;
    }

    // Update quota bar
    if (this._quotaBar) {
      const quotaGB = this._settings.get_double('bandwidth-quota-gb');
      if (quotaGB > 0) {
        this._quotaBar.updateQuota(stats.monthly.total, quotaGB);
      }
    }
  }

  /**
   * Cycle through speed display modes on left-click
   */
  _cycleSpeedDisplayMode() {
    const modes = ['combined', 'separate', 'download-only', 'upload-only'];
    const currentMode = this._settings.get_string('speed-display-mode');
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    this._settings.set_string('speed-display-mode', nextMode);

    // Show notification about the mode change
    const modeNames = {
      'combined': this._('Combined (Total Speed)'),
      'separate': this._('Separate (Download/Upload)'),
      'download-only': this._('Download Only'),
      'upload-only': this._('Upload Only'),
    };

    Main.notify(
      this._('Net Speed Animals'),
      `${this._('Speed Display')}: ${modeNames[nextMode]}`
    );
  }

  /**
   * Cycle through available network interfaces on scroll
   */
  _cycleNetworkInterface(direction) {
    const stats = readNetDev();
    const interfaces = getAllInterfaces(stats);

    if (interfaces.length <= 1) {
      // Only one interface or none, nothing to cycle
      return;
    }

    // Get current interface
    const currentInterface = this._iface || pickIface(stats);
    const currentIndex = interfaces.indexOf(currentInterface);

    // Calculate next interface index
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = interfaces.length - 1;
    if (nextIndex >= interfaces.length) nextIndex = 0;

    const nextInterface = interfaces[nextIndex];

    // Switch to manual mode and set the interface
    this._settings.set_string('interface-mode', 'manual');
    this._settings.set_string('pinned-interface', nextInterface);
    this._iface = nextInterface;

    // Show notification about the interface change
    Main.notify(
      this._('Net Speed Animals'),
      `${this._('Interface')}: ${nextInterface}`
    );
  }
}