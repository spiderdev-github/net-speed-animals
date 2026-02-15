import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

/**
 * Animation controller - manages animal icon frame cycling
 */
export class AnimationController {
  constructor(icon, frames, fixedFrames, settings) {
    this._icon = icon;
    this._frames = frames;
    this._fixedFrames = fixedFrames;
    this._settings = settings;
    this._animal = 'snail';
    this._frameIndex = 0;
    this._animTimerId = 0;
    this._animIntervalMs = 250;
  }

  /**
   * Start the animation timer
   */
  start(intervalMs) {
    this._animIntervalMs = intervalMs;
    if (this._animTimerId) GLib.source_remove(this._animTimerId);
    this._animTimerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, intervalMs, () => {
      this._tick();
      return GLib.SOURCE_CONTINUE;
    });
  }

  _tick() {
    if (!this._icon || !this._frames) return;
    if (this._settings && this._settings.get_boolean('disable-animation')) return;

    const frames = this._frames[this._animal] ?? [];
    if (frames.length === 0) return;

    this._frameIndex = (this._frameIndex + 1) % frames.length;
    this._icon.gicon = frames[this._frameIndex];
  }

  /**
   * Apply the current frame (or static icon if animation disabled)
   */
  applyFrame(forceFirst = false) {
    if (!this._icon || !this._frames) return;

    if (this._settings && this._settings.get_boolean('disable-animation')) {
      const fixedIcon = this._fixedFrames?.[this._animal];
      if (fixedIcon) {
        this._icon.gicon = fixedIcon;
      } else {
        this._icon.gicon = new Gio.ThemedIcon({ name: 'network-transmit-receive-symbolic' });
      }
      return;
    }

    const frames = this._frames[this._animal] ?? [];
    if (frames.length === 0) {
      this._icon.gicon = new Gio.ThemedIcon({ name: 'network-transmit-receive-symbolic' });
      return;
    }

    if (forceFirst) this._frameIndex = 0;
    this._icon.gicon = frames[this._frameIndex];
  }

  /**
   * Set current animal and optionally reset frame
   */
  setAnimal(animal) {
    const changed = animal !== this._animal;
    this._animal = animal;
    if (changed) {
      this.applyFrame(true);
    }
    return changed;
  }

  /**
   * Update animation interval if significantly different
   */
  updateInterval(newInterval) {
    if (Math.abs(newInterval - this._animIntervalMs) > 30) {
      this._animIntervalMs = newInterval;
      this.start(this._animIntervalMs);
    }
  }

  get animal() {
    return this._animal;
  }

  destroy() {
    if (this._animTimerId) {
      GLib.source_remove(this._animTimerId);
      this._animTimerId = 0;
    }
    this._icon = null;
    this._frames = null;
    this._fixedFrames = null;
    this._settings = null;
  }
}
