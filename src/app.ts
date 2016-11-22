import {schema, flatbuffers} from 'battlecode-schema';
import {Game} from 'battlecode-playback';
import * as config from './config';
import * as imageloader from './imageloader';

import Controls from './controls';
import Stats from './stats';

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
class Client {
  readonly conf: config.Config;
  readonly root: HTMLElement;
  readonly ctx: CanvasRenderingContext2D;

  imgs: imageloader.AllImages;

  controls: Controls = new Controls();
  stats: Stats = new Stats();

  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');

    this.root = root;
    this.conf = config.defaults(conf);

    let canvas: HTMLCanvasElement = document.createElement('canvas');
    let ctx = canvas.getContext("2d");

    if (ctx === null) {
        throw new Error("Couldn't load cavas2d context");
    } else {
        this.ctx = ctx;
    }

    this.loadCanvas(canvas, this.conf.width, this.conf.height);

    root.appendChild(canvas);
    root.appendChild(this.controls.div);
    root.appendChild(this.stats.div);

    imageloader.loadAll(conf, (images: imageloader.AllImages) => {
      this.imgs = images;
      this.processMatch();
    });
  }

  /**
   * Loads canvas to display game world.
   */
  loadCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    canvas.setAttribute("id", "battlecode-canvas");
    canvas.setAttribute("style", "border: 1px solid black");
    canvas.width = width;
    canvas.height = height;
  }

  /**
   * Plays the entire match.
   */
  processMatch() {
    // fill canvas with tiled background
    this.ctx.rect(0, 0, this.conf.width, this.conf.height);
    this.ctx.fillStyle = this.ctx.createPattern(this.imgs["background"], "repeat");
    this.ctx.fill();

    // FOR EACH ROUND

    this.loadNeutralTrees();
    this.loadRobots();
    this.loadBullets();
  }

  /**
   * Display neutral trees.
   */
  loadNeutralTrees() {
    let treeRadius = 15;
    let treeCenterX = 300;
    let treeCenterY = 250;

    this.ctx.drawImage(this.imgs["tree"]["fullHealth"], treeCenterX - treeRadius, treeCenterY - treeRadius);
  }

  /**
   * Display robots and player trees of one team.
   */
  loadRobots() {
    let robotRadius: number = 20;
    let robotCenterX: number = 50;
    let robotCenterY: number = 300;
    let robotHealthRatio: number = 0.7;

    this.ctx.drawImage(this.imgs["robot"]["archon"][0], robotCenterX - robotRadius, robotCenterY - robotRadius);
    this.ctx.fillStyle = "green";
    this.ctx.strokeStyle = "white";
    this.ctx.fillRect(robotCenterX - 10, robotCenterY + robotRadius, 20 * robotHealthRatio, 5);
    this.ctx.rect(robotCenterX - 10, robotCenterY + robotRadius, 20, 5);
    this.ctx.stroke();
  }

  /**
   * Display bullets.
   */
  loadBullets() {
    let bulletX: number = 200;
    let bulletY: number = 150;
    let bulletImageRadius: number = 5;

    this.ctx.drawImage(this.imgs["bullet"]["fast"], bulletX - bulletImageRadius, bulletY - bulletImageRadius);
  }

  /**
   * Display robot explosions, bullet explosions, etc.
   */
  loadAnimations() {

  }
}
