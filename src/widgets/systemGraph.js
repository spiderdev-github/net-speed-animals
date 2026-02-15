import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

/**
 * SystemGraph Widget
 * Displays a line graph of system metric history (memory, CPU, temperature)
 */
export const SystemGraph = GObject.registerClass(
class SystemGraph extends St.DrawingArea {
  _init(params = {}) {
    // Extract custom parameters before calling super._init()
    const width = params.width || 300;
    const height = params.height || 60;
    const maxDataPoints = params.maxDataPoints || 60;
    const lineColor = params.lineColor || '#4ade80'; // Green
    const title = params.title || 'System Metric';
    const unit = params.unit || '%';
    const minValue = params.minValue || 0;
    const maxValue = params.maxValue || 100;

    // Only pass St.DrawingArea-compatible properties to super._init()
    super._init({
      style_class: 'system-graph',
      x_expand: true,
    });

    // Set graph dimensions
    this._width = width;
    this._height = height;
    this.set_width(this._width);
    this.set_height(this._height);

    // Data storage
    this._maxDataPoints = maxDataPoints;
    this._data = new Array(this._maxDataPoints).fill(minValue);

    // Graph settings
    this._lineColor = lineColor;
    this._title = title;
    this._unit = unit;
    this._minValue = minValue;
    this._maxValue = maxValue;

    // Connect repaint signal
    this.connect('repaint', this._onRepaint.bind(this));
  }

  /**
   * Add a new data point
   * @param {number} value - Value to add
   */
  addDataPoint(value) {
    // Shift array and add new value
    this._data.shift();
    this._data.push(value || this._minValue);

    // Request repaint
    this.queue_repaint();
  }

  /**
   * Clear all data
   */
  clear() {
    this._data.fill(this._minValue);
    this.queue_repaint();
  }

  /**
   * Set the line color
   * @param {string} color - Hex color (e.g., '#4ade80')
   */
  setColor(color) {
    this._lineColor = color;
    this.queue_repaint();
  }

  /**
   * Repaint callback - draws the graph
   */
  _onRepaint(area) {
    const cr = area.get_context();
    const [width, height] = area.get_surface_size();

    // Clear background
    cr.setSourceRGBA(0, 0, 0, 0.2);
    cr.rectangle(0, 0, width, height);
    cr.fill();

    // Find value range for scaling
    const range = this._maxValue - this._minValue;

    // Draw grid lines (horizontal)
    cr.setSourceRGBA(1, 1, 1, 0.1);
    cr.setLineWidth(1);
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      cr.moveTo(0, y);
      cr.lineTo(width, y);
      cr.stroke();
    }

    // Parse hex color
    const r = parseInt(this._lineColor.substr(1, 2), 16) / 255;
    const g = parseInt(this._lineColor.substr(3, 2), 16) / 255;
    const b = parseInt(this._lineColor.substr(5, 2), 16) / 255;

    // Draw filled area
    cr.setSourceRGBA(r, g, b, 0.3);
    cr.moveTo(0, height);

    for (let i = 0; i < this._data.length; i++) {
      const x = (width / (this._data.length - 1)) * i;
      const normalizedValue = (this._data[i] - this._minValue) / range;
      const y = height - (normalizedValue * height);
      cr.lineTo(x, y);
    }

    cr.lineTo(width, height);
    cr.closePath();
    cr.fill();

    // Draw line
    cr.setSourceRGBA(r, g, b, 0.9);
    cr.setLineWidth(2);
    const firstNormalized = (this._data[0] - this._minValue) / range;
    cr.moveTo(0, height - (firstNormalized * height));

    for (let i = 1; i < this._data.length; i++) {
      const x = (width / (this._data.length - 1)) * i;
      const normalizedValue = (this._data[i] - this._minValue) / range;
      const y = height - (normalizedValue * height);
      cr.lineTo(x, y);
    }

    cr.stroke();

    cr.$dispose();
  }

  /**
   * Clean up
   */
  destroy() {
    this._data = null;
    super.destroy();
  }
});
