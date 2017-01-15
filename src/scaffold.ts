import {electron, os, fs, path, child_process} from './electron-modules';

// Code that talks to the scaffold.

const WINDOWS = process.platform === 'win32';

const GRADLE_WRAPPER = WINDOWS ? 'gradlew.bat' : 'gradlew';

// Maps available in the server.
const SERVER_MAPS = [
  "Barrier",
  "DenseForest",
  "Enclosure",
  "Hurdle",
  "LineOfFire",
  "MagicWood",
  "shrine",
  "SparseForest"
].sort();

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

  get mapPath() {
    return path.join(this.scaffoldPath, 'maps');
  }

  get sourcePath() {
    return path.join(this.scaffoldPath, 'src');
  }

  /**
   * Make a best-effort attempt to find the scaffold.
   */
  static findDefaultScaffoldPath(): string | null {
    if (!process.env.ELECTRON) return null;

    const appPath = electron.remote.app.getAppPath();

    // release/client
    const fromDev = path.join(path.dirname(appPath), 'battlecode-scaffold-2017');
    // scaffold/client/Battlecode Client[.exe]
    // (May never happen?)
    const fromWin = path.dirname(path.dirname(appPath));

    // scaffold/client/resources/app.asar
    const from3 = path.dirname(path.dirname(path.dirname(appPath)));

    // scaffold/Battlecode Client.app/Contents/Resources/app.asar
    const fromMac = path.dirname(path.dirname(path.dirname(path.dirname(path.dirname(appPath)))));

    if (fs.existsSync(path.join(fromDev, GRADLE_WRAPPER))) {
      return fromDev;
    } else if (fs.existsSync(path.join(from3, GRADLE_WRAPPER))) {
      return from3;
    } else if (fs.existsSync(path.join(fromWin, GRADLE_WRAPPER))) {
      return fromWin;
    } else if (fs.existsSync(path.join(fromMac, GRADLE_WRAPPER))) {
      return fromMac;
    }
    return null;
  }

  /**
   * Asynchronously get a list of available players in the scaffold.
   */
  getPlayers(cb: (err: Error | null, packages?: string[]) => void) {
    walk(this.sourcePath, (err, files) => {
      if (err) return cb(err);
      if (!files) return cb(null, []);

      return cb(
        null,
        files
          .filter((file) => file.endsWith(path.sep + 'RobotPlayer.java') || file.endsWith(path.sep + 'RobotPlayer.scala'))
          .map((file) => {
            const relPath = path.relative(this.sourcePath, file);
            return relPath.substring(0, relPath.length - (path.sep + 'RobotPlayer.java').length)
                          .replace(new RegExp(WINDOWS? '\\\\' : '/', 'g'), '.')
                          .replace(new RegExp('/', 'g'), '.');
          })
      );
    });
  }

  /**
   * Asynchronously get a list of map paths.
   */
  getMaps(cb: (err: Error | null, maps?: string[]) => void) {
    fs.stat(this.mapPath, (err, stat) => {
      if (err != null) {
        // map path doesn't exist
        return cb(null, SERVER_MAPS);
      }
      if (!stat || !stat.isDirectory()) {
        return cb(null, SERVER_MAPS);
      }

      fs.readdir(this.mapPath, (err, files) => {
        if (err) {
          return cb(err);
        }

        // paths are relative for readdir
        return cb(null, files.filter((file) => file.endsWith('.map17'))
                  .map((file) => file.substring(0, file.length - 6))
                  .concat(SERVER_MAPS).sort());
      });
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
  runMatch(teamA: string, teamB: string, maps: string[], onErr: (err: Error) => void, onExitNoError: () => void,
           onStdout: (data: string) => void, onStderr: (data: string) => void) {
    const proc = child_process.spawn(
      this.wrapperPath,
      [
        `runFromClient`,
        `-x`,
        `unpackClient`,
        `-PteamA=${teamA}`,
        `-PteamB=${teamB}`,
        `-Pmaps=${maps.join(',')}`,
      ],
      {cwd: this.scaffoldPath}
    );
    const decoder = new window['TextDecoder']();
    proc.stdout.on('data', (data) => onStdout(decoder.decode(data)));
    proc.stderr.on('data', (data) => onStderr(decoder.decode(data)));
    proc.on('close', (code) => {
      if (code === 0) {
        onExitNoError();
      } else {
        onErr(new Error(`Non-zero exit code: ${code}`));
      }
    });
    proc.on('error', (err) => {
      onErr(err);
    });
  }
}

/**
 * Walk a directory and return all the files found.
 */
export function walk(dir: string, done: (err: Error | null, paths?: string[]) => void) {
  var results = new Array<string>();

  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    var errored = false;
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach((file) => {
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (errored) return;
        if (err) {
          errored = true;
          return done(err);
        }

        if (stat && stat.isDirectory() && !stat.isSymbolicLink()) {
          walk(file, (err, res) => {
            if (errored) return;
            if (err) {
              errored = true;
              return done(err);
            }

            results = results.concat(res as string[]);
            if (!--pending) done(null, results);
          });
        } else {
          if (errored) return;
          results.push(file);
          if (!--pending) done(null, results);
        }
      });
    });
  });
};
