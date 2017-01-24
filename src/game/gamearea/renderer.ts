import * as config from '../../config';
import * as cst from '../../constants';
import NextStep from './../nextstep';

import {GameWorld, Metadata, schema} from 'battlecode-playback';
import {AllImages} from '../../imageloader';
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

  // For rendering robot information on click
  private lastSelectedID: number;

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

    this.renderBodies(world, nextStep, lerpAmount);
    this.renderBullets(world, lerpAmount);

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
    const ids = bodies.arrays.id;
    const xs = bodies.arrays.x;
    const ys = bodies.arrays.y;
    const healths = bodies.arrays.health;
    const maxHealths = bodies.arrays.maxHealth;
    const treeBullets = bodies.arrays.containedBullets;
    const treeBodies = bodies.arrays.containedBody;
    const radii = bodies.arrays.radius;
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y;

    let nextXs, nextYs, realXs, realYs;
    if (nextStep && lerpAmount) {
      // Interpolated
      nextXs = nextStep.bodies.arrays.x;
      nextYs = nextStep.bodies.arrays.y;
    }

    // Calculate the real xs and ys
    realXs = new Float32Array(length)
    realYs = new Float32Array(length)
    for (let i = 0; i < length; i++) {
      if (nextStep && lerpAmount) {
        // Interpolated
        realXs[i] = xs[i] + (nextXs[i] - xs[i]) * lerpAmount;
        realYs[i] = this.flip(ys[i] + (nextYs[i] - ys[i]) * lerpAmount, minY, maxY);
      } else {
        // Not interpolated
        realXs[i] = xs[i];
        realYs[i] = this.flip(ys[i], minY, maxY);
      }
    }

    // Render the trees
    for (let i = 0; i < length; i++) {
      const radius = radii[i];
      const team = teams[i];
      const type = types[i];
      const x = realXs[i];
      const y = realYs[i];

      if (type === cst.TREE_NEUTRAL) {
        const img = this.imgs.tree.fullHealth;
        this.drawCircleBot(x, y, radius);
        this.drawImage(img, x, y, radius);
        this.drawGoodies(x, y, radius, treeBullets[i], treeBodies[i]);
        this.drawHealthBar(x, y, radius, healths[i], maxHealths[i],
          world.minCorner, world.maxCorner);
      }

      if (type === cst.TREE_BULLET) {
        const img = this.imgs.robot.bulletTree[team];
        this.drawCircleBot(x, y, radius);
        this.drawImage(img, x, y, radius);
        this.drawHealthBar(x, y, radius, healths[i], maxHealths[i],
          world.minCorner, world.maxCorner);
      }
    }

    // Render the robots
    for (let i = 0; i < length; i++) {
      const radius = radii[i];
      const team = teams[i];
      const type = types[i];
      const x = realXs[i];
      const y = realYs[i];

      if (type !== cst.TREE_NEUTRAL && type !== cst.TREE_BULLET) {
        const img = this.imgs.robot[cst.bodyTypeToString(type)][team];
        this.drawCircleBot(x, y, radius);
        this.drawImage(img, x, y, radius);
        this.drawHealthBar(x, y, radius, healths[i], maxHealths[i],
          world.minCorner, world.maxCorner);
        
        // Draw the sight radius if the robot is selected
        if (this.lastSelectedID === undefined || ids[i] === this.lastSelectedID) {
          this.drawSightRadii(x, y, type);
        }
      }
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
   * Draws a circular outline representing the sight radius or bullet sight
   * radius of the given robot type, centered at (x, y)
   */
  private drawSightRadii(x: number, y: number, type: schema.BodyType) {
    if (type === cst.TREE_NEUTRAL || type === cst.TREE_BULLET) {
      return; // trees can't see...
    }

    if (this.conf.sightRadius) {
      const sightRadius = this.metadata.types[type].sightRadius;
      this.ctx.beginPath();
      this.ctx.arc(x, y, sightRadius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = "#46ff00";
      this.ctx.lineWidth = cst.SIGHT_RADIUS_LINE_WIDTH;
      this.ctx.stroke();
    }

    if (this.conf.bulletSightRadius) {
      const bulletSightRadius = this.metadata.types[type].bulletSightRadius;
      this.ctx.beginPath();
      this.ctx.arc(x, y, bulletSightRadius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = "#ff8e00";
      this.ctx.lineWidth = cst.SIGHT_RADIUS_LINE_WIDTH;
      this.ctx.stroke();
    }
  }

  /**
   * Draws goodies centered at (x, y) with the given radius, if there are any
   */
  private drawGoodies(x: number, y: number, radius: number, bullets: number, body: schema.BodyType) {
    if (bullets > 0) this.drawImage(this.imgs.tree.bullets, x, y, radius);
    if (body !== cst.NONE) this.drawImage(this.imgs.tree.robot, x, y, radius);
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

    this.canvas.onmousedown = (event: MouseEvent) => {
      let x = width * event.offsetX / this.canvas.offsetWidth + world.minCorner.x;
      let y = height * event.offsetY / this.canvas.offsetHeight + world.minCorner.y;

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
      this.lastSelectedID = selectedRobotID;
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

  private renderBullets(world: GameWorld, lerpAmount: number | undefined=0) {
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
    const dotsID = dots.arrays.id;
    const dotsX = dots.arrays.x;
    const dotsY = dots.arrays.y;
    const dotsRed = dots.arrays.red;
    const dotsGreen = dots.arrays.green;
    const dotsBlue = dots.arrays.blue;
    const minY = world.minCorner.y;
    const maxY = world.maxCorner.y;

    for (let i = 0; i < dots.length; i++) {
      if (this.lastSelectedID === undefined || dotsID[i] === this.lastSelectedID) {
        const red = dotsRed[i];
        const green = dotsGreen[i];
        const blue = dotsBlue[i];
        const x = dotsX[i];
        const y = this.flip(dotsY[i], minY, maxY);

        this.ctx.beginPath();
        this.ctx.arc(x, y, cst.INDICATOR_DOT_SIZE, 0, 2 * Math.PI, false);
        this.ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        this.ctx.fill();
      }
    }

    // Render the indicator lines
    const linesID = lines.arrays.id;
    const linesStartX = lines.arrays.startX;
    const linesStartY = lines.arrays.startY;
    const linesEndX = lines.arrays.endX;
    const linesEndY = lines.arrays.endY;
    const linesRed = lines.arrays.red;
    const linesGreen = lines.arrays.green;
    const linesBlue = lines.arrays.blue;
    this.ctx.lineWidth = cst.INDICATOR_LINE_WIDTH;

    for (let i = 0; i < lines.length; i++) {
      if (this.lastSelectedID === undefined || linesID[i] === this.lastSelectedID) {
        const red = linesRed[i];
        const green = linesGreen[i];
        const blue = linesBlue[i];
        const startX = linesStartX[i];
        const startY = this.flip(linesStartY[i], minY, maxY);
        const endX = linesEndX[i];
        const endY = this.flip(linesEndY[i], minY, maxY);

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
        this.ctx.stroke();
      }
    }
  }
}
