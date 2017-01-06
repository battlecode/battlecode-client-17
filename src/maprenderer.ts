import * as config from './config';

import {GameWorld, schema} from 'battlecode-playback';
import {AllImages} from './imageloader';
import Victor = require('victor');

export type SpawnedBody = {
  loc: Victor,
  radius: number
};

export type NeutralTree = {
  loc: Victor,
  radius: number;
  containedBullets?: number;
  containedBody?: schema.BodyType;
};

export enum Symmetry {
  ROTATIONAL,
  HORIZONTAL,
  VERTICAL
};

/**
 * Renders the world.
 *
 * Note that all rendering functions draw in world-units,
 */
export default class MapRenderer {
  private conf: config.Config;

  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
  readonly imgs: AllImages;

  // Callbacks for clicking robots and trees on the canvas
  readonly onclickRobot: (robots: Map<number, SpawnedBody>, index: number) => void;
  readonly onclickTree: (trees: Map<number, NeutralTree>, index: number) => void;

  // Other useful values
  readonly bgPattern: CanvasPattern;

  constructor(canvas: HTMLCanvasElement, imgs: AllImages, conf: config.Config,
    onclickRobot: (robots: Map<number, SpawnedBody>, index: number) => void,
    onclickTree: (trees: Map<number, NeutralTree>, index: number) => void) {
    this.canvas = canvas;
    this.conf = conf;
    this.imgs = imgs;
    this.onclickRobot = onclickRobot;
    this.onclickTree = onclickTree;

    let ctx = canvas.getContext("2d");
    if (ctx === null) {
      throw new Error("Couldn't load canvas2d context");
    } else {
      this.ctx = ctx;
    }

    this.ctx['imageSmoothingEnabled'] = false;
    this.bgPattern = this.ctx.createPattern(imgs.background, 'repeat');
  }

  /**
   * trees:
   * scale: scaling factor constant
   */
  render(width: number, height: number, bodies: Map<number, SpawnedBody>,
    trees: Map<number, NeutralTree>): void {
    const scale = this.canvas.width / width;

    // setup correct rendering
    this.ctx.save();
    this.ctx.scale(scale, scale);

    this.renderBackground(width, height);
    this.renderArchons(bodies);
    this.renderTrees(trees);

    // restore default rendering
    this.ctx.restore();
  }

  private renderBackground(width: number, height: number): void {
    this.ctx.save();
    this.ctx.fillStyle = this.bgPattern;

    const scale = 20;
    this.ctx.scale(1/scale, 1/scale);

    // scale the background pattern
    this.ctx.fillRect(0, 0, width * scale, height * scale);
    this.ctx.restore();
  }

  private renderArchons(bodies: Map<number, SpawnedBody>): void {
    const img = this.imgs.robot.archon[1];
    bodies.forEach((archon: SpawnedBody) => {
      const x = archon.loc.x;
      const y = archon.loc.y;
      const radius = 2; // Archon radius
      this.ctx.drawImage(img, x-radius, y-radius, radius*2, radius*2);
    });
  }

  private renderTrees(trees: Map<number, NeutralTree>) {
    const img = this.imgs.tree.fullHealth;
    trees.forEach((tree: NeutralTree) => {
      const x = tree.loc.x;
      const y = tree.loc.y;
      const radius = tree.radius;
      this.ctx.drawImage(img, x-radius, y-radius, radius*2, radius*2);
    });
  }

  private setEventListener() {
    this.canvas.onmousedown = (event: MouseEvent) => {
      // Do something
    };
  }
}

// Relevant unit types
const ARCHON = schema.BodyType.ARCHON;
const TREE = schema.BodyType.TREE_NEUTRAL;

