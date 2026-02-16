import Gio from 'gi://Gio';

/**
 * Theme definitions: maps theme name → { slow, medium, fast } animal folder names
 */
const THEMES = {
  classic:  { slow: 'snail',   medium: 'turtle',  fast: 'rabbit'},
  aquatic:  { slow: 'fish',    medium: 'dolphin',  fast: 'whale' },
  domestic: { slow: 'cat',     medium: 'dog',      fast: 'horse' },
  birds:    { slow: 'penguin', medium: 'duck',     fast: 'eagle' },
  insects:  { slow: 'ant',     medium: 'ladybug',  fast: 'bee' },
};

/**
 * Icon loader - loads SVG frames and fixed icons for all monitors
 */
export class IconLoader {
  constructor(extensionPath) {
    this._path = extensionPath;
  }

  /**
   * Load numbered SVG frames from a theme folder:
   * icons/themes/{theme}/{animal}/frame_1.svg ... frame_{count}.svg
   */
  loadThemeFrames(theme, animal) {
    const arr = [];
    const dirPath = `${this._path}/icons/themes/${theme}/${animal}`;
    const dir = Gio.File.new_for_path(dirPath);

    try {
      const enumerator = dir.enumerate_children(
        'standard::name',
        Gio.FileQueryInfoFlags.NONE,
        null
      );

      let info;
      while ((info = enumerator.next_file(null)) !== null) {
        const name = info.get_name();

        // match frame_1.svg, frame_2.svg, etc.
        if (/^frame_\d+\.svg$/.test(name)) {
          const filePath = `${dirPath}/${name}`;
          const file = Gio.File.new_for_path(filePath);
          arr.push(new Gio.FileIcon({ file }));
        }
      }

      enumerator.close(null);

      // Optionnel mais recommandé : trier les frames dans l'ordre numérique
      arr.sort((a, b) => {
        const getIndex = icon =>
          parseInt(icon.file.get_basename().match(/\d+/)[0], 10);
        return getIndex(a) - getIndex(b);
      });

    } catch (e) {
      log(`Error loading frames: ${e}`);
    }

    return arr;
  }

  /**
   * Load a single static icon from a theme folder:
   * icons/themes/{theme}/{animal}/fixed.svg
   */
  loadThemeFixedIcon(theme, animal) {
    const filePath = `${this._path}/icons/themes/${theme}/${animal}/fixed.svg`;
    const file = Gio.File.new_for_path(filePath);
    if (file.query_exists(null)) {
      return new Gio.FileIcon({ file });
    }
    return null;
  }

  /**
   * Load numbered SVG frames: icons/{name}/{name}-1.svg ... icons/{name}/{name}-{count}.svg
   */
  loadFrames(name, count) {
    const arr = [];
    for (let i = 1; i <= count; i++) {
      const filePath = `${this._path}/icons/${name}/${name}-${i}.svg`;
      const file = Gio.File.new_for_path(filePath);
      if (file.query_exists(null)) {
        arr.push(new Gio.FileIcon({ file }));
      }
    }
    return arr;
  }

  /**
   * Load a single static icon: icons/{name}/fixed-{name}.svg
   */
  loadFixedIcon(name) {
    const filePath = `${this._path}/icons/${name}/fixed-${name}.svg`;
    const file = Gio.File.new_for_path(filePath);
    if (file.query_exists(null)) {
      return new Gio.FileIcon({ file });
    }
    return null;
  }

  /**
   * Load all icons for the extension with theme support
   * @param {string} themeName - theme name (classic, aquatic, domestic, birds, insects)
   */
  loadAll(themeName = 'classic') {
    const themeDef = THEMES[themeName] || THEMES.classic;
    
    return {
      frames: {
        snail: this.loadThemeFrames(themeName, themeDef.slow),
        turtle: this.loadThemeFrames(themeName, themeDef.medium),
        rabbit: this.loadThemeFrames(themeName, themeDef.fast),
      },
      fixedFrames: {
        snail: this.loadThemeFixedIcon(themeName, themeDef.slow),
        turtle: this.loadThemeFixedIcon(themeName, themeDef.medium),
        rabbit: this.loadThemeFixedIcon(themeName, themeDef.fast),
      },
      blobFrames: this.loadFrames('blob', 4),
      cpuFrames: this.loadFrames('cpu', 4),
      temperatureFrames: this.loadFrames('temperature', 4),
      diskFrames: this.loadFrames('disk', 4),
    };
  }

  /**
   * Get list of available theme names
   */
  static getAvailableThemes() {
    return Object.keys(THEMES);
  }

  /**
   * Get theme display info
   */
  static getThemeInfo() {
    return THEMES;
  }
}
