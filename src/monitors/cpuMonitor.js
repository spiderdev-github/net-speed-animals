import GLib from 'gi://GLib';

/**
 * CPU monitor - reads /proc/stat and calculates CPU usage percentage
 */
export class CpuMonitor {
  constructor() {
    this._prevStats = null;
    // Take initial sample
    this._read();
  }

  _read() {
    const path = '/proc/stat';
    try {
      const [ok, bytes] = GLib.file_get_contents(path);
      if (!ok) return { percent: 0, stats: null };

      const text = new TextDecoder('utf-8').decode(bytes);
      const lines = text.split('\n');

      const cpuLine = lines.find(line => line.startsWith('cpu '));
      if (!cpuLine) return { percent: 0, stats: null };

      const parts = cpuLine.split(/\s+/).slice(1);
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

      if (!this._prevStats || !this._prevStats.total) {
        this._prevStats = currentStats;
        return { percent: 0, stats: currentStats };
      }

      const totalDelta = currentStats.total - this._prevStats.total;
      const idleDelta = currentStats.idle - this._prevStats.idle;

      this._prevStats = currentStats;

      if (totalDelta <= 0) return { percent: 0, stats: currentStats };

      const percent = ((totalDelta - idleDelta) / totalDelta) * 100;
      return { percent: Math.max(0, Math.min(100, percent)), stats: currentStats };
    } catch {
      return { percent: 0, stats: null };
    }
  }

  /**
   * Read current CPU usage percentage (0-100)
   */
  readPercent() {
    return this._read().percent;
  }
}
