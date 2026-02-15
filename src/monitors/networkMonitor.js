import GLib from 'gi://GLib';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

/**
 * Network monitor - reads /proc/net/dev and calculates speed
 */
export class NetworkMonitor {
  constructor() {
    this._prevStats = this._readNetDev();
    this._prevTimeUs = GLib.get_monotonic_time();
    this._iface = this._pickIface(this._prevStats);
  }

  /**
   * Read /proc/net/dev and return map: iface -> { rxBytes, txBytes }
   */
  _readNetDev() {
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

  /**
   * Get all available interfaces (excluding loopback)
   */
  getAllInterfaces(stats) {
    return Object.keys(stats || this._readNetDev()).filter(iface => iface !== 'lo');
  }

  /**
   * Pick main iface (not lo) based on largest total traffic
   */
  _pickIface(stats) {
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

  /**
   * Select interface based on settings mode (auto or manual)
   */
  selectInterface(settings, stats) {
    const mode = settings.get_string('interface-mode');

    if (mode === 'manual') {
      const pinned = settings.get_string('pinned-interface');
      if (pinned && stats[pinned]) {
        return pinned;
      }
    }

    return this._pickIface(stats);
  }

  /**
   * Cycle through available network interfaces
   */
  cycleInterface(direction, settings, gettext) {
    const stats = this._readNetDev();
    const interfaces = this.getAllInterfaces(stats);

    if (interfaces.length <= 1) return;

    const currentInterface = this._iface || this._pickIface(stats);
    const currentIndex = interfaces.indexOf(currentInterface);

    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = interfaces.length - 1;
    if (nextIndex >= interfaces.length) nextIndex = 0;

    const nextInterface = interfaces[nextIndex];

    settings.set_string('interface-mode', 'manual');
    settings.set_string('pinned-interface', nextInterface);
    this._iface = nextInterface;

    Main.notify(
      gettext('Net Speed Animals'),
      `${gettext('Interface')}: ${nextInterface}`
    );
  }

  /**
   * Main measurement function - returns speed metrics
   */
  measure(settings) {
    const nowUs = GLib.get_monotonic_time();
    const dtSec = (nowUs - this._prevTimeUs) / 1_000_000;
    this._prevTimeUs = nowUs;

    const cur = this._readNetDev();

    if (!this._iface) this._iface = this.selectInterface(settings, cur);

    const prev = this._prevStats?.[this._iface];
    const curr = cur?.[this._iface];

    if (!prev || !curr) {
      this._prevStats = cur;
      this._iface = this.selectInterface(settings, cur);
      return { bytesPerSec: null, rxBps: null, txBps: null, mbit: 0, iface: this._iface, dRx: 0, dTx: 0 };
    }

    const dRx = curr.rxBytes - prev.rxBytes;
    const dTx = curr.txBytes - prev.txBytes;
    const rxBps = dRx / Math.max(dtSec, 0.001);
    const txBps = dTx / Math.max(dtSec, 0.001);
    const bytesPerSec = (dRx + dTx) / Math.max(dtSec, 0.001);
    const mbit = (bytesPerSec * 8) / 1_000_000;

    this._prevStats = cur;

    return { bytesPerSec, rxBps, txBps, mbit, iface: this._iface, dRx, dTx };
  }

  get iface() {
    return this._iface;
  }
}
