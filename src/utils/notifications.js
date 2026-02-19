import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {
  NOTIFICATION_COOLDOWN_MS,
  BITS_PER_MBIT,
  BITS_PER_BYTE,
  BYTES_TO_GB_POWER,
  BYTES_PER_KB,
} from './constants.js';

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

    // Cooldown period: prevents notification spam
    this._cooldownPeriod = NOTIFICATION_COOLDOWN_MS;
  }

  _getSnoozeUntilMs() {
    if (!this._settings) return 0;

    const untilIso = this._settings.get_string('notifications-snooze-until');
    if (!untilIso) return 0;

    const untilMs = Date.parse(untilIso);
    if (!Number.isFinite(untilMs)) {
      this._settings.set_string('notifications-snooze-until', '');
      return 0;
    }

    return untilMs;
  }

  _isTemporarilySilenced() {
    const untilMs = this._getSnoozeUntilMs();
    if (untilMs <= 0) return false;

    if (Date.now() >= untilMs) {
      this._settings.set_string('notifications-snooze-until', '');
      return false;
    }

    return true;
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
    if (this._isTemporarilySilenced()) {
      return;
    }

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
    const thresholdBytes = (threshold * BITS_PER_MBIT) / BITS_PER_BYTE;

    if (speed < thresholdBytes && speed > 0) {
      const speedMbit = (speed * BITS_PER_BYTE) / BITS_PER_MBIT;
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
      const usedGB = usedBytes / (BYTES_PER_KB ** BYTES_TO_GB_POWER);
      const quotaGB = quotaBytes / (BYTES_PER_KB ** BYTES_TO_GB_POWER);
      this._notify(
        'Bandwidth Quota Critical',
        `${usedPercent.toFixed(1)}% used (${usedGB.toFixed(1)} GB / ${quotaGB.toFixed(1)} GB)`,
        'quota-critical'
      );
    }
    // Warning alert (yellow zone)
    else if (usedPercent >= warningThreshold) {
      const usedGB = usedBytes / (BYTES_PER_KB ** BYTES_TO_GB_POWER);
      const quotaGB = quotaBytes / (BYTES_PER_KB ** BYTES_TO_GB_POWER);
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

  silenceForMinutes(minutes) {
    const duration = Math.max(1, Number.parseInt(minutes, 10) || 1);
    const until = new Date(Date.now() + duration * 60 * 1000).toISOString();
    this._settings.set_string('notifications-snooze-until', until);
  }

  clearTemporarySilence() {
    this._settings.set_string('notifications-snooze-until', '');
  }

  /**
   * Clean up
   */
  destroy() {
    this._settings = null;
    this._lastNotifications = null;
  }
}
