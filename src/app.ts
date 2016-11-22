import {schema, flatbuffers} from 'battlecode-schema';
import {Game} from 'battlecode-playback';
import * as config from './config';

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
  ctx;

  static imgs = {};
  static loadedImageCounter: number = 0;
  static expectedNumberImages: number = 21;

  controls: Controls = new Controls();
  stats: Stats = new Stats();

  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');
    
    this.root = root;
    this.conf = config.defaults(conf);

    let canvas = document.createElement('canvas');
    this.ctx = canvas.getContext("2d");
    this._loadImages();
    this.loadCanvas(canvas, this.conf.width, this.conf.height);

    root.appendChild(canvas)
    root.appendChild(this.controls.div);
    root.appendChild(this.stats.div);
  }

  /**
   * Loads static images.
   */
  img(url: string) {
    let image = new Image();
    image.onload = () => {
      Client.loadedImageCounter++;
      if (Client.loadedImageCounter == Client.expectedNumberImages) {
        console.log('All images loaded.');
        this.processMatch(this.ctx);
      }
    }
    image.src = require(url);
    return image;
  }

  _loadImages() {
    Client.imgs["background"] = this.img('./img/map/tiled_1.jpg');
    Client.imgs["tree"] = {
      "fullHealth": this.img('./img/map/full_health_tree.png'),
      "lowHealth": this.img('./img/map/low_health_tree.png'),
      "sapling": this.img('./img/map/sapling.png')
    };
    Client.imgs["bullet"] = {
      "fast": this.img('./img/bullets/fast_bullet.png'),
      "medium": this.img('./img/bullets/medium_bullet.png'),
      "slow": this.img('./img/bullets/slow_bullet.png')
    };
    Client.imgs["robot"] = {
      "archon": [this.img('./img/sprites/archon_white.png'), this.img('./img/sprites/archon_white.png')],
      "gardener": [this.img('./img/sprites/archon_white.png'), this.img('./img/sprites/archon_white.png')],
      "lumberjack": [this.img('./img/sprites/archon_white.png'), this.img('./img/sprites/archon_white.png')],
      "recruit": [this.img('./img/sprites/archon_white.png'), this.img('./img/sprites/archon_white.png')],
      "scout": [this.img('./img/sprites/archon_white.png'), this.img('./img/sprites/archon_white.png')],
      "soldier": [this.img('./img/sprites/archon_white.png'), this.img('./img/sprites/archon_white.png')],
      "tank": [this.img('./img/sprites/archon_white.png'), this.img('./img/sprites/archon_white.png')]
    }
  }

  /**
   * Loads canvas to display game world.
   */
  loadCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
    canvas.setAttribute("id", "canvas");
    canvas.setAttribute("style", "border: 1px solid black");
    canvas.width = width;
    canvas.height = height;
  }

  /**
   * Plays the entire match.
   */
  processMatch(ctx) {
    // fill canvas with tiled background
    ctx.rect(0, 0, this.conf.width, this.conf.height);
    ctx.fillStyle = ctx.createPattern(Client.imgs["background"], "repeat");
    ctx.fill();

    // FOR EACH ROUND

    this.loadNeutralTrees(ctx);
    this.loadRobots(ctx);
    this.loadBullets(ctx);
  }

  /**
   * Display neutral trees.
   */
  loadNeutralTrees(ctx) {
    let treeRadius = 15;
    let treeCenterX = 300;
    let treeCenterY = 250;

    ctx.drawImage(Client.imgs["tree"]["fullHealth"], treeCenterX - treeRadius, treeCenterY - treeRadius);
  }

  /**
   * Display robots and player trees of one team.
   */
  loadRobots(ctx) {
    let robotRadius: number = 20;
    let robotCenterX: number = 50;
    let robotCenterY: number = 300;
    let robotHealthRatio: number = 0.7;

    ctx.drawImage(Client.imgs["robot"]["archon"][0], robotCenterX - robotRadius, robotCenterY - robotRadius);
    ctx.fillStyle = "green";
    ctx.strokeStyle = "white";
    ctx.fillRect(robotCenterX - 10, robotCenterY + robotRadius, 20 * robotHealthRatio, 5);
    ctx.rect(robotCenterX - 10, robotCenterY + robotRadius, 20, 5);
    ctx.stroke();
  }

  /**
   * Display bullets.
   */
  loadBullets(ctx) {
    let bulletX: number = 200;
    let bulletY: number = 150;
    let bulletImageRadius: number = 5;

    ctx.drawImage(Client.imgs["bullet"]["fast"], bulletX - bulletImageRadius, bulletY - bulletImageRadius);
  }

  /**
   * Display robot explosions, bullet explosions, etc.
   */
  loadAnimations() {

  }
}
