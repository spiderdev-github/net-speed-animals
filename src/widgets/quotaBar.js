import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

/**
 * QuotaBar Widget
 * Displays a progress bar showing bandwidth quota usage
 */
export const QuotaBar = GObject.registerClass(
class QuotaBar extends St.DrawingArea {
  _init(params = {}) {
    const width = params.width || 300;
    const height = params.height || 24;

    super._init({
      style_class: 'quota-bar',
      x_expand: true,
    });

    this._width = width;
    this._height = height;
    this.set_width(this._width);
    this.set_height(this._height);

    this._percent = 0;
    this._usedGB = 0;
    this._quotaGB = 0;

    this.connect('repaint', this._onRepaint.bind(this));
  }

  /**
   * Update quota values
   * @param {number} usedBytes - Bytes used this month
   * @param {number} quotaGB - Monthly quota in GB
   */
  updateQuota(usedBytes, quotaGB) {
    this._quotaGB = quotaGB;
    this._usedGB = usedBytes / (1024 ** 3);
    this._percent = quotaGB > 0 ? Math.min((this._usedGB / quotaGB) * 100, 100) : 0;
    this.queue_repaint();
  }

  _onRepaint(area) {
    const cr = area.get_context();
    const [width, height] = area.get_surface_size();

    const barHeight = 12;
    const barY = (height - barHeight) / 2;
    const radius = 6;

    // Background bar (dark)
    cr.setSourceRGBA(1, 1, 1, 0.15);
    this._drawRoundedRect(cr, 0, barY, width, barHeight, radius);
    cr.fill();

    // Progress bar (colored based on percentage)
    const fillWidth = (this._percent / 100) * width;
    if (fillWidth > 0) {
      let r, g, b;
      if (this._percent >= 90) {
        // Red - critical
        r = 0.937; g = 0.267; b = 0.267;
      } else if (this._percent >= 75) {
        // Orange - warning
        r = 0.984; g = 0.573; b = 0.235;
      } else if (this._percent >= 50) {
        // Yellow
        r = 0.984; g = 0.749; b = 0.141;
      } else {
        // Green - safe
        r = 0.29; g = 0.855; b = 0.498;
      }

      cr.setSourceRGBA(r, g, b, 0.9);
      this._drawRoundedRect(cr, 0, barY, Math.max(fillWidth, radius * 2), barHeight, radius);
      cr.fill();
    }

    // Text: "XX.X GB / YY GB (ZZ%)"
    cr.setSourceRGBA(1, 1, 1, 0.9);
    cr.selectFontFace('Sans', 0, 0);
    cr.setFontSize(10);

    const text = `${this._usedGB.toFixed(1)} GB / ${this._quotaGB.toFixed(0)} GB (${this._percent.toFixed(1)}%)`;
    const extents = cr.textExtents(text);
    const textX = (width - extents.width) / 2;
    const textY = barY + barHeight / 2 + extents.height / 2;
    cr.moveTo(textX, textY);
    cr.showText(text);

    cr.$dispose();
  }

  _drawRoundedRect(cr, x, y, w, h, r) {
    const deg = Math.PI / 180;
    cr.newPath();
    cr.arc(x + w - r, y + r, r, -90 * deg, 0);
    cr.arc(x + w - r, y + h - r, r, 0, 90 * deg);
    cr.arc(x + r, y + h - r, r, 90 * deg, 180 * deg);
    cr.arc(x + r, y + r, r, 180 * deg, 270 * deg);
    cr.closePath();
  }

  destroy() {
    super.destroy();
  }
});
