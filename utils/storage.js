import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

// Storage manager for network traffic statistics
export class StatisticsStorage {
  constructor(dataDir) {
    this._dataDir = dataDir;
    this._statsFile = GLib.build_filenamev([dataDir, 'statistics.json']);
    this._stats = this._loadStats();
    this._saveTimerId = 0;
  }

  _loadStats() {
    try {
      const file = Gio.File.new_for_path(this._statsFile);
      if (!file.query_exists(null)) {
        return this._createDefaultStats();
      }

      const [ok, contents] = file.load_contents(null);
      if (!ok) return this._createDefaultStats();

      const text = new TextDecoder('utf-8').decode(contents);
      const data = JSON.parse(text);

      // Validate and migrate if needed
      return this._validateStats(data);
    } catch (e) {
      console.error(`Failed to load statistics: ${e}`);
      return this._createDefaultStats();
    }
  }

  _createDefaultStats() {
    const now = new Date();
    return {
      version: 1,
      session: {
        rxBytes: 0,
        txBytes: 0,
        startTime: now.toISOString(),
      },
      daily: {
        rxBytes: 0,
        txBytes: 0,
        date: this._getDateKey(now),
      },
      weekly: {
        rxBytes: 0,
        txBytes: 0,
        weekStart: this._getWeekKey(now),
      },
      monthly: {
        rxBytes: 0,
        txBytes: 0,
        month: this._getMonthKey(now),
      },
    };
  }

  _validateStats(data) {
    // Check if periods need to be reset
    const now = new Date();
    const currentDate = this._getDateKey(now);
    const currentWeek = this._getWeekKey(now);
    const currentMonth = this._getMonthKey(now);

    // Reset daily if date changed
    if (!data.daily || data.daily.date !== currentDate) {
      data.daily = {
        rxBytes: 0,
        txBytes: 0,
        date: currentDate,
      };
    }

    // Reset weekly if week changed
    if (!data.weekly || data.weekly.weekStart !== currentWeek) {
      data.weekly = {
        rxBytes: 0,
        txBytes: 0,
        weekStart: currentWeek,
      };
    }

    // Reset monthly if month changed
    if (!data.monthly || data.monthly.month !== currentMonth) {
      data.monthly = {
        rxBytes: 0,
        txBytes: 0,
        month: currentMonth,
      };
    }

    // Ensure session exists
    if (!data.session) {
      data.session = {
        rxBytes: 0,
        txBytes: 0,
        startTime: now.toISOString(),
      };
    }

    return data;
  }

  _getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  _getWeekKey(date) {
    // Get Monday of current week
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date);
    monday.setDate(diff);
    return this._getDateKey(monday);
  }

  _getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  addTraffic(rxBytes, txBytes) {
    // Validate and reset periods if needed
    this._stats = this._validateStats(this._stats);

    // Add to all periods
    this._stats.session.rxBytes += rxBytes;
    this._stats.session.txBytes += txBytes;
    this._stats.daily.rxBytes += rxBytes;
    this._stats.daily.txBytes += txBytes;
    this._stats.weekly.rxBytes += rxBytes;
    this._stats.weekly.txBytes += txBytes;
    this._stats.monthly.rxBytes += rxBytes;
    this._stats.monthly.txBytes += txBytes;
  }

  getStats() {
    return {
      session: {
        rx: this._stats.session.rxBytes,
        tx: this._stats.session.txBytes,
        total: this._stats.session.rxBytes + this._stats.session.txBytes,
      },
      daily: {
        rx: this._stats.daily.rxBytes,
        tx: this._stats.daily.txBytes,
        total: this._stats.daily.rxBytes + this._stats.daily.txBytes,
      },
      weekly: {
        rx: this._stats.weekly.rxBytes,
        tx: this._stats.weekly.txBytes,
        total: this._stats.weekly.rxBytes + this._stats.weekly.txBytes,
      },
      monthly: {
        rx: this._stats.monthly.rxBytes,
        tx: this._stats.monthly.txBytes,
        total: this._stats.monthly.rxBytes + this._stats.monthly.txBytes,
      },
    };
  }

  save() {
    try {
      // Ensure directory exists
      const dir = Gio.File.new_for_path(this._dataDir);
      if (!dir.query_exists(null)) {
        dir.make_directory_with_parents(null);
      }

      const file = Gio.File.new_for_path(this._statsFile);
      const json = JSON.stringify(this._stats, null, 2);
      const bytes = new TextEncoder().encode(json);

      file.replace_contents(
        bytes,
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION,
        null
      );
    } catch (e) {
      console.error(`Failed to save statistics: ${e}`);
    }
  }

  startAutoSave(intervalSeconds = 60) {
    if (this._saveTimerId !== 0) {
      GLib.source_remove(this._saveTimerId);
    }

    this._saveTimerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, intervalSeconds, () => {
      this.save();
      return GLib.SOURCE_CONTINUE;
    });
  }

  stopAutoSave() {
    if (this._saveTimerId !== 0) {
      GLib.source_remove(this._saveTimerId);
      this._saveTimerId = 0;
    }
  }

  resetSession() {
    const now = new Date();
    this._stats.session = {
      rxBytes: 0,
      txBytes: 0,
      startTime: now.toISOString(),
    };
    this.save();
  }

  destroy() {
    this.stopAutoSave();
    this.save();
  }
}
