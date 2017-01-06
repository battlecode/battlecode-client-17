import {Game, GameWorld, Match, Metadata, schema, flatbuffers} from 'battlecode-playback';
import * as config from './config';
import * as imageloader from './imageloader';

import Controls from './controls';
import NextStep from './nextstep';
import Renderer from './renderer';
import Stats from './stats';
import TickCounter from './fps';
import WebSocketListener from './websocket';

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
  readonly conf: config.Config;
  readonly root: HTMLElement;
  readonly ctx: CanvasRenderingContext2D;

  imgs: imageloader.AllImages;

  controls: Controls;
  stats: Stats;

  style: HTMLStyleElement;
  canvasWrapper: HTMLDivElement;
  canvas: HTMLCanvasElement;

  listener: WebSocketListener | null;

  games: Game[];

  currentGame: number | null;
  currentMatch: number | null;

  // used to cancel the main loop
  loopID: number | null;

  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');

    this.root = root;
    this.root.id = "root";
    this.conf = config.defaults(conf);

    this.loadStyles();

    this.root.appendChild(this.loadGameArea());

    imageloader.loadAll(conf, (images: imageloader.AllImages) => {
      this.imgs = images;
      this.root.appendChild(this.loadControls());
      this.root.appendChild(this.loadStats());
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
   * Sets css of root element and load fonts
   */
  loadStyles() {
    // import fonts
    let fonts: HTMLLinkElement = document.createElement("link");
    fonts.setAttribute("href", "https://fonts.googleapis.com/css?family=Graduate");
    fonts.setAttribute("rel", "stylesheet");
    this.root.appendChild(fonts);

    // CSS stylesheet
    this.style = document.createElement("style");
    let css = "#root {\
      font-family: tahoma;\
      font-size: 14px;\
      width: 100%;\
      height: 100%;\
      margin: 0px;}\
      \
      input[type='file'] {display: none;}\
      \
      .custom-button {\
      background-color: #bbb;\
      border-color: #ddd;\
      display: inline-block;\
      vertical-align: middle;\
      cursor: pointer;\
      white-space: nowrap;\
      text-align: center;\
      line-height: 1.25;\
      padding: .4rem .8rem;\
      margin: .1rem;\
      border: 1px solid transparent;}\
      \
      button:hover {background-color: #bbb}\
      button:active, button:target {background-color: #999;}";
    this.style.appendChild(document.createTextNode(css));
    this.root.appendChild(this.style);
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
    this.stats.refreshGameList(this.games, this.currentGame ? this.currentGame: 0, this.currentMatch);
  }

  /**
   * Loads canvas to display game world.
   */
  loadGameArea() {
    let gameArea: HTMLDivElement = document.createElement("div");
    // Positioning
    gameArea.style.width = "100%";
    gameArea.style.height = "100%";
    gameArea.style.zIndex = "0.1";
    gameArea.style.position = "fixed";
    gameArea.style.top = "75px";
    gameArea.style.left = "320px";
    // Style
    gameArea.style.background = "#333"
    gameArea.style.background = "-webkit-linear-gradient(#bbb, #333)"
    gameArea.style.background = "-o-linear-gradient(#bbb, #333)"
    gameArea.style.background = "-moz-linear-gradient(#bbb, #333)"
    gameArea.style.background = "linear-gradient(#bbb, #333)"

    let canvasWrapper: HTMLDivElement = document.createElement("div");
    canvasWrapper.id = "canvas-wrapper";
    canvasWrapper.style.display = "block";
    canvasWrapper.style.textAlign = "center";
    canvasWrapper.style.paddingRight = "320px";
    canvasWrapper.style.height = "100%";
    this.canvasWrapper = canvasWrapper;

    let canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.id = "canvas";
    canvas.setAttribute("id", "battlecode-canvas");
    this.canvas = canvas;

    gameArea.appendChild(canvasWrapper);
    canvasWrapper.appendChild(canvas);
    return gameArea;
  }

  /**
   * Loads control bar and timeline
   */
  loadControls() {
    this.controls = new Controls(this.imgs);
    return this.controls.div;
  }

  /**
   * Loads stats bar with team information
   */
  loadStats() {
    this.stats = new Stats(this.imgs);
    return this.stats.div;
  }

  /**
   * Sets canvas size to maximum dimensions while maintaining the aspect ratio
   */
  setCanvasDimensions(world: GameWorld) {
    const scale: number = 30; // arbitrary scaling factor

    this.canvas.width = world.minCorner.absDistanceX(world.maxCorner) * scale;
    this.canvas.height = world.minCorner.absDistanceY(world.maxCorner) * scale;

    // looks weird if the window is tall and skinny instead of short and fat
    this.canvas.style.height = "calc(100vh - 75px)";
  }

  /**
   * Marks the client as fully loaded.
   */
  ready() {
    this.controls.onGameLoaded = (data: ArrayBuffer) => {
      const wrapper = schema.GameWrapper.getRootAsGameWrapper(
        new flatbuffers.ByteBuffer(new Uint8Array(data))
      );
      this.currentGame = this.games.length;
      this.games[this.currentGame] = new Game();
      this.games[this.currentGame].loadFullGame(wrapper);

      if (this.games.length === 1) {
        // this will run the first match from the game
        this.setGame(0);
        this.setMatch(0);
      }
    }
    if (this.listener != null) {
      this.listener.start(
        // What to do when we get a game from the websocket
        (game) => {
          this.games.push(game);
        },
        // What to do with the websocket's first game's first match
        () => {
          // switch to running match if we haven't loaded any others
          if (this.games.length === 1) {
            this.setGame(0);
            this.setMatch(0);
          }
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

  private runMatch() {
    console.log('Running match.');

    // Cancel previous games if they're running
    this.clearScreen();

    // For convenience
    const game = this.games[this.currentGame as number] as Game;
    const meta = game.meta as Metadata;
    const match = game.getMatch(this.currentMatch as number) as Match;

    // Reset the canvas
    this.setCanvasDimensions(match.current);

    // Reset the stats bar
    let teamNames = new Array();
    let teamIDs = new Array();
    for (let team in meta.teams) {
      teamNames.push(meta.teams[team].name);
      teamIDs.push(meta.teams[team].teamID);
    }
    this.stats.initializeGame(teamNames, teamIDs);

    // keep around to avoid reallocating
    const nextStep = new NextStep();

    // Configure renderer for this match
    // (radii, etc. may change between matches)
    const controls = this.controls;
    const onRobotSelected = function(id: number, strs: Array<string>): void {
      controls.setIndicatorID(id);
      controls.setIndicatorString(0, `${strs[0]}`);
      controls.setIndicatorString(1, `${strs[1]}`);
      controls.setIndicatorString(2, `${strs[2]}`);
    }
    const renderer = new Renderer(this.canvas, this.imgs, this.conf, meta as Metadata, onRobotSelected);

    // How fast the simulation should progress
    let goalUPS = 10;

    // Keep track of rewinding for <= 0 turn case
    let rewinding = false;

    // A variety of stuff to track how fast the simulation is going
    let rendersPerSecond = new TickCounter(.5, 100);
    let updatesPerSecond = new TickCounter(.5, 100);

    // The current time in the simulation, interpolated between frames
    let interpGameTime = 0;
    // The time of the last frame
    let lastTime: number | null = null;
    // whether we're seeking
    let externalSeek = false;

    this.controls.onTogglePause = () => {
      goalUPS = goalUPS === 0? 10 : 0;
      rewinding = false;
    };
    this.controls.onToggleForward = () => {
      goalUPS = goalUPS === 300 ? 10 : 300;
      rewinding = false;
    };
    this.controls.onToggleRewind = () => {
      goalUPS = goalUPS === -100 ? 10 : -100;
      rewinding = !rewinding;
    }
    this.controls.onSeek = (turn: number) => {
      externalSeek = true;
      match.seek(turn);
      interpGameTime = turn;
    };
    this.controls.canvas.addEventListener("mousedown", function(event) {
      // jump to a frame when clicking the controls timeline
      let width = event.offsetX;
      let maxWidth = (<HTMLCanvasElement>this).width;
      let turn = Math.floor(match['_farthest'].turn * width / maxWidth);
      externalSeek = true;
      match.seek(turn);
      interpGameTime = turn;
    }, false);

    // set key options
    document.onkeydown = function(event) {
      switch (event.keyCode) {
        case 80: // "p" - Pause/Unpause
          controls.pause();
          break;
        case 79: // "o" - Stop
          controls.restart();
          break;
        case 37: // "LEFT" - Skip/Seek Backward
          controls.rewind();
          break;
        case 39: // "RIGHT" - Skip/Seek Forward
          controls.forward();
          break;
        case 72: // "h" - Toggle Health Bars
          renderer.toggleHealthBars();
          break;
        case 67: // "c" - Toggle Circle Bots
          renderer.toggleCircleBots();
          break;
        case 86: // "v" - Toggle Indicator Dots and Lines
          renderer.toggleIndicatorStrings();
          break;
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
      } else if (rewinding && match.current.turn <= 10) {
        this.controls.rewind();
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

      lastTime = curTime;

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
                        match.current.minCorner, match.current.maxCorner.x - match.current.minCorner.x,
                        nextStep, lerp);
        
        // UPDATE STATS HERE
        for (let team in meta.teams) {
          var teamID = meta.teams[team].teamID;
          var teamStats = match.current.stats.get(teamID);
          this.stats.setBullets(teamID, teamStats.bullets);
          this.stats.setVPs(teamID, teamStats.vps);
          
          // Update each robot count
          for(var i = 0; i < 7; i++) { 
              this.stats.setRobotCount(teamID, i, teamStats.robots[i]);
          }
        }
        
      } else {
        // interpGameTime might be incorrect if we haven't computed fast enough
        renderer.render(match.current,
                        match.current.minCorner, match.current.maxCorner.x - match.current.minCorner.x);

      }

      this.loopID = window.requestAnimationFrame(loop);
      
    };
    this.loopID = window.requestAnimationFrame(loop);
  }
}
