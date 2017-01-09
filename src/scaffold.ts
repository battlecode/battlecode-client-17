import {electron, os, fs, path, child_process} from './electron-modules';

// Code that talks to the scaffold.

const WINDOWS = process.platform === 'windows';
const MAC = process.platform === 'mac os x';

const GRADLE_WRAPPER = WINDOWS ? 'gradlew.bat' : 'gradlew';

/**
 * Talk to the scaffold!
 */
export default class ScaffoldCommunicator {
  scaffoldPath: string;

  constructor(scaffoldPath: string) {
    if (!process.env.ELECTRON) throw new Error("Can't talk to scaffold in the browser!");

    console.log('Using scaffold at: '+scaffoldPath);

    this.scaffoldPath = scaffoldPath;

    // cursory check
    if (!fs.existsSync(this.wrapperPath)) {
      throw new Error(`Can't find gradle wrapper: ${this.wrapperPath}`);
    }
  }

  get wrapperPath() {
    return path.join(this.scaffoldPath, GRADLE_WRAPPER);
  }

  /**
   * Make a best-effort attempt to find the scaffold.
   */
  static findDefaultScaffoldPath(): string | null {
    if (!process.env.ELECTRON) return null;

    const appPath = electron.remote.app.getAppPath();

    // release/client
    const fromDev = path.join(path.dirname(appPath), 'battlecode-scaffold-2017');
    // scaffold/client/app
    const fromWinLin = path.dirname(path.dirname(appPath));
    // scaffold/Battlecode Client.app/Contents/Resources/app.asar
    const fromMac = path.dirname(path.dirname(path.dirname(path.dirname(appPath))));

    if (fs.existsSync(path.join(fromDev, GRADLE_WRAPPER))) {
      return fromDev;
    } else if (fs.existsSync(path.join(fromWinLin, GRADLE_WRAPPER))) {
      return fromWinLin;
    } else if (fs.existsSync(path.join(fromMac, GRADLE_WRAPPER))) {
      return fromMac;
    }
    return null;
  }

  /**
   * Asynchronously get a list of available players in the scaffold.
   */
  getPlayers(cb: (err: Error | null, packages: string[] | null) => void) {
    child_process.exec(`"${this.wrapperPath}" listPlayers`, {cwd: this.scaffoldPath}, (err, stdout, stderr) => {
      if (err) {
        cb(err, null);
      }
      const lines = stdout.split(/\r?\n/);
      const packages = new Array<string>();

      for (var i = 0; i < lines.length; i++) {
        const match = /PLAYER: (.*)/.exec(lines[i]);
        if (match) {
          packages.push(match[1]);
        }
      }

      cb(null, packages);
    });
  }

  /**
   * Asynchronously get a list of map paths.
   */
  getMaps(cb: (err: Error | null, maps: string[] | null) => void) {
    child_process.exec(`"${this.wrapperPath}" listMaps`, {cwd: this.scaffoldPath}, (err, stdout, stderr) => {
      if (err) {
        cb(err, null);
      }
      const lines = stdout.split(/\r?\n/);
      const maps = new Array<string>();

      for (var i = 0; i < lines.length; i++) {
        const match = /MAP: (.*)/.exec(lines[i]);
        if (match) {
          maps.push(match[1]);
        }
      }

      cb(null, maps);
    });
  }

  /**
   * Saves a map to the scaffold's maps/ folder.
   */
  saveMap(mapData: Uint8Array, mapName: string, cb: (err: Error | null) => void) {
    const dir = path.join(this.scaffoldPath, 'maps');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }

    fs.writeFile(path.join(this.scaffoldPath, 'maps', `${mapName}.map17`),
                 new Buffer(mapData),
                 cb);
  }

  /**
   * Run a match.
   *
   * Don't show the logs to the user unless there's an error; the relevant stuff will be included in the match file.
   *
   * TODO what if the server hangs?
   */
  runMatch(teamA: string, teamB: string, maps: string[], cb: (err: Error | null, stdout: string, stderr: string) => void) {
      child_process.exec(`"${this.wrapperPath}" run -PteamA=${teamA} -PteamB=${teamB} -Pmaps=${maps.join(',')}`,
                        {cwd: this.scaffoldPath}, cb);
  }
}
