import * as config from './config';
import NextStep from './nextstep';

import {GameWorld, Metadata, schema} from 'battlecode-playback';
import {AllImages} from './imageloader';
import Victor = require('victor');

/**
 * Renders the world.
 *
 * Note that all rendering functions draw in world-units,
 */
export default class Renderer {
  private conf: config.Config;

  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly imgs: AllImages;
  readonly metadata: Metadata;

  // callback for indicator strings
  readonly onRobotSelected: (id: number, strs: Array<string>) => void;

  // other cached useful values
  //readonly treeMedHealth: number;
  readonly bgPattern: CanvasPattern;

  constructor(canvas: HTMLCanvasElement, imgs: AllImages, conf: config.Config,
    metadata: Metadata, onRobotSelected: (id: number, strs: Array<string>) => void) {
    this.canvas = canvas;
    this.conf = conf;
    this.imgs = imgs;
    this.metadata = metadata;
    this.onRobotSelected = onRobotSelected;

    let ctx = canvas.getContext("2d");
    if (ctx === null) {
        throw new Error("Couldn't load canvas2d context");
    } else {
        this.ctx = ctx;
    }

    this.ctx['imageSmoothingEnabled'] = false;

    this.bgPattern = this.ctx.createPattern(imgs.background, 'repeat');
    //this.treeMedHealth = metadata.types[schema.BodyType.TREE_NEUTRAL].maxHealth / 2;
  }

  /**
   * world: world to render
   * time: time in turns
   * viewMin: min corner of view (in world units)
   * viewSize: width / height of view (in world units)
   */
  render(world: GameWorld, viewMin: Victor, viewWidth: number, nextStep?: NextStep, lerpAmount?: number) {
    // setup correct rendering
    const scale = this.canvas.width / viewWidth;

    this.ctx.save();
    this.ctx.scale(scale, scale);
    this.ctx.translate(-viewMin.x, -viewMin.y);

    this.renderBackground(world);

    if (lerpAmount != null && nextStep != null) {
      this.renderBullets(world, lerpAmount);
      this.renderBodiesInterpolated(world, nextStep, lerpAmount);
    } else {
      this.renderBullets(world, 0);
      this.renderBodies(world);
    }

    this.renderIndicatorDotsLines(world);

    // restore default rendering
    this.ctx.restore();
  }

  /**
   * Release resources.
   */
  release() {
    // nothing to do yet?
  }

  private renderBackground(world: GameWorld) {
    this.ctx.save();
    this.ctx.fillStyle = this.bgPattern;

    const minX = world.minCorner.x;
    const minY = world.minCorner.y;
    const width = world.maxCorner.x - world.minCorner.x;
    const height = world.maxCorner.y - world.minCorner.y;

    const scale = 20;

    this.ctx.scale(1/scale, 1/scale);

    // scale the background pattern
    this.ctx.fillRect(minX*scale, minY*scale, width*scale, height*scale);
    this.ctx.restore();
  }

  private renderBodies(world: GameWorld) {
    const bodies = world.bodies;
    const length = bodies.length;
    const types = bodies.arrays.type;
    const teams = bodies.arrays.team;
    const xs = bodies.arrays.x;
    const ys = bodies.arrays.y;
    const healths = bodies.arrays.health;
    const radii = bodies.arrays.radius;

    for (let i = 0; i < length; i++) {
      const x = xs[i];
      const y = ys[i];
      const radius = radii[i];

      const team = teams[i];

      let img;

      switch (types[i]) {
        case TREE_NEUTRAL:
          //if (healths[i] > this.treeMedHealth) {
            img = this.imgs.tree.fullHealth;
          //} else {
          //  img = this.imgs.tree.lowHealth;
          //}
          break;
        case TREE_BULLET:
          img = this.imgs.robot.bulletTree[team];
          break;
        case ARCHON:
          img = this.imgs.robot.archon[team];
          break;
        case GARDENER:
          img = this.imgs.robot.gardener[team];
          break;
        case LUMBERJACK:
          img = this.imgs.robot.lumberjack[team];
          break;
        case RECRUIT:
          img = this.imgs.robot.recruit[team];
          break;
        case SOLDIER:
          img = this.imgs.robot.soldier[team];
          break;
        case TANK:
          img = this.imgs.robot.tank[team];
          break;
        case SCOUT:
          img = this.imgs.robot.scout[team];
          break;
        default:
          img = this.imgs.unknown;
          break;
      }
      if (this.conf.circleBots) {
        this.ctx.beginPath();
        this.ctx.fillStyle = "#ddd";
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
        this.ctx.fill();
      }
      this.ctx.drawImage(img, x-radius, y-radius, radius*2, radius*2);
      this.drawHealthBar(x-HEALTH_BAR_WIDTH_HALF, y+radius, healths[i], types[i]);
    }

    this.setIndicatorStringEventListener(world, xs, ys);
  }

  private renderBodiesInterpolated(world: GameWorld,
                                   nextStep: NextStep,
                                   lerpAmount: number) {
    const bodies = world.bodies;
    const length = bodies.length;
    const types = bodies.arrays.type;
    const teams = bodies.arrays.team;
    const xs = bodies.arrays.x;
    const ys = bodies.arrays.y;
    const nextXs = nextStep.bodies.arrays.x;
    const nextYs = nextStep.bodies.arrays.y;
    const healths = bodies.arrays.health;
    const radii = bodies.arrays.radius;
    let realXs: Float32Array = new Float32Array(length);
    let realYs: Float32Array = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      const x = xs[i];
      const y = ys[i];
      const nextX = nextXs[i];
      const nextY = nextYs[i];

      const realX = x + (nextX - x) * lerpAmount;
      const realY = y + (nextY - y) * lerpAmount;
      realXs[i] = realX;
      realYs[i] = realY;

      const radius = radii[i];

      const team = teams[i];

      let img;

      switch (types[i]) {
        case TREE_NEUTRAL:
          //if (healths[i] > this.treeMedHealth) {
            img = this.imgs.tree.fullHealth;
          //} else {
          //  img = this.imgs.tree.lowHealth;
          //}
          break;
        case TREE_BULLET:
          img = this.imgs.robot.bulletTree[team];
          break;
        case ARCHON:
          img = this.imgs.robot.archon[team];
          break;
        case GARDENER:
          img = this.imgs.robot.gardener[team];
          break;
        case LUMBERJACK:
          img = this.imgs.robot.lumberjack[team];
          break;
        case RECRUIT:
          img = this.imgs.robot.recruit[team];
          break;
        case SOLDIER:
          img = this.imgs.robot.soldier[team];
          break;
        case TANK:
          img = this.imgs.robot.tank[team];
          break;
        case SCOUT:
          img = this.imgs.robot.scout[team];
          break;
        default:
          img = this.imgs.unknown;
          break;
      }
      if (this.conf.circleBots) {
        this.ctx.beginPath();
        this.ctx.fillStyle = "#ddd";
        this.ctx.arc(realX, realY, radius, 0, 2 * Math.PI, false);
        this.ctx.fill();
      }
      this.ctx.drawImage(img, realX-radius, realY-radius, radius*2, radius*2);
      this.drawHealthBar(realX-HEALTH_BAR_WIDTH_HALF, realY+radius, healths[i], types[i]);
    }

    this.setIndicatorStringEventListener(world, realXs, realYs);
  }

  private drawHealthBar(x: number, y: number, health: number, type: number) {
    if (!this.conf.healthBars) return; // skip if the option is turned off

    const bodyType = this.metadata.types[type];
    if (bodyType == undefined) return;

    this.ctx.fillStyle = "green"; // current health
    this.ctx.fillRect(x, y, HEALTH_BAR_WIDTH * health / bodyType.maxHealth,
      HEALTH_BAR_HEIGHT);
    this.ctx.strokeStyle = "black"; // outline
    this.ctx.lineWidth = .1;
    this.ctx.strokeRect(x, y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT);
  }

  private setIndicatorStringEventListener(world: GameWorld,
    xs: Float32Array, ys: Float32Array) {
    // indicator strings
    const width = world.maxCorner.x - world.minCorner.x;
    const height = world.maxCorner.y - world.minCorner.y;
    const ids: Int32Array = world.bodies.arrays.id;
    const types: Int32Array = world.bodies.arrays.type;
    const radii: Float32Array = world.bodies.arrays.radius;
    const strings: Map<number, Array<string>> = world.indicatorStrings;
    const onRobotSelected = this.onRobotSelected;

    this.canvas.onmousedown = function(event) {
      const x = width * event.offsetX / this.offsetWidth;
      const y = height * event.offsetY / this.offsetHeight;

      // Get the ID of the selected robot
      let selectedRobotID;
      for (let i in ids) {
        let radius = radii[i];
        let type = types[i];
        let inXRange: boolean = xs[i] - radius <= x && x <= xs[i] + radius;
        let inYRange: boolean = ys[i] - radius <= y && y <= ys[i] + radius;

        if (type != TREE_NEUTRAL && inXRange && inYRange) {
          selectedRobotID = ids[i];
          break;
        }
      }

      // A robot was not selected, return
      if (selectedRobotID == undefined) {
        return;
      }

      // Get the indicator strings of the robot with that ID
      let robotStrings = strings.get(selectedRobotID);

      // Set the indicator strings
      onRobotSelected(selectedRobotID, robotStrings);
    };
  }

  private renderBullets(world: GameWorld, lerpAmount: number) {
    const bullets = world.bullets;
    const length = bullets.length;
    const xs = bullets.arrays.x;
    const ys = bullets.arrays.y;
    const velXs = bullets.arrays.velX;
    const velYs = bullets.arrays.velY;
    const spawnedTimes = bullets.arrays.spawnedTime;

    for (let i = 0; i < length; i++) {
      const velX = velXs[i];
      const velY = velYs[i];

      const dt = (world.turn + lerpAmount) - spawnedTimes[i];

      const x = xs[i] + velX*dt;
      const y = ys[i] + velY*dt;

      const speedsq = velX*velX + velY*velY;

      let img;
      if (speedsq >= HIGH_SPEED_THRESH) {
        img = this.imgs.bullet.fast;
      } else if (speedsq >= MED_SPEED_THRESH) {
        img = this.imgs.bullet.medium;
      } else {
        img = this.imgs.bullet.slow;
      }

      this.ctx.drawImage(img,
                         x - BULLET_SIZE_HALF, y - BULLET_SIZE_HALF,
                         BULLET_SIZE, BULLET_SIZE);
    }
  }

  private renderIndicatorDotsLines(world: GameWorld) {
    if (!this.conf.indicators) {
      return;
    }

    const dots = world.indicatorDots;
    const lines = world.indicatorLines;

    // Render the indicator dots
    const dotsX = dots.arrays.x;
    const dotsY = dots.arrays.y;
    const dotsRed = dots.arrays.red;
    const dotsGreen = dots.arrays.green;
    const dotsBlue = dots.arrays.blue;

    for (let i = 0; i < dots.length; i++) {
      const red = dotsRed[i];
      const green = dotsGreen[i];
      const blue = dotsBlue[i];

      this.ctx.beginPath();
      this.ctx.arc(dotsX[i], dotsY[i], INDICATOR_DOT_SIZE, 0, 2 * Math.PI, false);
      this.ctx.fill();
      this.ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
    }

    // Render the indicator lines
    const linesStartX = lines.arrays.startX;
    const linesStartY = lines.arrays.startY;
    const linesEndX = lines.arrays.endX;
    const linesEndY = lines.arrays.endY;
    const linesRed = lines.arrays.red;
    const linesGreen = lines.arrays.green;
    const linesBlue = lines.arrays.blue;
    this.ctx.lineWidth = INDICATOR_LINE_WIDTH;

    for (let i = 0; i < lines.length; i++) {
      const red = linesRed[i];
      const green = linesGreen[i];
      const blue = linesBlue[i];

      this.ctx.beginPath();
      this.ctx.moveTo(linesStartX[i], linesStartY[i]);
      this.ctx.lineTo(linesEndX[i], linesEndY[i]);
      this.ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
      this.ctx.stroke();
    }
  }
}

// Constants
const BULLET_SIZE= .5;
const BULLET_SIZE_HALF = BULLET_SIZE / 2;
const INDICATOR_DOT_SIZE = .5;
const INDICATOR_LINE_WIDTH = .4;
const HEALTH_BAR_HEIGHT = .3;
const HEALTH_BAR_WIDTH = 2;
const HEALTH_BAR_WIDTH_HALF = HEALTH_BAR_WIDTH / 2;

// we check if speed^2 is >= these
const HIGH_SPEED_THRESH = (2*2) - .00001;
const MED_SPEED_THRESH = (1.5*1.5) - .00001;

// might speed things up
const ARCHON = schema.BodyType.ARCHON;
const GARDENER = schema.BodyType.GARDENER;
const LUMBERJACK = schema.BodyType.LUMBERJACK;
const RECRUIT = schema.BodyType.RECRUIT;
const SOLDIER = schema.BodyType.SOLDIER;
const TANK = schema.BodyType.TANK;
const SCOUT = schema.BodyType.SCOUT;
const TREE_BULLET = schema.BodyType.TREE_BULLET;
const TREE_NEUTRAL = schema.BodyType.TREE_NEUTRAL;

