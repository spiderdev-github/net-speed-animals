import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import { SpeedGraph } from '../widgets/speedGraph.js';
import { SystemGraph } from '../widgets/systemGraph.js';
import { QuotaBar } from '../widgets/quotaBar.js';
import {
  GRAPH_WIDTH,
  GRAPH_HEIGHT,
  GRAPH_MAX_DATA_POINTS,
  RESTART_DELAY_MS,
} from '../utils/constants.js';

/**
 * Menu builder - constructs the dropdown popup menu
 */
export class MenuBuilder {
  constructor(menu, settings, gettext, callbacks) {
    this._menu = menu;
    this._settings = settings;
    this._ = gettext;
    this._callbacks = callbacks;
    this._signalIds = [];
    this._widgets = {};

    this._build();
  }

  _build() {
    const _ = this._;

    // Menu items
    this._widgets.speedItem = new PopupMenu.PopupMenuItem(_('Speed: --'), { reactive: false });
    this._widgets.speedPeakItem = new PopupMenu.PopupMenuItem(_('Peak: --'), { reactive: false });
    this._widgets.speedAvg1mItem = new PopupMenu.PopupMenuItem(_('Average (1m): --'), { reactive: false });
    this._widgets.speedAvg5mItem = new PopupMenu.PopupMenuItem(_('Average (5m): --'), { reactive: false });
    this._widgets.ifaceItem = new PopupMenu.PopupMenuItem(_('Interface: --'), { reactive: false });
    this._widgets.internetUptimeItem = new PopupMenu.PopupMenuItem(_('Internet uptime: --'), { reactive: false });
    this._widgets.lastOutageItem = new PopupMenu.PopupMenuItem(_('Last outage: --'), { reactive: false });
    this._widgets.memoryItem = new PopupMenu.PopupMenuItem(_('Memory: --'), { reactive: false });
    this._widgets.cpuItem = new PopupMenu.PopupMenuItem(_('CPU: --'), { reactive: false });
    this._widgets.temperatureItem = new PopupMenu.PopupMenuItem(_('Temperature: --'), { reactive: false });
    this._widgets.diskItem = new PopupMenu.PopupMenuItem(_('Disk I/O: --'), { reactive: false });

    this._menu.addMenuItem(this._widgets.speedItem);
    this._menu.addMenuItem(this._widgets.speedPeakItem);
    this._menu.addMenuItem(this._widgets.speedAvg1mItem);
    this._menu.addMenuItem(this._widgets.speedAvg5mItem);
    this._menu.addMenuItem(this._widgets.ifaceItem);
    this._menu.addMenuItem(this._widgets.internetUptimeItem);
    this._menu.addMenuItem(this._widgets.lastOutageItem);
    this._menu.addMenuItem(this._widgets.memoryItem);
    this._menu.addMenuItem(this._widgets.cpuItem);
    this._menu.addMenuItem(this._widgets.temperatureItem);
    this._menu.addMenuItem(this._widgets.diskItem);
    this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const updateAdvancedSpeedStatsVisibility = () => {
      const visible = this._settings.get_boolean('show-speed-advanced-stats');
      this._widgets.speedPeakItem.visible = visible;
      this._widgets.speedAvg1mItem.visible = visible;
      this._widgets.speedAvg5mItem.visible = visible;
    };
    updateAdvancedSpeedStatsVisibility();
    const advancedStatsId = this._settings.connect('changed::show-speed-advanced-stats', updateAdvancedSpeedStatsVisibility);
    this._signalIds.push(advancedStatsId);

    // Graphs
    this._buildGraph('speed', new SpeedGraph({ width: GRAPH_WIDTH, height: GRAPH_HEIGHT, maxDataPoints: GRAPH_MAX_DATA_POINTS }),
      'Mbit/s', '#4ade80', 'Network', 'show-speed-graph');

    this._buildSystemGraph('memory', { lineColor: '#fbbf24', title: 'Memory Usage', unit: '%', minValue: 0, maxValue: 100 },
      '%', '#fbbf24', 'Memory', 'show-memory-graph');

    this._buildSystemGraph('cpu', { lineColor: '#60a5fa', title: 'CPU Usage', unit: '%', minValue: 0, maxValue: 100 },
      '%', '#60a5fa', 'CPU', 'show-cpu-graph');

    this._buildSystemGraph('temperature', { lineColor: '#f87171', title: 'Temperature', unit: '°C', minValue: 20, maxValue: 100 },
      '°C', '#f87171', 'Temperature', 'show-temperature-graph');

    this._buildSystemGraph('disk', { lineColor: '#a78bfa', title: 'Disk I/O', unit: 'MB/s', minValue: 0, maxValue: 100 },
      'MB/s', '#a78bfa', 'Disk I/O', 'show-disk-graph');

    // "View all stats" button - opens System Monitor on Resources tab
    const viewAllItem = new PopupMenu.PopupMenuItem(_('View all stats'));
    viewAllItem.connect('activate', () => {
      try {
        Gio.Subprocess.new(
          ['gnome-system-monitor', '--show-resources-tab'],
          Gio.SubprocessFlags.NONE
        );
      } catch (e) {
        console.error(`Failed to open System Monitor: ${e.message}`);
      }
    });
    this._menu.addMenuItem(viewAllItem);

    this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    // Statistics submenu
    this._buildStatisticsSubmenu();

    // Quota bar
    this._buildQuotaBar();

    this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const silenceItem = new PopupMenu.PopupMenuItem(_('Silence Notifications'));
    silenceItem.connect('activate', () => {
      const now = Date.now();
      const untilMs = this._getSnoozeUntilMs();

      if (untilMs > now) {
        this._settings.set_string('notifications-snooze-until', '');
      } else {
        const duration = Math.max(1, this._settings.get_int('notifications-snooze-duration-minutes'));
        const untilIso = new Date(now + duration * 60 * 1000).toISOString();
        this._settings.set_string('notifications-snooze-until', untilIso);
      }

      this._updateSilenceMenuItemLabel();
    });
    this._widgets.silenceItem = silenceItem;
    this._menu.addMenuItem(silenceItem);

    const silenceSignals = [
      this._settings.connect('changed::notifications-snooze-until', () => this._updateSilenceMenuItemLabel()),
      this._settings.connect('changed::notifications-snooze-duration-minutes', () => this._updateSilenceMenuItemLabel()),
      this._settings.connect('changed::enable-notifications', () => this._updateSilenceMenuItemLabel()),
    ];
    this._signalIds.push(...silenceSignals);
    this._updateSilenceMenuItemLabel();

    this._silenceRefreshId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 30, () => {
      if (!this._settings || !this._widgets.silenceItem) return GLib.SOURCE_REMOVE;
      this._updateSilenceMenuItemLabel();
      return GLib.SOURCE_CONTINUE;
    });

    // Control items
    const prefsItem = new PopupMenu.PopupMenuItem(_('Preferences'));
    prefsItem.connect('activate', () => {
      this._settings.set_string('prefs-start-page', 'general');
      if (this._callbacks.openPreferences) this._callbacks.openPreferences();
    });
    this._menu.addMenuItem(prefsItem);

    const aboutItem = new PopupMenu.PopupMenuItem(_('About'));
    aboutItem.connect('activate', () => {
      this._settings.set_string('prefs-start-page', 'about');
      if (this._callbacks.openPreferences) this._callbacks.openPreferences();
    });
    this._menu.addMenuItem(aboutItem);

    const restartItem = new PopupMenu.PopupMenuItem(_('Restart Extension'));
    restartItem.connect('activate', () => {
      const uuid = this._callbacks.uuid;
      Main.extensionManager.disableExtension(uuid);
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, RESTART_DELAY_MS, () => {
        Main.extensionManager.enableExtension(uuid);
        return GLib.SOURCE_REMOVE;
      });
    });
    this._menu.addMenuItem(restartItem);
  }

  _buildGraph(key, graph, unitLabel, color, name, settingKey) {
    this._widgets[`${key}Graph`] = graph;

    const menuItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
    const box = new St.BoxLayout({ vertical: true, x_expand: true });
    box.add_child(new St.Label({
      text: unitLabel,
      style: `font-size: 9px; color: ${color}; margin-bottom: 2px;`,
      x_align: 1, x_expand: true,
    }));
    box.add_child(graph);
    box.add_child(new St.Label({
      text: name,
      style: `font-size: 9px; color: ${color}; text-align: right; margin-top: 2px;`,
      x_align: 2, x_expand: true,
    }));
    menuItem.add_child(box);

    menuItem.visible = this._settings.get_boolean(settingKey);
    const id = this._settings.connect(`changed::${settingKey}`, () => {
      menuItem.visible = this._settings.get_boolean(settingKey);
    });
    this._signalIds.push(id);

    this._widgets[`${key}GraphMenuItem`] = menuItem;
    this._menu.addMenuItem(menuItem);
  }

  _buildSystemGraph(key, opts, unitLabel, color, name, settingKey) {
    const graph = new SystemGraph({ width: GRAPH_WIDTH, height: GRAPH_HEIGHT, maxDataPoints: GRAPH_MAX_DATA_POINTS, ...opts });
    this._buildGraph(key, graph, unitLabel, color, name, settingKey);
  }

  _buildStatisticsSubmenu() {
    const _ = this._;
    this._widgets.statsSubmenu = new PopupMenu.PopupSubMenuMenuItem(_('Network Statistics'));

    this._widgets.statsSessionItem = new PopupMenu.PopupMenuItem(_('Session: --'), { reactive: false });
    this._widgets.statsDailyItem = new PopupMenu.PopupMenuItem(_('Daily: --'), { reactive: false });
    this._widgets.statsWeeklyItem = new PopupMenu.PopupMenuItem(_('Weekly: --'), { reactive: false });
    this._widgets.statsMonthlyItem = new PopupMenu.PopupMenuItem(_('Monthly: --'), { reactive: false });

    this._widgets.statsSubmenu.menu.addMenuItem(this._widgets.statsSessionItem);
    this._widgets.statsSubmenu.menu.addMenuItem(this._widgets.statsDailyItem);
    this._widgets.statsSubmenu.menu.addMenuItem(this._widgets.statsWeeklyItem);
    this._widgets.statsSubmenu.menu.addMenuItem(this._widgets.statsMonthlyItem);
    this._widgets.statsSubmenu.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const resetItem = new PopupMenu.PopupMenuItem(_('Reset Session Stats'));
    resetItem.connect('activate', () => {
      if (this._callbacks.onResetStats) this._callbacks.onResetStats();
    });
    this._widgets.statsSubmenu.menu.addMenuItem(resetItem);

    this._widgets.statsSubmenu.visible = this._settings.get_boolean('show-statistics');
    const id = this._settings.connect('changed::show-statistics', () => {
      if (this._widgets.statsSubmenu) {
        this._widgets.statsSubmenu.visible = this._settings.get_boolean('show-statistics');
      }
    });
    this._signalIds.push(id);

    this._menu.addMenuItem(this._widgets.statsSubmenu);
  }

  _buildQuotaBar() {
    this._widgets.quotaBar = new QuotaBar({ width: GRAPH_WIDTH, height: 24 });

    this._widgets.quotaMenuItem = new PopupMenu.PopupBaseMenuItem({ reactive: false, can_focus: false });
    this._widgets.quotaMenuItem.add_child(this._widgets.quotaBar);

    const quotaGB = this._settings.get_double('bandwidth-quota-gb');
    this._widgets.quotaMenuItem.visible = quotaGB > 0;

    const id = this._settings.connect('changed::bandwidth-quota-gb', () => {
      const q = this._settings.get_double('bandwidth-quota-gb');
      if (this._widgets.quotaMenuItem) this._widgets.quotaMenuItem.visible = q > 0;
    });
    this._signalIds.push(id);

    this._menu.addMenuItem(this._widgets.quotaMenuItem);
  }

  _getSnoozeUntilMs() {
    const untilIso = this._settings.get_string('notifications-snooze-until');
    if (!untilIso) return 0;

    const untilMs = Date.parse(untilIso);
    if (!Number.isFinite(untilMs)) {
      this._settings.set_string('notifications-snooze-until', '');
      return 0;
    }

    return untilMs;
  }

  _updateSilenceMenuItemLabel() {
    const item = this._widgets.silenceItem;
    if (!item) return;

    const notificationsEnabled = this._settings.get_boolean('enable-notifications');
    item.setSensitive(notificationsEnabled);

    if (!notificationsEnabled) {
      item.label.text = this._('Silence Notifications (disabled)');
      return;
    }

    const now = Date.now();
    const untilMs = this._getSnoozeUntilMs();

    if (untilMs > now) {
      const remainingMin = Math.max(1, Math.ceil((untilMs - now) / 60000));
      item.label.text = `${this._('Resume Notifications')} (${remainingMin} min)`;
      return;
    }

    if (untilMs > 0) {
      this._settings.set_string('notifications-snooze-until', '');
    }

    const duration = Math.max(1, this._settings.get_int('notifications-snooze-duration-minutes'));
    item.label.text = `${this._('Silence Notifications')} (${duration} min)`;
  }

  getWidgets() {
    return this._widgets;
  }

  destroy() {
    if (this._silenceRefreshId) {
      GLib.source_remove(this._silenceRefreshId);
      this._silenceRefreshId = 0;
    }

    for (const id of this._signalIds) {
      try { this._settings.disconnect(id); } catch { /* ignore */ }
    }
    this._signalIds = [];

    // Destroy graphs
    for (const key of ['speedGraph', 'memoryGraph', 'cpuGraph', 'temperatureGraph', 'diskGraph', 'quotaBar']) {
      if (this._widgets[key]) {
        this._widgets[key].destroy();
      }
    }

    this._widgets = {};
    this._settings = null;
  }
}
