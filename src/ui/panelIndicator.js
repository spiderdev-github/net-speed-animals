import St from 'gi://St';

/**
 * Panel indicator - builds the top bar icons and labels
 */
export class PanelIndicator {
  constructor(settings) {
    this._settings = settings;
    this._signalIds = [];
    this._widgets = {};
  }

  /**
   * Build the panel box layout with all icons and labels
   * @param {Object} callbacks - { onLeftClick, onMiddleClick, onScroll, onAnimationToggle }
   * @returns {St.BoxLayout} the built box
   */
  build(callbacks) {
    const box = new St.BoxLayout({
      style_class: 'panel-status-menu-box',
      style: 'padding-right: 20px;',
    });

    // Icons
    this._widgets.icon = new St.Icon({
      gicon: null,
      icon_size: this._getIconSize(),
      style_class: 'system-status-icon netspeed-icon',
    });

    this._widgets.blobIcon = new St.Icon({
      gicon: null,
      icon_size: this._getIconSize(),
      style_class: 'system-status-icon netspeed-blob-icon',
    });

    this._widgets.cpuIcon = new St.Icon({
      gicon: null,
      icon_size: this._getIconSize(),
      style_class: 'system-status-icon netspeed-cpu-icon',
    });

    this._widgets.temperatureIcon = new St.Icon({
      gicon: null,
      icon_size: this._getIconSize(),
      style_class: 'system-status-icon netspeed-temperature-icon',
    });

    this._widgets.diskIcon = new St.Icon({
      gicon: null,
      icon_size: this._getIconSize(),
      style_class: 'system-status-icon netspeed-disk-icon',
    });

    this._applyIconSize();

    // Labels
    this._widgets.speedLabel = new St.Label({
      text: '-- B/s',
      style_class: 'netspeed-label',
      style: 'min-width: 70px; text-align: right;',
    });

    this._widgets.memoryLabel = new St.Label({
      text: '-- %',
      style_class: 'netspeed-memory-label',
    });

    this._widgets.cpuLabel = new St.Label({
      text: '-- %',
      style_class: 'netspeed-cpu-label',
    });

    this._widgets.temperatureLabel = new St.Label({
      text: '--°C',
      style_class: 'netspeed-temperature-label',
    });

    this._widgets.diskLabel = new St.Label({
      text: '-- MB/s',
      style_class: 'netspeed-disk-label nsa-diskio-label',
    });

    // Initial visibility from settings
    this._widgets.icon.visible = this._settings.get_boolean('show-animal-icon');
    this._widgets.blobIcon.visible = this._settings.get_boolean('show-memory-icon');
    this._widgets.cpuIcon.visible = this._settings.get_boolean('show-cpu-icon');
    this._widgets.speedLabel.visible = this._settings.get_boolean('show-speed-label');
    this._widgets.memoryLabel.visible = this._settings.get_boolean('show-memory-label');
    this._widgets.cpuLabel.visible = this._settings.get_boolean('show-cpu-label');
    this._widgets.temperatureIcon.visible = this._settings.get_boolean('show-temperature-icon');
    this._widgets.temperatureLabel.visible = this._settings.get_boolean('show-temperature-label');
    this._widgets.diskIcon.visible = this._settings.get_boolean('show-disk-icon');
    this._widgets.diskLabel.visible = this._settings.get_boolean('show-disk-label');

    // Settings listeners for visibility toggles
    const visibilityMap = [
      ['show-animal-icon', 'icon'],
      ['show-memory-icon', 'blobIcon'],
      ['show-cpu-icon', 'cpuIcon'],
      ['show-speed-label', 'speedLabel'],
      ['show-memory-label', 'memoryLabel'],
      ['show-cpu-label', 'cpuLabel'],
      ['show-temperature-icon', 'temperatureIcon'],
      ['show-temperature-label', 'temperatureLabel'],
      ['show-disk-icon', 'diskIcon'],
      ['show-disk-label', 'diskLabel'],
    ];

    for (const [settingKey, widgetKey] of visibilityMap) {
      const id = this._settings.connect(`changed::${settingKey}`, () => {
        const w = this._widgets[widgetKey];
        if (w) w.visible = this._settings.get_boolean(settingKey);
      });
      this._signalIds.push(id);
    }

    // Icon size listener
    const iconSizeId = this._settings.connect('changed::icon-size', () => {
      this._applyIconSize();
    });
    this._signalIds.push(iconSizeId);

    // Disable animation listener
    if (callbacks.onAnimationToggle) {
      const id = this._settings.connect('changed::disable-animation', () => {
        callbacks.onAnimationToggle();
      });
      this._signalIds.push(id);
    }

    // Separator labels
    this._widgets.sepSpeed = new St.Label({ text: '  ', style_class: 'separate-label' });
    this._widgets.sepMem = new St.Label({ text: '  ', style_class: 'separate-label' });
    this._widgets.sepCpu = new St.Label({ text: '  ', style_class: 'separate-label' });
    this._widgets.sepDisk = new St.Label({ text: '  ', style_class: 'separate-label' });

    // Build layout
    box.add_child(this._widgets.diskLabel);
    box.add_child(this._widgets.diskIcon);
    box.add_child(this._widgets.sepDisk);
    
    box.add_child(this._widgets.speedLabel);
    box.add_child(this._widgets.icon);
    box.add_child(this._widgets.sepSpeed);
    
    box.add_child(this._widgets.memoryLabel);
    box.add_child(this._widgets.blobIcon);
    box.add_child(this._widgets.sepMem);
    
    box.add_child(this._widgets.cpuLabel);
    box.add_child(this._widgets.cpuIcon);
    box.add_child(this._widgets.sepCpu);
    
    box.add_child(this._widgets.temperatureLabel);
    box.add_child(this._widgets.temperatureIcon);
      

    // Event handlers
    box.reactive = true;
    box.track_hover = true;

    box.connect('button-press-event', (actor, event) => {
      const button = event.get_button();
      if (button === 1 && callbacks.onLeftClick) {
        return callbacks.onLeftClick();
      } else if (button === 2 && callbacks.onMiddleClick) {
        return callbacks.onMiddleClick();
      }
      return false;
    });

    box.connect('scroll-event', (actor, event) => {
      if (callbacks.onScroll) {
        return callbacks.onScroll(event);
      }
      return false;
    });

    return box;
  }


  _getIconSize() {
    try {
      const v = this._settings.get_int('icon-size');
      return (v && v > 0) ? v : 32;
    } catch (e) {
      return 32;
    }
  }

  _applyIconSize() {
    const size = this._getIconSize();
    const keys = ['icon', 'blobIcon', 'cpuIcon', 'temperatureIcon', 'diskIcon'];

    for (const k of keys) {
      const w = this._widgets[k];
      if (!w) continue;
      w.icon_size = size;
      // Ensure CSS fixed sizes do not override the icon size
      w.set_style(`icon-size: ${size}px; width: ${size}px; height: ${size}px;`);
    }
  }

  getWidgets() {
    return this._widgets;
  }

  destroy() {
    for (const id of this._signalIds) {
      try { this._settings.disconnect(id); } catch { /* ignore */ }
    }
    this._signalIds = [];
    this._widgets = {};
    this._settings = null;
  }
}