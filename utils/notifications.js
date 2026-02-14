import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * NotificationManager
 * Handles desktop notifications with cooldown system
 */
export class NotificationManager {
  constructor(settings) {
    this._settings = settings;

    // Cooldown tracking (timestamp of last notification for each type)
    this._lastNotifications = {
      'network-dropout': 0,
      'cpu-high': 0,
      'memory-high': 0,
      'temperature-high': 0,
      'quota-warning': 0,
      'quota-critical': 0,
    };

    // Cooldown period in milliseconds (5 minutes)
    this._cooldownPeriod = 5 * 60 * 1000;
  }

  /**
   * Check if we can show a notification (not in cooldown)
   * @param {string} type - Notification type
   * @returns {boolean} True if notification can be shown
   */
  _canNotify(type) {
    const now = Date.now();
    const lastTime = this._lastNotifications[type] || 0;
    return (now - lastTime) >= this._cooldownPeriod;
  }

  /**
   * Update the last notification timestamp
   * @param {string} type - Notification type
   */
  _updateLastNotification(type) {
    this._lastNotifications[type] = Date.now();
  }

  /**
   * Show a desktop notification
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {string} type - Notification type for cooldown tracking
   */
  _notify(title, body, type) {
    if (!this._canNotify(type)) {
      return; // In cooldown period
    }

    Main.notify(title, body);
    this._updateLastNotification(type);
  }

  /**
   * Check network speed and notify if dropped below threshold
   * @param {number} speed - Current speed in bytes per second
   */
  checkNetworkDropout(speed) {
    if (!this._settings.get_boolean('notify-network-dropout')) {
      return;
    }

    const threshold = this._settings.get_double('network-dropout-threshold');
    const thresholdBytes = (threshold * 1_000_000) / 8; // Convert Mbit/s to bytes/s

    if (speed < thresholdBytes && speed > 0) {
      const speedMbit = (speed * 8) / 1_000_000;
      this._notify(
        'Network Speed Low',
        `Network speed dropped to ${speedMbit.toFixed(1)} Mbit/s (threshold: ${threshold} Mbit/s)`,
        'network-dropout'
      );
    }
  }

  /**
   * Check CPU usage and notify if exceeds threshold
   * @param {number} percent - CPU usage percentage
   */
  checkCpuHigh(percent) {
    if (!this._settings.get_boolean('notify-cpu-high')) {
      return;
    }

    const threshold = this._settings.get_double('cpu-alert-threshold');

    if (percent >= threshold) {
      this._notify(
        'High CPU Usage',
        `CPU usage is at ${percent.toFixed(1)}% (threshold: ${threshold}%)`,
        'cpu-high'
      );
    }
  }

  /**
   * Check memory usage and notify if exceeds threshold
   * @param {number} percent - Memory usage percentage
   */
  checkMemoryHigh(percent) {
    if (!this._settings.get_boolean('notify-memory-high')) {
      return;
    }

    const threshold = this._settings.get_double('memory-alert-threshold');

    if (percent >= threshold) {
      this._notify(
        'High Memory Usage',
        `Memory usage is at ${percent.toFixed(1)}% (threshold: ${threshold}%)`,
        'memory-high'
      );
    }
  }

  /**
   * Check temperature and notify if exceeds threshold
   * @param {number} celsius - Temperature in Celsius
   */
  checkTemperatureHigh(celsius) {
    if (!this._settings.get_boolean('notify-temperature-high')) {
      return;
    }

    const threshold = this._settings.get_double('temperature-alert-threshold');

    if (celsius >= threshold) {
      this._notify(
        'High Temperature Warning',
        `Temperature is at ${Math.round(celsius)}°C (threshold: ${threshold}°C)`,
        'temperature-high'
      );
    }
  }

  /**
   * Check bandwidth quota and notify if approaching limit
   * @param {number} usedBytes - Total bytes used in current period
   * @param {number} quotaBytes - Quota limit in bytes
   */
  checkQuotaWarning(usedBytes, quotaBytes) {
    if (!this._settings.get_boolean('notify-quota-warning')) {
      return;
    }

    const usedPercent = (usedBytes / quotaBytes) * 100;
    const warningThreshold = this._settings.get_double('quota-warning-threshold');
    const criticalThreshold = this._settings.get_double('quota-critical-threshold');

    // Critical alert (red zone)
    if (usedPercent >= criticalThreshold) {
      const usedGB = usedBytes / (1024 ** 3);
      const quotaGB = quotaBytes / (1024 ** 3);
      this._notify(
        'Bandwidth Quota Critical',
        `${usedPercent.toFixed(1)}% used (${usedGB.toFixed(1)} GB / ${quotaGB.toFixed(1)} GB)`,
        'quota-critical'
      );
    }
    // Warning alert (yellow zone)
    else if (usedPercent >= warningThreshold) {
      const usedGB = usedBytes / (1024 ** 3);
      const quotaGB = quotaBytes / (1024 ** 3);
      this._notify(
        'Bandwidth Quota Warning',
        `${usedPercent.toFixed(1)}% used (${usedGB.toFixed(1)} GB / ${quotaGB.toFixed(1)} GB)`,
        'quota-warning'
      );
    }
  }

  /**
   * Reset cooldown for a specific notification type
   * @param {string} type - Notification type
   */
  resetCooldown(type) {
    this._lastNotifications[type] = 0;
  }

  /**
   * Reset all cooldowns
   */
  resetAllCooldowns() {
    for (const type in this._lastNotifications) {
      this._lastNotifications[type] = 0;
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this._settings = null;
    this._lastNotifications = null;
  }
}
