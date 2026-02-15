import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { clamp } from './utils/formatters.js';
import { StatisticsStorage } from './utils/storage.js';
import { NotificationManager } from './utils/notifications.js';

import { NetworkMonitor } from './monitors/networkMonitor.js';
import { CpuMonitor } from './monitors/cpuMonitor.js';
import { MemoryMonitor } from './monitors/memoryMonitor.js';
import { TemperatureMonitor } from './monitors/temperatureMonitor.js';
import { DiskMonitor } from './monitors/diskMonitor.js';

import { IconLoader } from './ui/iconLoader.js';
import { AnimationController } from './ui/animationController.js';
import { PanelIndicator } from './ui/panelIndicator.js';
import { MenuBuilder } from './ui/menuBuilder.js';
import { RenderEngine } from './ui/renderEngine.js';

export default class NetSpeedAnimalsExtension extends Extension {
  enable() {
    this._settings = this.getSettings();

    // Apply language override before any gettext calls
    const lang = this._settings.get_string('language');
    this._origLanguage = GLib.getenv('LANGUAGE') || '';
    if (lang) {
      GLib.setenv('LANGUAGE', lang, true);
    }

    this._ = this.gettext.bind(this);

    // Create panel indicator
    this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

    // Build panel bar UI
    this._panelIndicator = new PanelIndicator(this._settings);
    const box = this._panelIndicator.build({
      onLeftClick: () => {
        if (this._settings.get_boolean('enable-left-click-cycle')) {
          this._renderEngine.cycleSpeedDisplayMode();
          return true;
        }
        return false;
      },
      onMiddleClick: () => {
        if (this._settings.get_boolean('enable-middle-click-preference')) {
          this.openPreferences();
          return true;
        }
        return false;
      },
      onScroll: (event) => {
        if (!this._settings.get_boolean('enable-scroll-interface-switch')) return false;
        if (!event) return false;
        const direction = event.get_scroll_direction();
        if (direction === 0 || direction === 1) {
          this._networkMonitor.cycleInterface(direction === 0 ? 1 : -1, this._settings, this._);
          return true;
        }
        return false;
      },
      onAnimationToggle: () => {
        if (this._animController) this._animController.applyFrame(true);
      },
    });
    this._indicator.add_child(box);

    // Build menu
    this._menuBuilder = new MenuBuilder(this._indicator.menu, this._settings, this._, {
      openPreferences: () => this.openPreferences(),
      uuid: this.uuid,
      onResetStats: () => {
        if (this._statsStorage) {
          this._statsStorage.resetSession();
          this._renderEngine.updateStatisticsMenu(this._statsStorage);
        }
      },
    });

    Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');

    // Load icons
    const iconLoader = new IconLoader(this.path);
    this._icons = iconLoader.loadAll();

    // Animation controller
    const panelWidgets = this._panelIndicator.getWidgets();
    this._animController = new AnimationController(
      panelWidgets.icon, this._icons.frames, this._icons.fixedFrames, this._settings
    );

    // Init monitors
    this._networkMonitor = new NetworkMonitor();
    this._cpuMonitor = new CpuMonitor();
    this._memoryMonitor = new MemoryMonitor();

    this._temperatureMonitor = new TemperatureMonitor();
    if (this._temperatureMonitor.isAvailable()) {
      const zoneName = this._settings.get_string('temperature-zone');
      if (zoneName) this._temperatureMonitor.setZoneByName(zoneName);
    }

    this._diskMonitor = new DiskMonitor();
    if (this._diskMonitor.isAvailable()) {
      const deviceName = this._settings.get_string('disk-device');
      if (deviceName) this._diskMonitor.setDevice(deviceName);
    }

    // Statistics storage
    this._statsStorage = null;
    if (this._settings.get_boolean('track-statistics')) {
      const dataDir = GLib.build_filenamev([GLib.get_user_data_dir(), 'gnome-shell', 'extensions', this.metadata.uuid]);
      this._statsStorage = new StatisticsStorage(dataDir);
      this._statsStorage.startAutoSave(60);
    }

    // Notification manager
    this._notificationManager = null;
    if (this._settings.get_boolean('enable-notifications')) {
      this._notificationManager = new NotificationManager(this._settings);
    }

    // Render engine
    const menuWidgets = this._menuBuilder.getWidgets();
    this._renderEngine = new RenderEngine(panelWidgets, menuWidgets, this._settings, this._);

    // Start timers
    this._animController.applyFrame(true);
    this._animController.start(250);

    this._measureTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
      this._tick();
      return GLib.SOURCE_CONTINUE;
    });
  }

  _tick() {
    const net = this._networkMonitor.measure(this._settings);

    // Add traffic to statistics
    if (this._statsStorage && net.dRx >= 0 && net.dTx >= 0) {
      this._statsStorage.addTraffic(net.dRx, net.dTx);
    }

    // Update animal based on speed
    if (net.bytesPerSec !== null) {
      const turtleThreshold = this._settings.get_double('turtle-threshold');
      const rabbitThreshold = this._settings.get_double('rabbit-threshold');
      const minAnimSpeed = this._settings.get_int('min-anim-speed');
      const maxAnimSpeed = this._settings.get_int('max-anim-speed');

      let animal = 'snail';
      if (net.mbit >= rabbitThreshold) animal = 'rabbit';
      else if (net.mbit >= turtleThreshold) animal = 'turtle';

      this._animController.setAnimal(animal);

      // Adjust animation speed
      const maxMbit = Math.max(rabbitThreshold * 2, 100);
      const t = clamp(net.mbit / maxMbit, 0, 1);
      const targetInterval = Math.round(maxAnimSpeed - t * (maxAnimSpeed - minAnimSpeed));
      this._animController.updateInterval(targetInterval);
    }

    // Read system metrics
    const memoryPercent = this._memoryMonitor.readPercent();
    const cpuPercent = this._cpuMonitor.readPercent();
    const temperature = this._temperatureMonitor ? this._temperatureMonitor.readTemperature() : null;
    const diskIO = this._diskMonitor ? this._diskMonitor.readDiskIO() : { readSpeed: 0, writeSpeed: 0 };

    // Build metrics object
    const metrics = {
      bytesPerSec: net.bytesPerSec,
      rxBps: net.rxBps,
      txBps: net.txBps,
      iface: net.iface,
      memoryPercent,
      cpuPercent,
      temperature,
      diskReadSpeed: diskIO.readSpeed,
      diskWriteSpeed: diskIO.writeSpeed,
    };

    // Render UI
    this._renderEngine.render(metrics, {
      blobFrames: this._icons.blobFrames,
      cpuFrames: this._icons.cpuFrames,
      temperatureFrames: this._icons.temperatureFrames,
      diskFrames: this._icons.diskFrames,
      diskMonitor: this._diskMonitor,
    });

    // Update statistics menu
    if (this._statsStorage && this._settings.get_boolean('show-statistics')) {
      this._renderEngine.updateStatisticsMenu(this._statsStorage);
    }

    // Check notifications
    this._renderEngine.checkNotifications(metrics, this._notificationManager, this._statsStorage);
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

    // Destroy in reverse order
    if (this._animController) {
      this._animController.destroy();
      this._animController = null;
    }

    if (this._renderEngine) {
      this._renderEngine.destroy();
      this._renderEngine = null;
    }

    if (this._notificationManager) {
      this._notificationManager.destroy();
      this._notificationManager = null;
    }

    if (this._statsStorage) {
      this._statsStorage.destroy();
      this._statsStorage = null;
    }

    if (this._diskMonitor) {
      this._diskMonitor.destroy();
      this._diskMonitor = null;
    }

    this._temperatureMonitor = null;
    this._cpuMonitor = null;
    this._memoryMonitor = null;
    this._networkMonitor = null;

    if (this._menuBuilder) {
      this._menuBuilder.destroy();
      this._menuBuilder = null;
    }

    if (this._panelIndicator) {
      this._panelIndicator.destroy();
      this._panelIndicator = null;
    }

    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }

    this._icons = null;
    this._settings = null;
  }
}
