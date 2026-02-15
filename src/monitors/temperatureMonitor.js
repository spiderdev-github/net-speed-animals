import Gio from 'gi://Gio';

/*
 * Temperature Monitor
 * Tries thermal_zone first, then hwmon temp*_input
 */
export class TemperatureMonitor {
  constructor() {
    this._sources = [];
    this._selected = null;
    this._detectSources();
  }

  _detectSources() {
    this._sources = [];
    this._selected = null;

    this._detectThermalZones();
    this._detectHwmon();

    if (this._sources.length > 0)
      this._selected = this._pickBestDefault(this._sources);
  }

  _readText(path) {
    try {
      const f = Gio.File.new_for_path(path);
      if (!f.query_exists(null))
        return null;
      const [ok, bytes] = f.load_contents(null);
      if (!ok)
        return null;
      return new TextDecoder('utf-8').decode(bytes).trim();
    } catch (e) {
      return null;
    }
  }

  _listDirs(path) {
    const out = [];
    try {
      const dir = Gio.File.new_for_path(path);
      if (!dir.query_exists(null))
        return out;

      const en = dir.enumerate_children(
        'standard::name,standard::type',
        Gio.FileQueryInfoFlags.NONE,
        null
      );

      let info;
      while ((info = en.next_file(null)) !== null) {
        if (info.get_file_type() === Gio.FileType.DIRECTORY)
          out.push(info.get_name());
      }
      en.close(null);
    } catch (e) {
      // ignore
    }
    return out;
  }

  _listFiles(path) {
    const out = [];
    try {
      const dir = Gio.File.new_for_path(path);
      if (!dir.query_exists(null))
        return out;

      const en = dir.enumerate_children(
        'standard::name,standard::type',
        Gio.FileQueryInfoFlags.NONE,
        null
      );

      let info;
      while ((info = en.next_file(null)) !== null) {
        if (info.get_file_type() === Gio.FileType.REGULAR)
          out.push(info.get_name());
      }
      en.close(null);
    } catch (e) {
      // ignore
    }
    return out;
  }

  _detectThermalZones() {
    const base = '/sys/class/thermal';
    const dirs = this._listDirs(base).filter(n => n.startsWith('thermal_zone'));

    for (const d of dirs) {
      const tempPath = `${base}/${d}/temp`;
      const typePath = `${base}/${d}/type`;

      const tempStr = this._readText(tempPath);
      if (tempStr === null)
        continue;

      let name = d;
      const typeStr = this._readText(typePath);
      if (typeStr)
        name = typeStr;

      this._sources.push({
        id: `thermal:${d}`,
        kind: 'thermal',
        name,
        path: tempPath,
      });
    }
  }

  _detectHwmon() {
    const base = '/sys/class/hwmon';
    const hwmons = this._listDirs(base).filter(n => n.startsWith('hwmon'));

    for (const h of hwmons) {
      const hPath = `${base}/${h}`;
      const chipName = this._readText(`${hPath}/name`) || h;

      const files = this._listFiles(hPath);

      // tempX_input files
      const tempInputs = files
        .filter(fn => /^temp\d+_input$/.test(fn))
        .sort((a, b) => {
          const ai = parseInt(a.match(/^temp(\d+)_/)[1], 10);
          const bi = parseInt(b.match(/^temp(\d+)_/)[1], 10);
          return ai - bi;
        });

      for (const fn of tempInputs) {
        const idx = parseInt(fn.match(/^temp(\d+)_/)[1], 10);
        const inputPath = `${hPath}/${fn}`;
        const labelPath = `${hPath}/temp${idx}_label`;

        // Validate readable numeric content
        const val = this._readText(inputPath);
        if (val === null)
          continue;
        const n = parseInt(val, 10);
        if (!Number.isFinite(n))
          continue;

        const label = this._readText(labelPath);
        const pretty = label ? `${chipName} - ${label}` : `${chipName} - temp${idx}`;

        this._sources.push({
          id: `hwmon:${h}:temp${idx}`,
          kind: 'hwmon',
          name: pretty,
          path: inputPath,
          chip: chipName,
          label: label || `temp${idx}`,
        });
      }
    }
  }

  _pickBestDefault(sources) {
    // Prefer common CPU sensors
    const score = s => {
      const name = (s.name || '').toLowerCase();
      const chip = (s.chip || '').toLowerCase();

      let v = 0;

      // Known CPU drivers
      if (chip.includes('coretemp')) v += 100;
      if (chip.includes('k10temp')) v += 100;
      if (chip.includes('zenpower')) v += 80;

      // Labels that look like CPU/package
      if (name.includes('package')) v += 60;
      if (name.includes('tctl')) v += 55;
      if (name.includes('tdie')) v += 55;
      if (name.includes('cpu')) v += 40;
      if (name.includes('core')) v += 20;

      // Avoid some common non CPU picks
      if (name.includes('pch')) v -= 10;
      if (name.includes('nvme')) v -= 30;
      if (name.includes('acpitz')) v -= 20;

      // Prefer hwmon over thermal if both exist (often more reliable)
      if (s.kind === 'hwmon') v += 10;

      return v;
    };

    let best = sources[0];
    let bestScore = score(best);

    for (let i = 1; i < sources.length; i++) {
      const sc = score(sources[i]);
      if (sc > bestScore) {
        best = sources[i];
        bestScore = sc;
      }
    }

    return best;
  }

  getThermalZones() {
    // Backward compatible: return all sources as zones list
    // If you want, rename in UI to "Temperature sources"
    return this._sources.map((s, i) => ({
      index: i,
      path: s.path,
      name: s.name,
      id: s.id,
      kind: s.kind,
    }));
  }

  setZone(zoneIndex) {
    const z = this.getThermalZones().find(x => x.index === zoneIndex);
    if (!z) return;

    const src = this._sources.find(s => s.path === z.path && s.id === z.id);
    if (src) this._selected = src;
  }

  setZoneByName(zoneName) {
    const src = this._sources.find(s => s.name === zoneName);
    if (src) this._selected = src;
  }

  setSourceById(id) {
    const src = this._sources.find(s => s.id === id);
    if (src) this._selected = src;
  }

  readTemperature() {
    if (!this._selected)
      return null;

    try {
      const tempString = this._readText(this._selected.path);
      if (tempString === null)
        return null;

      const v = parseInt(tempString, 10);
      if (!Number.isFinite(v))
        return null;

      // thermal_zone and hwmon both usually expose millidegree Celsius
      return v / 1000.0;
    } catch (e) {
      console.error(`Error reading temperature: ${e.message}`);
      return null;
    }
  }

  getSelectedZoneName() {
    return this._selected ? this._selected.name : null;
  }

  isAvailable() {
    return this._sources.length > 0;
  }

  getTemperatureLevel(temp, warm = 50, hot = 70, critical = 85) {
    if (temp === null) return 0;
    if (temp >= critical) return 3;
    if (temp >= hot) return 2;
    if (temp >= warm) return 1;
    return 0;
  }
}
