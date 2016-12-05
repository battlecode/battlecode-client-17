import {schema, flatbuffers} from 'battlecode-schema';
import {Game, Match, Metadata} from 'battlecode-playback';
import * as config from './config';
import * as imageloader from './imageloader';

import Controls from './controls';
import Stats from './stats';
import Renderer from './renderer';

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
};

/**
 * The interface a web page uses to talk to a client.
 */
export default class Client {
  readonly conf: config.Config;
  readonly root: HTMLElement;
  readonly ctx: CanvasRenderingContext2D;

  imgs: imageloader.AllImages;

  controls: Controls = new Controls();
  stats: Stats = new Stats();

  canvas: HTMLCanvasElement;

  currentGame: Game | null;

  // used to cancel the main loop
  loopID: number | null;

  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');

    this.root = root;
    this.conf = config.defaults(conf);

    this.canvas = document.createElement('canvas');

    this.loadCanvas();

    root.appendChild(this.canvas);
    root.appendChild(this.controls.div);
    //root.appendChild(this.stats.div);

    imageloader.loadAll(conf, (images: imageloader.AllImages) => {
      this.imgs = images;
      this.ready();
    });
  }

  /**
   * Loads canvas to display game world.
   */
  loadCanvas() {
    this.canvas.setAttribute("id", "battlecode-canvas");
    this.canvas.setAttribute("style", "border: 1px solid black");
    this.canvas.setAttribute("width", `${this.conf.width}`);
    this.canvas.setAttribute("height", `${this.conf.height}`);
  }

  /**
   * Marks the client as fully loaded.
   */
  ready() {
    this.controls.onGameLoaded = (data: ArrayBuffer) => {
      const wrapper = schema.GameWrapper.getRootAsGameWrapper(
        new flatbuffers.ByteBuffer(new Uint8Array(data))
      );
      this.currentGame = new Game();
      this.currentGame.loadFullGame(wrapper);

      this.runMatch();
    }
  }

  private runMatch() {
    // TODO(jhgilles): this is a mess
    
    console.log('Running match.');

    // Cancel previous games if they're running
    if (this.loopID !== null) {
      window.cancelAnimationFrame(this.loopID);
      this.loopID = null;
    }
    
    // For convenience
    const game = this.currentGame as Game;
    const meta = game.meta as Metadata;
    const match = game.getMatch(0) as Match;

    // Configure renderer for this match
    // (radii, etc. may change between matches)
    const renderer = new Renderer(this.canvas, this.imgs, this.conf, game.meta as Metadata);

    // How fast the simulation should progress
    let goalUPS = 10;

    // A variety of stuff to track how fast the simulation is going
    // running updates-per-second average
    let ups = 0;
    // running renders-per-second average
    let rps = 0;
    // renders since last fps update
    let rendersThisSecond = 0;
    let updatesThisSecond = 0;
    // the timestamp of the last fps update
    let lastFPSUpdate = 0;

    // The current time in the simulation, interpolated between frames
    let interpGameTime = 0;
    // The time of the last frame
    let lastTime: number | null = null;
    // whether we're seeking
    let externalSeek = false;

    this.controls.onTogglePause = () => {
      goalUPS = goalUPS === 0? 10 : 0;
    };
    this.controls.onToggleForward = () => {
      goalUPS = goalUPS === 10 ? 300 : 10;
    };
    this.controls.onSeek = (turn: number) => {
      externalSeek = true;
      match.seek(turn);
      interpGameTime = turn;
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
      } else if (Math.abs(interpGameTime - match.current.turn) < 10) {
        // only update time if we're not seeking
        delta = goalUPS * (curTime - lastTime) / 1000;
        interpGameTime += delta;

        // tell the simulation to go to our time goal
        match.seek(interpGameTime | 0);
      }

      // update rps
      if (curTime > lastFPSUpdate + 1000) {
        // Exponential moving average
        ups = 0.75 * updatesThisSecond + (1 - 0.75) * ups;
        rps = 0.75 * rendersThisSecond + (1 - 0.75) * rps;
        lastFPSUpdate = curTime;
        updatesThisSecond = 0;
        rendersThisSecond = 0;
      }
      updatesThisSecond += delta;
      rendersThisSecond += 1;
      this.controls.setTime(match.current.turn,
                            match['_farthest'].turn,
                            ups,
                            rps);

      // run simulation
      // this may look innocuous, but it's a large chunk of the run time
      match.compute(5 /* ms */);

      lastTime = curTime;

      // interpGameTime might be incorrect if we haven't computed fast enough
      renderer.render(match.current, interpGameTime, match.current.minCorner, match.current.maxCorner.x - match.current.minCorner.x);

      this.loopID = window.requestAnimationFrame(loop);
    };
    this.loopID = window.requestAnimationFrame(loop);
  }
}
