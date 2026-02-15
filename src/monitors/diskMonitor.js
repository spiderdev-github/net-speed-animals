import GLib from 'gi://GLib';

/**
 * DiskMonitor
 * Reads disk I/O statistics from /proc/diskstats
 */
export class DiskMonitor {
  constructor() {
    this._prevStats = null;
    this._prevTimeUs = 0;
    this._selectedDevice = null;
    this._availableDevices = [];

    this._detectDevices();
  }

  /**
   * Detect available disk devices
   * Looks for common disk devices (sda, nvme0n1, etc.)
   */
  _detectDevices() {
    const path = '/proc/diskstats';
    try {
      const [ok, bytes] = GLib.file_get_contents(path);
      if (!ok) return;

      const content = new TextDecoder().decode(bytes);
      const lines = content.trim().split('\n');

      this._availableDevices = [];

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 14) continue;

        const deviceName = parts[2];

        // Filter for main disk devices (no partitions)
        // Accept: sda, sdb, nvme0n1, nvme1n1, mmcblk0, vda, etc.
        // Reject: sda1, sda2, nvme0n1p1, etc.
        if (this._isMainDevice(deviceName)) {
          this._availableDevices.push(deviceName);
        }
      }

      // Auto-select first device if none selected
      if (this._availableDevices.length > 0 && !this._selectedDevice) {
        this._selectedDevice = this._availableDevices[0];
      }
    } catch (e) {
      console.error('Failed to detect disk devices:', e);
    }
  }

  /**
   * Check if device name is a main device (not a partition)
   */
  _isMainDevice(name) {
    // Main disk patterns:
    // - sd[a-z]: SATA/SCSI disks (sda, sdb, etc.)
    // - nvme[0-9]+n[0-9]+: NVMe disks (nvme0n1, nvme1n1)
    // - mmcblk[0-9]+: MMC/SD cards (mmcblk0)
    // - vd[a-z]: VirtIO disks (vda, vdb)
    // - hd[a-z]: Old IDE disks (hda, hdb)

    // Partition patterns to reject:
    // - sd[a-z][0-9]+: SATA partitions (sda1, sdb2)
    // - nvme[0-9]+n[0-9]+p[0-9]+: NVMe partitions (nvme0n1p1)
    // - mmcblk[0-9]+p[0-9]+: MMC partitions (mmcblk0p1)

    const mainDevicePatterns = [
      /^sd[a-z]$/,           // sda, sdb, etc.
      /^nvme\d+n\d+$/,       // nvme0n1, nvme1n1
      /^mmcblk\d+$/,         // mmcblk0
      /^vd[a-z]$/,           // vda, vdb
      /^hd[a-z]$/,           // hda, hdb
    ];

    return mainDevicePatterns.some(pattern => pattern.test(name));
  }

  /**
   * Get list of available devices
   */
  getAvailableDevices() {
    return this._availableDevices;
  }

  /**
   * Set the device to monitor
   */
  setDevice(deviceName) {
    if (this._availableDevices.includes(deviceName)) {
      this._selectedDevice = deviceName;
      this._prevStats = null; // Reset stats when switching devices
      return true;
    }
    return false;
  }

  /**
   * Get currently selected device
   */
  getSelectedDevice() {
    return this._selectedDevice;
  }

  /**
   * Read disk I/O stats from /proc/diskstats
   * Returns { readSpeed, writeSpeed } in bytes per second
   */
  readDiskIO() {
    if (!this._selectedDevice) {
      return { readSpeed: 0, writeSpeed: 0 };
    }

    const path = '/proc/diskstats';
    try {
      const [ok, bytes] = GLib.file_get_contents(path);
      if (!ok) return { readSpeed: 0, writeSpeed: 0 };

      const content = new TextDecoder().decode(bytes);
      const lines = content.trim().split('\n');

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 14) continue;

        const deviceName = parts[2];
        if (deviceName !== this._selectedDevice) continue;

        // /proc/diskstats format:
        // 0: major number
        // 1: minor number
        // 2: device name
        // 3: reads completed
        // 4: reads merged
        // 5: sectors read
        // 6: time spent reading (ms)
        // 7: writes completed
        // 8: writes merged
        // 9: sectors written
        // 10: time spent writing (ms)
        // 11: I/Os currently in progress
        // 12: time spent doing I/Os (ms)
        // 13: weighted time spent doing I/Os (ms)

        const sectorsRead = parseInt(parts[5], 10);
        const sectorsWritten = parseInt(parts[9], 10);

        const nowUs = GLib.get_monotonic_time();

        // Calculate speeds if we have previous data
        if (this._prevStats) {
          const deltaSectorsRead = sectorsRead - this._prevStats.sectorsRead;
          const deltaSectorsWritten = sectorsWritten - this._prevStats.sectorsWritten;
          const deltaTimeUs = nowUs - this._prevTimeUs;

          if (deltaTimeUs > 0) {
            // Convert sectors to bytes (512 bytes per sector)
            // Convert time from microseconds to seconds
            const readSpeed = (deltaSectorsRead * 512) / (deltaTimeUs / 1_000_000);
            const writeSpeed = (deltaSectorsWritten * 512) / (deltaTimeUs / 1_000_000);

            this._prevStats = { sectorsRead, sectorsWritten };
            this._prevTimeUs = nowUs;

            return {
              readSpeed: Math.max(0, readSpeed),
              writeSpeed: Math.max(0, writeSpeed),
            };
          }
        }

        // First measurement - store and return zero
        this._prevStats = { sectorsRead, sectorsWritten };
        this._prevTimeUs = nowUs;
        return { readSpeed: 0, writeSpeed: 0 };
      }

      // Device not found
      return { readSpeed: 0, writeSpeed: 0 };
    } catch (e) {
      console.error('Failed to read disk I/O stats:', e);
      return { readSpeed: 0, writeSpeed: 0 };
    }
  }

  /**
   * Get disk I/O level based on activity
   * Returns 0-3 (idle, low, medium, high)
   */
  getDiskLevel(readSpeed, writeSpeed, lowMB = 1, mediumMB = 10, highMB = 50) {
    const totalSpeed = readSpeed + writeSpeed;

    // Thresholds in bytes per second (parameter values are in MB/s)
    const lowThreshold = lowMB * 1024 * 1024;
    const mediumThreshold = mediumMB * 1024 * 1024;
    const highThreshold = highMB * 1024 * 1024;

    if (totalSpeed < lowThreshold) {
      return 0; // Idle
    } else if (totalSpeed < mediumThreshold) {
      return 1; // Low
    } else if (totalSpeed < highThreshold) {
      return 2; // Medium
    } else {
      return 3; // High
    }
  }

  /**
   * Check if disk monitoring is available
   */
  isAvailable() {
    return this._availableDevices.length > 0;
  }

  /**
   * Clean up
   */
  destroy() {
    this._prevStats = null;
    this._availableDevices = null;
    this._selectedDevice = null;
  }
}
