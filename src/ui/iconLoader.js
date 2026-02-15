import Gio from 'gi://Gio';

/**
 * Icon loader - loads SVG frames and fixed icons for all monitors
 */
export class IconLoader {
  constructor(extensionPath) {
    this._path = extensionPath;
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
   * Load all icons for the extension
   */
  loadAll() {
    return {
      frames: {
        snail: this.loadFrames('snail', 8),
        turtle: this.loadFrames('turtle', 8),
        rabbit: this.loadFrames('rabbit', 8),
      },
      fixedFrames: {
        snail: this.loadFixedIcon('snail'),
        turtle: this.loadFixedIcon('turtle'),
        rabbit: this.loadFixedIcon('rabbit'),
      },
      blobFrames: this.loadFrames('blob', 4),
      cpuFrames: this.loadFrames('cpu', 4),
      temperatureFrames: this.loadFrames('temperature', 4),
      diskFrames: this.loadFrames('disk', 4),
    };
  }
}
