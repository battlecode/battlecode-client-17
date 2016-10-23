import * as play from 'battlecode-playback';
import * as config from './config';

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

  static imgs = {
    background: new Image(),
    fullHealthTree: new Image(),
    lowHealthTree: new Image(),
    sapling: new Image(),
    fastBullet: new Image(),
    mediumBullet: new Image(),
    slowBullet: new Image(),
    archonWhite: new Image(),
    tankWhite: new Image()
  };
  static loadedImageCounter: number = 0;

  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');
    
    this.root = root;
    this.conf = config.defaults(conf);

    let canvas = document.createElement('canvas');
    let controls = document.createElement('div');
    let stats = document.createElement('div');
    let ctx = canvas.getContext("2d");

    for (let img in Client.imgs) {
      Client.imgs[img].onload = () => {
        Client.loadedImageCounter++;
        if (Client.loadedImageCounter == Object.keys(Client.imgs).length) {
          console.log('All images loaded.');
          this.processMatch(ctx);
        }
      }
    }

    this.loadImages();
    this.loadCanvas(canvas, this.conf.width, this.conf.height);
    this.loadControls(controls)
    this.loadStats(stats)

    root.appendChild(canvas)
    root.appendChild(controls);
    root.appendChild(stats);    
  }

  /**
   * Loads static images.
   */
  loadImages() {
    Client.imgs.background.src = require('./img/map/tiled_1.jpg');
    Client.imgs.fullHealthTree.src = require('./img/map/full_health_tree.png');
    Client.imgs.lowHealthTree.src = require('./img/map/low_health_tree.png');
    Client.imgs.sapling.src = require('./img/map/sapling.png');
    Client.imgs.fastBullet.src = require('./img/bullets/fast_bullet.png');
    Client.imgs.mediumBullet.src = require('./img/bullets/medium_bullet.png');
    Client.imgs.slowBullet.src = require('./img/bullets/slow_bullet.png');
    Client.imgs.archonWhite.src = require('./img/sprites/archon_white.png');
    Client.imgs.tankWhite.src = require('./img/sprites/tank_white.png');
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
   * Loads game controls: pause/unpause, fast forward, rewind
   */
  loadControls(controls: HTMLDivElement) {
    let pause = document.createElement('button');
    pause.appendChild(document.createTextNode('Pause'));
    pause.setAttribute('type', 'button');
    pause.setAttribute('id', 'pause');
    pause.onclick = () => this.pause();

    let fileUpload = document.createElement('input');
    fileUpload.setAttribute('type', 'file');
    fileUpload.setAttribute('onchange', 'console.log("upload file")');
    controls.appendChild(pause);
    controls.appendChild(fileUpload);
  }

  /**
   * Loads game stats: team name, victory points, bullets, robot count
   */
  loadStats(stats: HTMLDivElement) {

  }

  /**
   * Display neutral trees.
   */
  loadNeutralTrees(ctx) {
    let treeRadius = 15;
    let treeCenterX = 300;
    let treeCenterY = 250;

    let fullHealthTree = new Image();
    fullHealthTree.src = require('./img/map/full_health_tree.png');
    // Client.fullHealthTree.onload = () => {
      // ctx.drawImage(Client.fullHealthTree, treeCenterX - treeRadius, treeCenterY - treeRadius);
    // }
  }

  /**
   * Plays the entire match.
   */
  processMatch(ctx) {
    // fill canvas with tiled background
    ctx.rect(0, 0, this.conf.width, this.conf.height);
    ctx.fillStyle = ctx.createPattern(Client.imgs.background, "repeat");
    ctx.fill();

    this.loadNeutralTrees(ctx);
    this.loadRobots(ctx);
    this.loadBullets(ctx);
  }

  /**
   * Display robots and player trees of one team.
   */
  loadRobots(ctx) {
    let robotRadius: number = 13;
    let robotCenterX: number = 50;
    let robotCenterY: number = 300;
    let robotHealthRatio: number = 0.7;

    let robot = new Image();
    robot.src = require('./img/sprites/gardener_white.png');
    robot.onload = function() {
      ctx.drawImage(robot, robotCenterX - robotRadius, robotCenterY - robotRadius);
      ctx.fillStyle = "green";
      ctx.strokeStyle = "black";
      ctx.fillRect(robotCenterX - 10, robotCenterY + robotRadius, 20 * robotHealthRatio, 5);
      ctx.rect(robotCenterX - 10, robotCenterY + robotRadius, 20, 5);
      ctx.stroke();
    }
  }

  /**
   * Display bullets.
   */
  loadBullets(ctx) {
    let bulletX: number = 200;
    let bulletY: number = 150;
    let bulletImageRadius: number = 5;

    let bullet = new Image();
    bullet.src = require('./img/bullets/fast_bullet.png');
    bullet.onload = function() {
      ctx.drawImage(bullet, bulletX - bulletImageRadius, bulletY - bulletImageRadius);
    }
  }

  /**
   * Display robot explosions, bullet explosions, etc.
   */
  loadAnimations() {

  }

  /**
   * Pause our simulation.
   */
  pause() {
    console.log('PAUSE');
  }

  /**
   * Unpause our simulation.
   */
  unpause() {
    console.log('UNPAUSE');
  }

  /**
   * Stop running the simulation, release all resources.
   */
  destroy() {
    console.log('DESTROY');
  }
}
