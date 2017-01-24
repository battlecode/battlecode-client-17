import {Game, GameWorld, Match, Metadata, schema, flatbuffers} from 'battlecode-playback';
import * as cst from './constants';
import * as config from './config';
import * as imageloader from './imageloader';

import Sidebar from './main/sidebar';
import Controls from './main/controls';

import {Stats, Console, MatchQueue, GameArea, Renderer, NextStep, TickCounter} from './game/index';
import {MapEditor} from './mapeditor/index';

import WebSocketListener from './websocket';
import ScaffoldCommunicator from './scaffold';

import {electron} from './electron-modules';

// webpack magic
// this loads the stylesheet and injects it into the dom
require('./static/css/style.css');

// open devtools on f12
document.addEventListener("keydown", function (e) {
  if (e.which === 123) {
    electron.remote.getCurrentWindow().webContents.openDevTools();
  }
});

/**
 * The entrypoint to the battlecode client.
 *
 * We "mount" the application at a particular HTMLElement - everything we create
 * on the page will live as a child of that element.
 *
 * We return a Client, which the web page can use to talk to the running client.
 * It can pause it, make it switch matches, etc.
 *
 * This architecture makes it easy to reuse the client on different web pages.
 */
window['battlecode'] = {
  mount: (root: HTMLElement, conf?: any): Client =>
    new Client(root, conf),
  schema: schema,
  flatbuffers: flatbuffers
};

/**
 * The interface a web page uses to talk to a client.
 */
export default class Client {
  private conf: config.Config;
  readonly root: HTMLElement;
  readonly ctx: CanvasRenderingContext2D;

  // HTML components
  imgs: imageloader.AllImages;

  controls: Controls; // Upper controls bar
  sidebar: Sidebar; // Sidebar
  stats: Stats;
  mapeditor: MapEditor;
  gamearea: GameArea; // Inner game area
  console: Console; // Console to display logs
  gamecanvas: HTMLCanvasElement;
  mapcanvas: HTMLCanvasElement;
  matchqueue: MatchQueue; // Match queue

  // Match logic
  listener: WebSocketListener | null;

  games: Game[];

  currentGame: number | null;
  currentMatch: number | null;

  // used to cancel the main loop
  loopID: number | null;

  // Allow us to run matches
  scaffold: ScaffoldCommunicator | null;

  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');

    this.root = root;
    this.root.id = "root";
    this.conf = config.defaults(conf);

    imageloader.loadAll(conf, (images: imageloader.AllImages) => {
      this.imgs = images;
      this.root.appendChild(this.loadControls());
      this.root.appendChild(this.loadSidebar());
      this.root.appendChild(this.loadGameArea());
      this.loadScaffold();
      this.ready();
    });

    this.games = [];

    if (this.conf.websocketURL !== null) {
      this.listener = new WebSocketListener(
        this.conf.websocketURL,
        this.conf.pollEvery
      );
    }
  }

  /**
   * Set the current game.
   */
  setGame(game: number) {
    if (game < 0 || game >= this.games.length) {
      throw new Error(`No game ${game} loaded, only have ${this.games.length} games`);
    }
    this.clearScreen();
    this.currentGame = game;
    this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
  }

  setMatch(match: number) {
    const matchCount = this.games[this.currentGame as number].matchCount;
    if (match < 0 || match >= matchCount) {
      throw new Error(`No match ${match} loaded, only have ${matchCount} matches in current game`);
    }
    this.clearScreen();
    this.currentMatch = match;

    // Restart game loop
    this.runMatch();
    this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch);
    this.games[this.currentGame ? this.currentGame: 0].getMatch(this.currentMatch).seek(0);
  }

  /**
   * Loads control bar and timeline
   */
  loadControls() {
    this.controls = new Controls(this.conf, this.imgs);
    return this.controls.div;
  }

  /**
   * Loads stats bar with team information
   */
  loadSidebar() {
    let onkeydownControls = (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case 80: // "p" - Pause/Unpause
        this.controls.pause();
        break;
        case 79: // "o" - Stop
        this.controls.restart();
        break;
      }
    };
    this.sidebar = new Sidebar(this.conf, this.imgs, onkeydownControls);
    this.stats = this.sidebar.stats;
    this.console = this.sidebar.console;
    this.mapeditor = this.sidebar.mapeditor;
    this.matchqueue = this.sidebar.matchqueue;
    return this.sidebar.div;
  }

  /**
   * Loads canvas to display game world.
   */
  loadGameArea() {
    this.gamearea = new GameArea(this.conf, this.imgs, this.mapeditor.canvas);
    this.sidebar.cb = () => {
      this.gamearea.setCanvas();
      this.controls.setControls();
    };

    return this.gamearea.div;
  }

  /**
   * Find a scaffold to run matches with.
   */
  loadScaffold() {
    console.log('ELECTRON: '+process.env.ELECTRON);
    if (process.env.ELECTRON) {
      const scaffoldPath = ScaffoldCommunicator.findDefaultScaffoldPath();

      if (scaffoldPath != null) {
        this.scaffold = new ScaffoldCommunicator(scaffoldPath);
        this.sidebar.addScaffold(this.scaffold);
      } else {
        console.log("Couldn't load scaffold: click \"Queue\" to learn more.");
      }
    }
  }

  /**
   * Marks the client as fully loaded.
   */
  ready() {
    this.gamearea.setCanvas();

    if (this.conf.matchFileURL) {
      // Load a match file
      console.log(`Loading provided match file: ${this.conf.matchFileURL}`);
      const req = new XMLHttpRequest();
      req.open('GET', this.conf.matchFileURL, true);
      req.responseType = 'arraybuffer';
      req.onerror = (event) => {
        console.log(`Can't load provided match file: ${event.error}`);
      };
      req.onload = (event) => {
        const resp = req.response;
        if (resp) {
          console.log('Loaded provided match file');
          var lastGame = this.games.length
          this.games[lastGame] = new Game();
          this.games[lastGame].loadFullGameRaw(resp);

          if (this.games.length === 1) {
            // this will run the first match from the game
            this.setGame(0);
            this.setMatch(0);
          }
          this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
        }
      };
      req.send();
    }
    this.controls.onGameLoaded = (data: ArrayBuffer) => {
      var lastGame = this.games.length
      this.games[lastGame] = new Game();
      this.games[lastGame].loadFullGameRaw(data);

      if (this.games.length === 1) {
        // this will run the first match from the game
        this.setGame(0);
        this.setMatch(0);
      }
      this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
    };

    if (this.listener != null) {
      this.listener.start(
        // What to do when we get a game from the websocket
        (game) => {
          this.games.push(game);
          this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
        },
        // What to do with the websocket's first game's first match
        () => {
          // switch to running match if we haven't loaded any others
          if (this.games.length === 1) {
            this.setGame(0);
            this.setMatch(0);
            this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
          }
        },
        // What to do with any other match
        () => {
          this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch: 0);
        }
      );
    }
  }

  clearScreen() {
    // TODO clear screen
    if (this.loopID !== null) {
      window.cancelAnimationFrame(this.loopID);
      this.loopID = null;
    }
  }

  /**
   * Updates the stats bar displaying VP, bullets, and robot counts for each
   * team in the current game world.
   */
  private updateStats(world: GameWorld, meta: Metadata) {
    for (let team in meta.teams) {
      let teamID = meta.teams[team].teamID;
      let teamStats = world.stats.get(teamID);

      // Update the bullets and victory points
      this.stats.setBullets(teamID, teamStats.bullets);
      this.stats.setVPs(teamID, teamStats.vps);

      // Update each robot count
      this.stats.robots.forEach((type: schema.BodyType) => {
        this.stats.setRobotCount(teamID, type, teamStats.robots[type]);
      });
    }
  }

  private runMatch() {
    console.log('Running match.');
    
    this.conf.mode = config.Mode.GAME;
    this.conf.splash = false;
    this.gamearea.setCanvas();

    // Cancel previous games if they're running
    this.clearScreen();

    // For convenience
    const game = this.games[this.currentGame as number] as Game;
    const meta = game.meta as Metadata;
    const match = game.getMatch(this.currentMatch as number) as Match;

    // Reset the canvas
    this.gamearea.setCanvasDimensions(match.current);

    // Reset the stats bar
    let teamNames = new Array();
    let teamIDs = new Array();
    for (let team in meta.teams) {
      teamNames.push(meta.teams[team].name);
      teamIDs.push(meta.teams[team].teamID);
    }
    this.stats.initializeGame(teamNames, teamIDs);
    this.console.setLogsRef(match.logs);

    // keep around to avoid reallocating
    const nextStep = new NextStep();

    // Last selected robot ID to display extra info
    const controls = this.controls;
    let lastSelectedID: number | undefined = undefined;
    const onRobotSelected = (id: number | undefined) => {
      lastSelectedID = id;
      this.console.setIDFilter(id);
    };
    const onMouseover = (x: number, y: number) => {
      this.controls.setLocation(x, y);
    };

    // Configure renderer for this match
    // (radii, etc. may change between matches)
    const renderer = new Renderer(this.gamearea.canvas, this.imgs,
      this.conf, meta as Metadata, onRobotSelected, onMouseover);

    // How fast the simulation should progress
    let goalUPS = this.controls.getUPS();

    // A variety of stuff to track how fast the simulation is going
    let rendersPerSecond = new TickCounter(.5, 100);
    let updatesPerSecond = new TickCounter(.5, 100);

    // The current time in the simulation, interpolated between frames
    let interpGameTime = 0;
    // The time of the last frame
    let lastTime: number | null = null;
    let lastTurn: number | null = null;
    // whether we're seeking
    let externalSeek = false;

    this.controls.onTogglePause = () => {
      goalUPS = goalUPS === 0 ? this.controls.getUPS() : 0;
    };
    this.controls.onToggleUPS = () => {
      goalUPS = this.controls.isPaused() ? 0 : this.controls.getUPS();
    };
    this.controls.onSeek = (turn: number) => {
      externalSeek = true;
      match.seek(turn);
      interpGameTime = turn;
    };
    this.controls.onStepForward = () => {
      if(!(goalUPS == 0)) {
        this.controls.pause();
      }
      if (match.current.turn < match['_farthest'].turn) {
        this.controls.onSeek(match.current.turn + 1);
      }
    };
    this.controls.onStepBackward = () => {
      if(!(goalUPS == 0)) {
        this.controls.pause();
      }
      if (match.current.turn > 0) {
        this.controls.onSeek(match.current.turn - 1);
      }
    };
    this.matchqueue.onNextMatch = () => {
      console.log("NEXT MATCH");

      if(this.currentGame < 0) {
        return; // Special case when deleting games
      }

      const matchCount = this.games[this.currentGame as number].matchCount;
      if(this.currentMatch < matchCount - 1) {
        this.setMatch(this.currentMatch + 1);
      } else {
        if(this.currentGame < this.games.length - 1) {
          this.setGame(this.currentGame + 1);
          this.setMatch(0);
        } else {
          // Do nothing, at the end
        }
      }
    };
    this.matchqueue.onPreviousMatch = () => {
      console.log("PREV MATCH");

      if(this.currentMatch > 0) {
        this.setMatch(this.currentMatch - 1);
      } else {
        if(this.currentGame > 0) {
          this.setGame(this.currentGame - 1);
          this.setMatch(this.games[this.currentGame as number].matchCount - 1);
        } else {
          // Do nothing, at the beginning
        }
      }

    };
    this.matchqueue.removeGame = (game: number) => {

      if (game > this.currentGame) {
        this.games.splice(game, 1);
      } else if (this.currentGame == game) {
        if (game == 0) {
          // if games.length > 1, remove game, set game to 0, set match to 0
          if (this.games.length > 1) {
            this.setGame(0);
            this.setMatch(0);
            this.games.splice(game, 1);
          } else {
            this.games.splice(game, 1);
            this.clearScreen();
            this.currentGame = -1;
            this.currentMatch = 0;
          }
        } else {
          this.setGame(game - 1);
          this.setMatch(0);
          this.games.splice(game, 1);
        }
      } else {
        // remove game, set game to game - 1
        this.games.splice(game, 1);
        this.currentGame = game - 1;
      }
      
      if(this.games.length == 0) {
        this.conf.splash = true;
        this.gamearea.setCanvas();
      }

      this.matchqueue.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch ? this.currentMatch : 0);
    };
    this.matchqueue.gotoMatch = (game: number, match: number) => {
      this.setGame(game);
      this.setMatch(match);
    };
    this.controls.canvas.onclick = function(event) {
      // jump to a frame when clicking the controls timeline
      let width: number = (<HTMLCanvasElement>this).width;
      let turn: number = event.offsetX / width * cst.MAX_ROUND_NUM;
      turn = Math.round(Math.min(match['_farthest'].turn, turn));
      externalSeek = true;
      match.seek(turn);
      interpGameTime = turn;
    };

    // set key options
    const conf = this.conf;
    document.onkeydown = function(event) {
      
      var input = document.activeElement.nodeName == "INPUT";
      if(!input) {
        switch (event.keyCode) {
          case 80: // "p" - Pause/Unpause
            controls.pause();
            break;
          case 79: // "o" - Stop
            controls.restart();
            break;
          case 37: // "LEFT" - Step Backward
            controls.stepBackward();
            break;
          case 39: // "RIGHT" - Step Forward
            controls.stepForward();
            break;
          case 72: // "h" - Toggle Health Bars
            conf.healthBars = !conf.healthBars;
            break;
          case 67: // "c" - Toggle Circle Bots
            conf.circleBots = !conf.circleBots;
            break;
          case 86: // "v" - Toggle Indicator Dots and Lines
            conf.indicators = !conf.indicators;
            break;
          case 66: // "b" - Toggle Interpolation
            conf.interpolate = !conf.interpolate;
            break;
          case 78: // "n" - Toggle sight radius
            conf.sightRadius = !conf.sightRadius;
            break;
          case 77: // "m" - Toggle bullet sight radius
            conf.bulletSightRadius = !conf.bulletSightRadius;
            break;
        }
      }
      
    };

    // The main update loop
    const loop = (curTime) => {
      let delta = 0;
      if (lastTime === null) {
        // first simulation step
        // do initial stuff?
      } else if (externalSeek) {
        if (match.current.turn === match.seekTo) {
          externalSeek = false;
        }
      } else if (goalUPS < 0 && match.current.turn === 0) {
        this.controls.pause();
      } else if (Math.abs(interpGameTime - match.current.turn) < 10) {
        // only update time if we're not seeking
        delta = goalUPS * (curTime - lastTime) / 1000;
        interpGameTime += delta;

        // tell the simulation to go to our time goal
        match.seek(interpGameTime | 0);
      }

      // update fps
      rendersPerSecond.update(curTime, 1);
      updatesPerSecond.update(curTime, delta);

      this.controls.setTime(match.current.turn,
                            match['_farthest'].turn,
                            updatesPerSecond.tps,
                            rendersPerSecond.tps);

      // run simulation
      // this may look innocuous, but it's a large chunk of the run time
      match.compute(5 /* ms */);

      // update the info string in controls
      if (lastSelectedID !== undefined) {
        let bodies = match.current.bodies.arrays;
        let index = bodies.id.indexOf(lastSelectedID)
        if (index === -1) {
          // The body doesn't exist anymore so indexOf returns -1
          lastSelectedID = undefined;
        } else {
          let id = bodies.id[index];
          let x = bodies.x[index];
          let y = bodies.y[index];
          let health = bodies.health[index];
          let maxHealth = bodies.maxHealth[index];
          let type = bodies.type[index];
          let bytecodes = bodies.bytecodesUsed[index];
          if (type === cst.TREE_NEUTRAL || type === cst.TREE_BULLET) {
            this.controls.setInfoString(id, x, y, health, maxHealth);
          } else {
            this.controls.setInfoString(id, x, y, health, maxHealth, bytecodes);
          }
        }
      }

      this.console.seekRound(match.current.turn);
      lastTime = curTime;
      lastTurn = match.current.turn;

      // only interpolate if:
      // - we want to
      // - we have another frame
      // - we're going slow enough for it to matter
      if (this.conf.interpolate &&
          match.current.turn + 1 < match.deltas.length &&
          goalUPS < rendersPerSecond.tps) {

        nextStep.loadNextStep(
          match.current,
          match.deltas[match.current.turn + 1]
        );

        let lerp = Math.min(interpGameTime - match.current.turn, 1);

        renderer.render(match.current,
                        match.current.minCorner, match.current.maxCorner,
                        nextStep, lerp);
      } else {
        // interpGameTime might be incorrect if we haven't computed fast enough
        renderer.render(match.current,
                        match.current.minCorner, match.current.maxCorner);
      }

      this.updateStats(match.current, meta);
      this.loopID = window.requestAnimationFrame(loop);

    };
    this.loopID = window.requestAnimationFrame(loop);
  }
}
