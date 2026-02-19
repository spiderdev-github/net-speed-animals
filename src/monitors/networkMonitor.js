import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {
  MICROSECONDS_PER_SECOND,
  BITS_PER_BYTE,
  BITS_PER_MBIT,
  MIN_TIME_DELTA_SEC,
  PROC_PATHS,
} from '../utils/constants.js';

/**
 * Network monitor - reads /proc/net/dev and calculates speed
 */
export class NetworkMonitor {
  constructor() {
    this._prevStats = this._readNetDev();
    this._prevTimeUs = GLib.get_monotonic_time();
    this._iface = null;
  }

  /**
   * Read /proc/net/dev and return map: iface -> { rxBytes, txBytes }
   */
  _readNetDev() {
    const path = PROC_PATHS.NET_DEV;
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
  getAllInterfaces(stats, settings = null) {
    return this._getCandidateInterfaces(stats || this._readNetDev(), settings);
  }

  _getCandidateInterfaces(stats, settings = null) {
    const all = Object.keys(stats || {}).filter(iface => iface !== 'lo');
    if (!settings) return all;

    const ignoreVirtual = settings.get_boolean('auto-ignore-virtual-ifaces');
    const ignoreDocker = settings.get_boolean('auto-ignore-docker-ifaces');
    const ignoreTailscale = settings.get_boolean('auto-ignore-tailscale-ifaces');

    return all.filter((iface) => {
      if (ignoreTailscale && this._isTailscaleIface(iface)) return false;
      if (ignoreDocker && this._isDockerIface(iface)) return false;
      if (ignoreVirtual && this._isVirtualIface(iface)) return false;
      return true;
    });
  }

  _isTailscaleIface(iface) {
    return /^tailscale\d*$/.test(iface);
  }

  _isDockerIface(iface) {
    const dockerLikePatterns = [
      /^docker\d*$/,
      /^veth[a-zA-Z0-9]+$/,
      /^br-[a-f0-9]{6,}$/,
      /^cni\d*$/,
      /^flannel\d*$/,
      /^podman\d*$/,
    ];
    return dockerLikePatterns.some((pattern) => pattern.test(iface));
  }

  _isVirtualIface(iface) {
    const virtualPatterns = [
      /^virbr\d*$/,
      /^vnet\d+$/,
      /^vmnet\d+$/,
      /^vboxnet\d+$/,
      /^zt[0-9a-f]+$/,
      /^ifb\d+$/,
      /^dummy\d*$/,
      /^mac(vlan|vtap)\d*$/,
      /^(tun|tap|wg)\d+$/,
    ];
    return virtualPatterns.some((pattern) => pattern.test(iface));
  }

  _isWifiIface(iface) {
    if (/^wl[a-zA-Z0-9]/.test(iface)) return true;

    try {
      const wirelessPath = `/sys/class/net/${iface}/wireless`;
      const file = Gio.File.new_for_path(wirelessPath);
      return file.query_exists(null);
    } catch {
      return false;
    }
  }

  _isEthernetIface(iface) {
    return /^(en|eth)\w+/.test(iface);
  }

  _isInterfaceUp(iface) {
    try {
      const [ok, bytes] = GLib.file_get_contents(`/sys/class/net/${iface}/operstate`);
      if (!ok) return false;
      const state = new TextDecoder('utf-8').decode(bytes).trim();
      return state === 'up' || state === 'unknown';
    } catch {
      return false;
    }
  }

  _getDefaultRouteInterfaces() {
    const ifaces = new Set();
    const path = PROC_PATHS.NET_ROUTE;

    try {
      const [ok, bytes] = GLib.file_get_contents(path);
      if (!ok) return ifaces;

      const text = new TextDecoder('utf-8').decode(bytes);
      const lines = text.split('\n').slice(1);

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 4) continue;

        const iface = parts[0];
        const destination = parts[1];
        const flags = Number.parseInt(parts[3], 16);
        const routeUp = Number.isFinite(flags) && (flags & 0x1) !== 0;

        if (destination === '00000000' && routeUp) {
          ifaces.add(iface);
        }
      }
    } catch {
      return ifaces;
    }

    return ifaces;
  }

  /**
   * Pick main iface (not lo) based on largest total traffic
   */
  _pickIface(stats, settings = null) {
    const candidates = this._getCandidateInterfaces(stats, settings);
    if (candidates.length === 0) return null;

    const defaultRouteIfaces = this._getDefaultRouteInterfaces();

    let best = null;
    let bestScore = null;

    for (const iface of candidates) {
      const v = stats[iface] || { rxBytes: 0, txBytes: 0 };
      const traffic = v.rxBytes + v.txBytes;
      const hasDefaultRoute = defaultRouteIfaces.has(iface) ? 1 : 0;
      const isUp = this._isInterfaceUp(iface) ? 1 : 0;
      const isPreferredKind = (this._isWifiIface(iface) || this._isEthernetIface(iface)) ? 1 : 0;

      const score = [hasDefaultRoute, isUp, isPreferredKind, traffic];

      if (!bestScore) {
        best = iface;
        bestScore = score;
        continue;
      }

      const isBetter =
        score[0] > bestScore[0] ||
        (score[0] === bestScore[0] && score[1] > bestScore[1]) ||
        (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] > bestScore[2]) ||
        (score[0] === bestScore[0] && score[1] === bestScore[1] && score[2] === bestScore[2] && score[3] > bestScore[3]);

      if (isBetter) {
        best = iface;
        bestScore = score;
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

    return this._pickIface(stats, settings);
  }

  /**
   * Cycle through available network interfaces
   */
  cycleInterface(direction, settings, gettext) {
    const stats = this._readNetDev();
    const interfaces = this.getAllInterfaces(stats, settings);

    if (interfaces.length <= 1) return;

    const currentInterface = this._iface || this._pickIface(stats, settings);
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
    const dtSec = (nowUs - this._prevTimeUs) / MICROSECONDS_PER_SECOND;
    this._prevTimeUs = nowUs;

    const cur = this._readNetDev();

    const mode = settings.get_string('interface-mode');
    if (mode === 'auto') {
      this._iface = this.selectInterface(settings, cur);
    } else if (!this._iface) {
      this._iface = this.selectInterface(settings, cur);
    }

    const prev = this._prevStats?.[this._iface];
    const curr = cur?.[this._iface];
    const connected = Boolean(this._iface && curr && this._isInterfaceUp(this._iface));

    if (!prev || !curr) {
      this._prevStats = cur;
      this._iface = this.selectInterface(settings, cur);
      return { bytesPerSec: null, rxBps: null, txBps: null, mbit: 0, iface: this._iface, dRx: 0, dTx: 0, connected: false };
    }

    const dRx = curr.rxBytes - prev.rxBytes;
    const dTx = curr.txBytes - prev.txBytes;
    const rxBps = dRx / Math.max(dtSec, MIN_TIME_DELTA_SEC);
    const txBps = dTx / Math.max(dtSec, MIN_TIME_DELTA_SEC);
    const bytesPerSec = (dRx + dTx) / Math.max(dtSec, MIN_TIME_DELTA_SEC);
    const mbit = (bytesPerSec * BITS_PER_BYTE) / BITS_PER_MBIT;

    this._prevStats = cur;

    return { bytesPerSec, rxBps, txBps, mbit, iface: this._iface, dRx, dTx, connected };
  }

  get iface() {
    return this._iface;
  }
}
