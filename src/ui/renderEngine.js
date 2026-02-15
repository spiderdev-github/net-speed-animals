import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { formatSpeed, formatTemp, formatBytes } from '../utils/formatters.js';

/**
 * Render engine - updates all UI elements with current metrics
 */
export class RenderEngine {
  constructor(panelWidgets, menuWidgets, settings, gettext) {
    this._panel = panelWidgets;
    this._menu = menuWidgets;
    this._settings = settings;
    this._ = gettext;
  }

  /**
   * Main render function - updates all UI with current metrics
   * @param {Object} metrics - { bytesPerSec, rxBps, txBps, iface, memoryPercent, cpuPercent, temperature, diskReadSpeed, diskWriteSpeed }
   * @param {Object} icons - { blobFrames, cpuFrames, temperatureFrames, diskFrames, diskMonitor }
   */
  render(metrics, icons) {
    const { bytesPerSec, rxBps, txBps, iface, memoryPercent, cpuPercent, temperature, diskReadSpeed, diskWriteSpeed } = metrics;

    // Speed label
    this._updateSpeedLabel(bytesPerSec, rxBps, txBps);

    // System metric labels
    if (this._panel.memoryLabel) {
      this._panel.memoryLabel.text = `${memoryPercent.toFixed(1)}%`;
    }
    if (this._panel.cpuLabel) {
      this._panel.cpuLabel.text = `${cpuPercent.toFixed(1)}%`;
    }
    if (this._panel.temperatureLabel) {
      this._panel.temperatureLabel.text = temperature !== null ? formatTemp(temperature) : '--°C';
    }
    this._updateDiskLabel(diskReadSpeed, diskWriteSpeed);

    // Color themes
    if (this._settings.get_boolean('enable-color-themes')) {
      this._applyColorThemes(bytesPerSec, memoryPercent, cpuPercent, temperature);
    }

    // Icons
    this._updateIcons(metrics, icons);

    // Menu items
    this._updateMenuItems(metrics);

    // Graphs
    this._updateGraphs(metrics);
  }

  _updateSpeedLabel(bytesPerSec, rxBps, txBps) {
    if (!this._panel.speedLabel) return;

    const displayMode = this._settings.get_string('speed-display-mode');

    if (bytesPerSec === null || bytesPerSec === undefined) {
      this._panel.speedLabel.text = formatSpeed(0);
    } else {
      switch (displayMode) {
        case 'separate':
          this._panel.speedLabel.text = `↓ ${formatSpeed(rxBps)} ↑ ${formatSpeed(txBps)}`;
          break;
        case 'download-only':
          this._panel.speedLabel.text = `↓ ${formatSpeed(rxBps)}`;
          break;
        case 'upload-only':
          this._panel.speedLabel.text = `↑ ${formatSpeed(txBps)}`;
          break;
        case 'combined':
        default:
          this._panel.speedLabel.text = formatSpeed(bytesPerSec);
          break;
      }
    }
  }

  _updateDiskLabel(diskReadSpeed, diskWriteSpeed) {
    if (!this._panel.diskLabel) return;

    const diskDisplayMode = this._settings.get_string('disk-display-mode');
    const totalDiskSpeed = diskReadSpeed + diskWriteSpeed;

    switch (diskDisplayMode) {
      case 'separate':
        this._panel.diskLabel.text = `R:${formatSpeed(diskReadSpeed)} W:${formatSpeed(diskWriteSpeed)}`;
        break;
      case 'read-only':
        this._panel.diskLabel.text = `R:${formatSpeed(diskReadSpeed)}`;
        break;
      case 'write-only':
        this._panel.diskLabel.text = `W:${formatSpeed(diskWriteSpeed)}`;
        break;
      case 'combined':
      default:
        this._panel.diskLabel.text = formatSpeed(totalDiskSpeed);
        break;
    }
  }

  _updateIcons(metrics, icons) {
    const { memoryPercent, cpuPercent, temperature, diskReadSpeed, diskWriteSpeed } = metrics;

    // Blob icon
    if (this._panel.blobIcon && icons.blobFrames?.length > 0) {
      const l1 = this._settings.get_double('memory-level-1');
      const l2 = this._settings.get_double('memory-level-2');
      const l3 = this._settings.get_double('memory-level-3');
      let idx = 0;
      if (memoryPercent >= l3) idx = 3;
      else if (memoryPercent >= l2) idx = 2;
      else if (memoryPercent >= l1) idx = 1;
      this._panel.blobIcon.gicon = icons.blobFrames[idx];
    }

    // CPU icon
    if (this._panel.cpuIcon && icons.cpuFrames?.length > 0) {
      const l1 = this._settings.get_double('cpu-level-1');
      const l2 = this._settings.get_double('cpu-level-2');
      const l3 = this._settings.get_double('cpu-level-3');
      let idx = 0;
      if (cpuPercent >= l3) idx = 3;
      else if (cpuPercent >= l2) idx = 2;
      else if (cpuPercent >= l1) idx = 1;
      this._panel.cpuIcon.gicon = icons.cpuFrames[idx];
    }

    // Temperature icon
    if (this._panel.temperatureIcon && icons.temperatureFrames?.length > 0 && temperature !== null) {
      const warm = this._settings.get_double('temperature-threshold-warm');
      const hot = this._settings.get_double('temperature-threshold-hot');
      const critical = this._settings.get_double('temperature-threshold-critical');
      let idx = 0;
      if (temperature >= critical) idx = 3;
      else if (temperature >= hot) idx = 2;
      else if (temperature >= warm) idx = 1;
      this._panel.temperatureIcon.gicon = icons.temperatureFrames[idx];
    }

    // Disk icon
    if (this._panel.diskIcon && icons.diskFrames?.length > 0 && icons.diskMonitor) {
      const dl1 = this._settings.get_double('disk-level-1');
      const dl2 = this._settings.get_double('disk-level-2');
      const dl3 = this._settings.get_double('disk-level-3');
      const diskLevel = icons.diskMonitor.getDiskLevel(diskReadSpeed, diskWriteSpeed, dl1, dl2, dl3);
      this._panel.diskIcon.gicon = icons.diskFrames[diskLevel];
    }
  }

  _updateMenuItems(metrics) {
    const { bytesPerSec, iface, memoryPercent, cpuPercent, temperature, diskReadSpeed, diskWriteSpeed } = metrics;
    const _ = this._;

    if (this._menu.speedItem) {
      if (bytesPerSec === null || bytesPerSec === undefined) {
        this._menu.speedItem.label.text = _('Speed: --');
      } else {
        this._menu.speedItem.label.text = `${_('Speed')}: ${formatSpeed(bytesPerSec)}`;
      }
    }

    if (this._menu.memoryItem) {
      this._menu.memoryItem.label.text = `${_('Memory')}: ${memoryPercent.toFixed(1)}%`;
    }

    if (this._menu.cpuItem) {
      this._menu.cpuItem.label.text = `CPU: ${cpuPercent.toFixed(1)}%`;
    }

    if (this._menu.temperatureItem) {
      this._menu.temperatureItem.label.text = temperature !== null
        ? `${_('Temperature')}: ${formatTemp(temperature)}`
        : `${_('Temperature')}: --`;
    }

    if (this._menu.diskItem) {
      const totalDiskSpeed = diskReadSpeed + diskWriteSpeed;
      this._menu.diskItem.label.text = (totalDiskSpeed > 0 || diskReadSpeed > 0 || diskWriteSpeed > 0)
        ? `${_('Disk I/O')}: R:${formatSpeed(diskReadSpeed)} W:${formatSpeed(diskWriteSpeed)}`
        : `${_('Disk I/O')}: --`;
    }

    if (this._menu.ifaceItem) {
      this._menu.ifaceItem.label.text = `${_('Interface')}: ${iface ?? '--'}`;
    }
  }

  _updateGraphs(metrics) {
    const { rxBps, txBps, memoryPercent, cpuPercent, temperature, diskReadSpeed, diskWriteSpeed } = metrics;

    if (this._menu.speedGraph && this._settings.get_boolean('show-speed-graph')) {
      this._menu.speedGraph.addDataPoint(rxBps || 0, txBps || 0);
    }

    if (this._menu.memoryGraph && this._settings.get_boolean('show-memory-graph')) {
      this._menu.memoryGraph.addDataPoint(memoryPercent);
    }

    if (this._menu.cpuGraph && this._settings.get_boolean('show-cpu-graph')) {
      this._menu.cpuGraph.addDataPoint(cpuPercent);
    }

    if (this._menu.temperatureGraph && this._settings.get_boolean('show-temperature-graph') && temperature !== null) {
      this._menu.temperatureGraph.addDataPoint(temperature);
    }

    if (this._menu.diskGraph && this._settings.get_boolean('show-disk-graph')) {
      const totalMBs = (diskReadSpeed + diskWriteSpeed) / (1024 * 1024);
      this._menu.diskGraph.addDataPoint(totalMBs);
    }
  }

  _applyColorThemes(bytesPerSec, memoryPercent, cpuPercent, temperature) {
    // Speed label colors
    if (this._panel.speedLabel && bytesPerSec !== null) {
      const mbit = (bytesPerSec * 8) / 1_000_000;
      const turtleThreshold = this._settings.get_double('turtle-threshold');
      const rabbitThreshold = this._settings.get_double('rabbit-threshold');

      this._panel.speedLabel.remove_style_class_name('speed-low');
      this._panel.speedLabel.remove_style_class_name('speed-medium');
      this._panel.speedLabel.remove_style_class_name('speed-high');

      if (mbit < turtleThreshold) this._panel.speedLabel.add_style_class_name('speed-low');
      else if (mbit < rabbitThreshold) this._panel.speedLabel.add_style_class_name('speed-medium');
      else this._panel.speedLabel.add_style_class_name('speed-high');
    }

    // CPU label colors
    if (this._panel.cpuLabel) {
      const l1 = this._settings.get_double('cpu-level-1');
      const l2 = this._settings.get_double('cpu-level-2');
      const l3 = this._settings.get_double('cpu-level-3');

      this._panel.cpuLabel.remove_style_class_name('cpu-idle');
      this._panel.cpuLabel.remove_style_class_name('cpu-low');
      this._panel.cpuLabel.remove_style_class_name('cpu-medium');
      this._panel.cpuLabel.remove_style_class_name('cpu-high');

      if (cpuPercent < l1) this._panel.cpuLabel.add_style_class_name('cpu-idle');
      else if (cpuPercent < l2) this._panel.cpuLabel.add_style_class_name('cpu-low');
      else if (cpuPercent < l3) this._panel.cpuLabel.add_style_class_name('cpu-medium');
      else this._panel.cpuLabel.add_style_class_name('cpu-high');
    }

    // Memory label colors
    if (this._panel.memoryLabel) {
      const l2 = this._settings.get_double('memory-level-2');
      const l3 = this._settings.get_double('memory-level-3');

      this._panel.memoryLabel.remove_style_class_name('mem-low');
      this._panel.memoryLabel.remove_style_class_name('mem-medium');
      this._panel.memoryLabel.remove_style_class_name('mem-high');

      if (memoryPercent < l2) this._panel.memoryLabel.add_style_class_name('mem-low');
      else if (memoryPercent < l3) this._panel.memoryLabel.add_style_class_name('mem-medium');
      else this._panel.memoryLabel.add_style_class_name('mem-high');
    }

    // Temperature label colors
    if (this._panel.temperatureLabel && temperature !== null) {
      const warm = this._settings.get_double('temperature-threshold-warm');
      const hot = this._settings.get_double('temperature-threshold-hot');
      const critical = this._settings.get_double('temperature-threshold-critical');

      this._panel.temperatureLabel.remove_style_class_name('temp-cool');
      this._panel.temperatureLabel.remove_style_class_name('temp-warm');
      this._panel.temperatureLabel.remove_style_class_name('temp-hot');
      this._panel.temperatureLabel.remove_style_class_name('temp-critical');

      if (temperature >= critical) this._panel.temperatureLabel.add_style_class_name('temp-critical');
      else if (temperature >= hot) this._panel.temperatureLabel.add_style_class_name('temp-hot');
      else if (temperature >= warm) this._panel.temperatureLabel.add_style_class_name('temp-warm');
      else this._panel.temperatureLabel.add_style_class_name('temp-cool');
    }
  }

  /**
   * Update statistics menu items
   */
  updateStatisticsMenu(statsStorage) {
    if (!statsStorage) return;

    const stats = statsStorage.getStats();
    const _ = this._;

    if (this._menu.statsSessionItem) {
      this._menu.statsSessionItem.label.text = `${_('Session')}: ↓ ${formatBytes(stats.session.rx)} ↑ ${formatBytes(stats.session.tx)}`;
    }
    if (this._menu.statsDailyItem) {
      this._menu.statsDailyItem.label.text = `${_('Daily')}: ↓ ${formatBytes(stats.daily.rx)} ↑ ${formatBytes(stats.daily.tx)}`;
    }
    if (this._menu.statsWeeklyItem) {
      this._menu.statsWeeklyItem.label.text = `${_('Weekly')}: ↓ ${formatBytes(stats.weekly.rx)} ↑ ${formatBytes(stats.weekly.tx)}`;
    }
    if (this._menu.statsMonthlyItem) {
      this._menu.statsMonthlyItem.label.text = `${_('Monthly')}: ↓ ${formatBytes(stats.monthly.rx)} ↑ ${formatBytes(stats.monthly.tx)}`;
    }

    if (this._menu.quotaBar) {
      const quotaGB = this._settings.get_double('bandwidth-quota-gb');
      if (quotaGB > 0) {
        this._menu.quotaBar.updateQuota(stats.monthly.total, quotaGB);
      }
    }
  }

  /**
   * Check notification alerts
   */
  checkNotifications(metrics, notificationManager, statsStorage) {
    if (!notificationManager || !this._settings.get_boolean('enable-notifications')) return;

    const { bytesPerSec, cpuPercent, memoryPercent, temperature } = metrics;

    if (bytesPerSec !== null && bytesPerSec !== undefined) {
      notificationManager.checkNetworkDropout(bytesPerSec);
    }
    if (cpuPercent !== null && cpuPercent !== undefined) {
      notificationManager.checkCpuHigh(cpuPercent);
    }
    if (memoryPercent !== null && memoryPercent !== undefined) {
      notificationManager.checkMemoryHigh(memoryPercent);
    }
    if (temperature !== null) {
      notificationManager.checkTemperatureHigh(temperature);
    }

    if (statsStorage) {
      const stats = statsStorage.getStats();
      const quotaGB = this._settings.get_double('bandwidth-quota-gb');
      if (quotaGB > 0) {
        const quotaBytes = quotaGB * (1024 ** 3);
        notificationManager.checkQuotaWarning(stats.monthly.total, quotaBytes);
      }
    }
  }

  /**
   * Cycle through speed display modes
   */
  cycleSpeedDisplayMode() {
    const modes = ['combined', 'separate', 'download-only', 'upload-only'];
    const currentMode = this._settings.get_string('speed-display-mode');
    const currentIndex = modes.indexOf(currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    this._settings.set_string('speed-display-mode', nextMode);

    const _ = this._;
    const modeNames = {
      'combined': _('Combined (Total Speed)'),
      'separate': _('Separate (Download/Upload)'),
      'download-only': _('Download Only'),
      'upload-only': _('Upload Only'),
    };

    Main.notify(_('Net Speed Animals'), `${_('Speed Display')}: ${modeNames[nextMode]}`);
  }

  destroy() {
    this._panel = null;
    this._menu = null;
    this._settings = null;
  }
}
