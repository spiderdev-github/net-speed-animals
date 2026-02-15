import GLib from 'gi://GLib';

/**
 * Memory monitor - reads /proc/meminfo and calculates memory usage percentage
 */
export class MemoryMonitor {
  /**
   * Read current memory usage percentage (0-100)
   */
  readPercent() {
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
      return Math.max(0, Math.min(100, percent));
    } catch {
      return 0;
    }
  }
}
