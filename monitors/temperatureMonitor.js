import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

/**
 * Temperature Monitor
 * Reads CPU/system temperature from /sys/class/thermal/thermal_zone* files
 */
export class TemperatureMonitor {
  constructor() {
    this._thermalZones = [];
    this._selectedZone = null;
    this._detectThermalZones();
  }

  /**
   * Detect available thermal zones
   */
  _detectThermalZones() {
    this._thermalZones = [];

    // Check for thermal zones (typically 0-10)
    for (let i = 0; i < 11; i++) {
      const tempPath = `/sys/class/thermal/thermal_zone${i}/temp`;
      const typePath = `/sys/class/thermal/thermal_zone${i}/type`;

      const tempFile = Gio.File.new_for_path(tempPath);
      if (tempFile.query_exists(null)) {
        let zoneName = `thermal_zone${i}`;

        // Try to read the zone type for a better name
        try {
          const typeFile = Gio.File.new_for_path(typePath);
          if (typeFile.query_exists(null)) {
            const [success, contents] = typeFile.load_contents(null);
            if (success) {
              const decoder = new TextDecoder('utf-8');
              const typeContent = decoder.decode(contents).trim();
              if (typeContent) {
                zoneName = typeContent;
              }
            }
          }
        } catch (e) {
          // Ignore errors reading type file
        }

        this._thermalZones.push({
          index: i,
          path: tempPath,
          name: zoneName,
        });
      }
    }

    // Select the first zone by default (usually the CPU package)
    if (this._thermalZones.length > 0) {
      this._selectedZone = this._thermalZones[0];
    }
  }

  /**
   * Get list of available thermal zones
   * @returns {Array} Array of {index, path, name} objects
   */
  getThermalZones() {
    return this._thermalZones;
  }

  /**
   * Set the thermal zone to monitor by index
   * @param {number} zoneIndex - The thermal zone index
   */
  setZone(zoneIndex) {
    const zone = this._thermalZones.find(z => z.index === zoneIndex);
    if (zone) {
      this._selectedZone = zone;
    }
  }

  /**
   * Set the thermal zone to monitor by name
   * @param {string} zoneName - The thermal zone name/type
   */
  setZoneByName(zoneName) {
    const zone = this._thermalZones.find(z => z.name === zoneName);
    if (zone) {
      this._selectedZone = zone;
    }
  }

  /**
   * Read temperature from the selected thermal zone
   * @returns {number|null} Temperature in Celsius, or null if unavailable
   */
  readTemperature() {
    if (!this._selectedZone) {
      return null;
    }

    try {
      const file = Gio.File.new_for_path(this._selectedZone.path);
      if (!file.query_exists(null)) {
        return null;
      }

      const [success, contents] = file.load_contents(null);
      if (!success) {
        return null;
      }

      const decoder = new TextDecoder('utf-8');
      const tempString = decoder.decode(contents).trim();
      const tempMilliCelsius = parseInt(tempString, 10);

      if (isNaN(tempMilliCelsius)) {
        return null;
      }

      // Convert from millidegrees to degrees Celsius
      return tempMilliCelsius / 1000.0;
    } catch (e) {
      console.error(`Error reading temperature: ${e.message}`);
      return null;
    }
  }

  /**
   * Get the current selected zone name
   * @returns {string|null} The zone name or null
   */
  getSelectedZoneName() {
    return this._selectedZone ? this._selectedZone.name : null;
  }

  /**
   * Check if temperature monitoring is available
   * @returns {boolean} True if at least one thermal zone exists
   */
  isAvailable() {
    return this._thermalZones.length > 0;
  }

  /**
   * Determine temperature level based on thresholds
   * @param {number} temp - Temperature in Celsius
   * @param {number} warm - Warm threshold (default 50°C)
   * @param {number} hot - Hot threshold (default 70°C)
   * @param {number} critical - Critical threshold (default 85°C)
   * @returns {number} Level 0-3 (cool/warm/hot/critical)
   */
  getTemperatureLevel(temp, warm = 50, hot = 70, critical = 85) {
    if (temp === null) return 0;

    if (temp >= critical) return 3; // Critical
    if (temp >= hot) return 2;      // Hot
    if (temp >= warm) return 1;     // Warm
    return 0;                        // Cool
  }
}
