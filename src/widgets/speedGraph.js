import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';

/**
 * SpeedGraph Widget
 * Displays a sparkline graph of network speed history
 */
export const SpeedGraph = GObject.registerClass(
class SpeedGraph extends St.DrawingArea {
  _init(params = {}) {
    // Extract custom parameters before calling super._init()
    const width = params.width || 300;
    const height = params.height || 60;
    const maxDataPoints = params.maxDataPoints || 60;
    const downloadColor = params.downloadColor || '#4ade80'; // Green
    const uploadColor = params.uploadColor || '#60a5fa';     // Blue

    // Only pass St.DrawingArea-compatible properties to super._init()
    super._init({
      style_class: 'speed-graph',
      x_expand: true,
    });

    // Set graph dimensions
    this._width = width;
    this._height = height;
    this.set_width(this._width);
    this.set_height(this._height);

    // Data storage (keeps last 60 data points = 1 minute at 1 sec interval)
    this._maxDataPoints = maxDataPoints;
    this._downloadData = new Array(this._maxDataPoints).fill(0);
    this._uploadData = new Array(this._maxDataPoints).fill(0);

    // Graph settings
    this._showDownload = true;
    this._showUpload = true;
    this._downloadColor = downloadColor;
    this._uploadColor = uploadColor;

    // Connect repaint signal
    this._destroyed = false;
    this._repaintId = this.connect('repaint', this._onRepaint.bind(this));
  }

  /**
   * Add a new data point
   * @param {number} downloadSpeed - Download speed in bytes per second
   * @param {number} uploadSpeed - Upload speed in bytes per second
   */
  addDataPoint(downloadSpeed, uploadSpeed) {
    if (this._destroyed) return;

    // Shift array and add new value
    this._downloadData.shift();
    this._downloadData.push(downloadSpeed || 0);

    this._uploadData.shift();
    this._uploadData.push(uploadSpeed || 0);

    // Request repaint
    this.queue_repaint();
  }

  /**
   * Clear all data
   */
  clear() {
    if (this._destroyed) return;
    this._downloadData.fill(0);
    this._uploadData.fill(0);
    this.queue_repaint();
  }

  /**
   * Set which lines to show
   */
  setVisibility(showDownload, showUpload) {
    if (this._destroyed) return;
    this._showDownload = showDownload;
    this._showUpload = showUpload;
    this.queue_repaint();
  }

  /**
   * Repaint callback - draws the graph
   */
  _onRepaint(area) {
    if (this._destroyed) return;
    if (!area) return;
    const cr = area.get_context();
    const [width, height] = area.get_surface_size();

    // Clear background
    cr.setSourceRGBA(0, 0, 0, 0.2);
    cr.rectangle(0, 0, width, height);
    cr.fill();

    // Find max value for scaling
    const allData = [...this._downloadData, ...this._uploadData];
    const maxValue = Math.max(...allData, 1); // Avoid division by zero

    // Draw grid lines (horizontal)
    cr.setSourceRGBA(1, 1, 1, 0.1);
    cr.setLineWidth(1);
    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      cr.moveTo(0, y);
      cr.lineTo(width, y);
      cr.stroke();
    }

    // Draw upload line (blue)
    if (this._showUpload) {
      this._drawLine(cr, this._uploadData, maxValue, width, height, this._uploadColor);
    }

    // Draw download line (green) - on top
    if (this._showDownload) {
      this._drawLine(cr, this._downloadData, maxValue, width, height, this._downloadColor);
    }

    cr.$dispose();
  }

  /**
   * Draw a line on the graph
   */
  _drawLine(cr, data, maxValue, width, height, colorHex) {
    // Parse hex color
    const r = parseInt(colorHex.substr(1, 2), 16) / 255;
    const g = parseInt(colorHex.substr(3, 2), 16) / 255;
    const b = parseInt(colorHex.substr(5, 2), 16) / 255;

    // Draw filled area
    cr.setSourceRGBA(r, g, b, 0.3);
    cr.moveTo(0, height);

    for (let i = 0; i < data.length; i++) {
      const x = (width / (data.length - 1)) * i;
      const normalizedValue = data[i] / maxValue;
      const y = height - (normalizedValue * height);
      cr.lineTo(x, y);
    }

    cr.lineTo(width, height);
    cr.closePath();
    cr.fill();

    // Draw line
    cr.setSourceRGBA(r, g, b, 0.9);
    cr.setLineWidth(2);
    cr.moveTo(0, height - (data[0] / maxValue) * height);

    for (let i = 1; i < data.length; i++) {
      const x = (width / (data.length - 1)) * i;
      const normalizedValue = data[i] / maxValue;
      const y = height - (normalizedValue * height);
      cr.lineTo(x, y);
    }

    cr.stroke();
  }

  /**
   * Clean up
   */
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;

    if (this._repaintId) {
      try {
        this.disconnect(this._repaintId);
      } catch (e) {
      }
      this._repaintId = 0;
    }

    this._downloadData = null;
    this._uploadData = null;

    super.destroy();
  }
});
