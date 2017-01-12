import * as config from '../config';
import * as cst from '../constants';
import NextStep from './nextstep';

import {GameWorld, Metadata, schema} from 'battlecode-playback';
import {AllImages} from '../imageloader';
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

  // Callbacks
  readonly onRobotSelected: (id: number) => void;
  readonly onMouseover: (x: number, y: number) => void;

  // other cached useful values
  //readonly treeMedHealth: number;
  readonly bgPattern: CanvasPattern;

  constructor(canvas: HTMLCanvasElement, imgs: AllImages, conf: config.Config, metadata: Metadata,
    onRobotSelected: (id: number) => void,
    onMouseover: (x: number, y: number) => void) {
    this.canvas = canvas;
    this.conf = conf;
    this.imgs = imgs;
    this.metadata = metadata;
    this.onRobotSelected = onRobotSelected;
    this.onMouseover = onMouseover;

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
   * viewMax: max corner of view (in world units)
   */
  render(world: GameWorld, viewMin: Victor, viewMax: Victor, nextStep?: NextStep, lerpAmount?: number) {
    // setup correct rendering
    const viewWidth = viewMax.x - viewMin.x
    const viewHeight = viewMax.y - viewMin.y
    const scale = this.canvas.width / viewWidth;

    this.ctx.save();
    this.ctx.scale(scale, scale);
    this.ctx.translate(-viewMin.x, -viewMin.y);

    this.renderBackground(world);

    if (lerpAmount != null && nextStep != null) {
      this.renderBullets(world, lerpAmount);
      this.renderBodies(world, nextStep, lerpAmount);
    } else {
      this.renderBullets(world, 0);
      this.renderBodies(world);
    }

    this.renderIndicatorDotsLines(world);
    this.setMouseoverEvent(world);

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

  private renderBodies(world: GameWorld, nextStep?: NextStep, lerpAmount?: number) {
    const bodies = world.bodies;
    const length = bodies.length;
    const types = bodies.arrays.type;
    const teams = bodies.arrays.team;
    const xs = bodies.arrays.x;
    const ys = bodies.arrays.y;
    const healths = bodies.arrays.health;
    const maxHealths = bodies.arrays.maxHealth;
    const radii = bodies.arrays.radius;
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y;

    let nextXs, nextYs, realXs, realYs;
    if (nextStep && lerpAmount) {
      // Interpolated
      nextXs = nextStep.bodies.arrays.x;
      nextYs = nextStep.bodies.arrays.y;
    }
    realXs = new Float32Array(length)
    realYs = new Float32Array(length)

    for (let i = 0; i < length; i++) {
      let x, y;
      if (nextStep && lerpAmount) {
        // Interpolated
        // realXs[i] = xs[i] + (nextXs[i] - xs[i]) * lerpAmount;
        // realYs[i] = ys[i] + (nextYs[i] - ys[i]) * lerpAmount;
        // x = realXs[i];
        // y = this.flip(realYs[i], minY, maxY);
        x = xs[i] + (nextXs[i] - xs[i]) * lerpAmount;
        y = this.flip(ys[i] + (nextYs[i] - ys[i]) * lerpAmount, minY, maxY);
        realXs[i] = x;
        realYs[i] = y;
      } else {
        // Not interpolated
        x = xs[i];
        y = this.flip(ys[i], minY, maxY);
        realXs[i] = x;
        realYs[i] = y;
      }

      const radius = radii[i];
      const team = teams[i];

      let img;

      switch (types[i]) {
        case cst.TREE_NEUTRAL:
          img = this.imgs.tree.fullHealth;
          break;
        case cst.TREE_BULLET:
          img = this.imgs.robot.bulletTree[team];
          break;
        case cst.ARCHON:
          img = this.imgs.robot.archon[team];
          break;
        case cst.GARDENER:
          img = this.imgs.robot.gardener[team];
          break;
        case cst.LUMBERJACK:
          img = this.imgs.robot.lumberjack[team];
          break;
        case cst.SOLDIER:
          img = this.imgs.robot.soldier[team];
          break;
        case cst.TANK:
          img = this.imgs.robot.tank[team];
          break;
        case cst.SCOUT:
          img = this.imgs.robot.scout[team];
          break;
        default:
          img = this.imgs.unknown;
          break;
      }
      this.drawCircleBot(x, y, radius);
      this.drawImage(img, x, y, radius);
      this.drawHealthBar(x, y, radius, healths[i], maxHealths[i],
        world.minCorner, world.maxCorner);
    }

    this.setInfoStringEvent(world, realXs, realYs);
  }

  /**
   * Returns the mirrored y coordinate to be consistent with (0, 0) in the
   * bottom-left corner (top-left corner is canvas default).
   * params: y coordinate to flip
   *         yMin coordinate of the minimum edge
   *         yMax coordinate of the maximum edge
   */
  private flip(y: number, yMin: number, yMax: number) {
    return yMin + yMax - y;
  }

  /**
   * Draws a circle centered at (x, y) with the given radius
   */
  private drawCircleBot(x: number, y: number, radius: number) {
    if (!this.conf.circleBots) return; // skip if the option is turned off

    this.ctx.beginPath();
    this.ctx.fillStyle = "#ddd";
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    this.ctx.fill();
  }

  /**
   * Draws an image centered at (x, y) with the given radius
   */
  private drawImage(img: HTMLImageElement, x: number, y: number, radius: number) {
    this.ctx.drawImage(img, x-radius, y-radius, radius*2, radius*2);
  }

  /**
   * Draws a health bar for a unit centered at (xRobot, yRobot) with the given
   * radius, health, and maxHealth
   */
  private drawHealthBar(xRobot: number, yRobot: number, radius: number,
    health: number, maxHealth: number, minCorner: Victor, maxCorner: Victor) {
    if (!this.conf.healthBars) return; // skip if the option is turned off

    let x = xRobot - cst.HEALTH_BAR_WIDTH_HALF;
    let y = yRobot + radius;

    let minX = minCorner.x;
    let maxX = maxCorner.x - cst.HEALTH_BAR_WIDTH;
    let maxY = maxCorner.y - cst.HEALTH_BAR_HEIGHT;
    x = Math.max(minX, Math.min(x, maxX));
    y = Math.min(maxY, y);

    this.ctx.fillStyle = "green"; // current health
    this.ctx.fillRect(x, y, cst.HEALTH_BAR_WIDTH * health / maxHealth,
      cst.HEALTH_BAR_HEIGHT);
    this.ctx.strokeStyle = "black"; // outline
    this.ctx.lineWidth = .1;
    this.ctx.strokeRect(x, y, cst.HEALTH_BAR_WIDTH, cst.HEALTH_BAR_HEIGHT);
  }

  private setInfoStringEvent(world: GameWorld,
    xs: Float32Array, ys: Float32Array) {
    // world information
    const width = world.maxCorner.x - world.minCorner.x;
    const height = world.maxCorner.y - world.minCorner.y;
    const ids: Int32Array = world.bodies.arrays.id;
    const types: Int32Array = world.bodies.arrays.type;
    const radii: Float32Array = world.bodies.arrays.radius;
    const onRobotSelected = this.onRobotSelected;

    this.canvas.onmousedown = function(event) {
      let x = width * event.offsetX / this.offsetWidth + world.minCorner.x;
      let y = height * event.offsetY / this.offsetHeight + world.minCorner.y;

      // Get the ID of the selected robot
      let selectedRobotID;
      for (let i in ids) {
        let radius = radii[i];
        let type = types[i];
        let inXRange: boolean = xs[i] - radius <= x && x <= xs[i] + radius;
        let inYRange: boolean = ys[i] - radius <= y && y <= ys[i] + radius;
        if (inXRange && inYRange) {
          selectedRobotID = ids[i];
          break;
        }
      }

      // Set the info string even if the robot is undefined
      onRobotSelected(selectedRobotID);
    };
  }

  private setMouseoverEvent(world: GameWorld) {
    // world information
    const width = world.maxCorner.x - world.minCorner.x;
    const height = world.maxCorner.y - world.minCorner.y;
    const onMouseover = this.onMouseover;
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y;

    this.canvas.onmousemove = (event) => {
      const x = width * event.offsetX / this.canvas.offsetWidth + world.minCorner.x;
      const y = height * event.offsetY / this.canvas.offsetHeight + world.minCorner.y;

      // Set the location of the mouseover
      onMouseover(x, this.flip(y, minY, maxY));
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
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y;

    for (let i = 0; i < length; i++) {
      const velX = velXs[i];
      const velY = velYs[i];

      const dt = (world.turn + lerpAmount) - spawnedTimes[i];

      const x = xs[i] + velX*dt;
      const y = this.flip(ys[i] + velY*dt, minY, maxY);

      const speedsq = velX*velX + velY*velY;

      let img;
      if (speedsq >= cst.HIGH_SPEED_THRESH) {
        img = this.imgs.bullet.fast;
      } else if (speedsq >= cst.MED_SPEED_THRESH) {
        img = this.imgs.bullet.medium;
      } else {
        img = this.imgs.bullet.slow;
      }

      this.drawImage(img, x, y, cst.BULLET_SIZE_HALF);
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
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y;

    for (let i = 0; i < dots.length; i++) {
      const red = dotsRed[i];
      const green = dotsGreen[i];
      const blue = dotsBlue[i];
      const x = dotsX[i];
      const y = this.flip(dotsY[i], minY, maxY);

      this.ctx.beginPath();
      this.ctx.arc(x, y, cst.INDICATOR_DOT_SIZE, 0, 2 * Math.PI, false);
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
    this.ctx.lineWidth = cst.INDICATOR_LINE_WIDTH;

    for (let i = 0; i < lines.length; i++) {
      const red = linesRed[i];
      const green = linesGreen[i];
      const blue = linesBlue[i];
      const startX = linesStartX[i];
      const startY = this.flip(linesStartY[i], minY, maxY);
      const endX = linesEndX[i];
      const endY = this.flip(linesEndY[i], minY, maxY);

      this.ctx.beginPath();
      this.ctx.moveTo(linesStartX[i], linesStartY[i]);
      this.ctx.lineTo(linesEndX[i], linesEndY[i]);
      this.ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
      this.ctx.stroke();
    }
  }
}
