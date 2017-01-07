import * as config from './config';

import {GameWorld, schema} from 'battlecode-playback';
import {AllImages} from './imageloader';
import Victor = require('victor');

export type MapUnit = {
  loc: Victor,
  radius: number,
  type: schema.BodyType,
  containedBullets?: number,
  containedBody?: schema.BodyType
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
  readonly onclickUnit: (id: number) => void;
  readonly onclickBlank: (loc: Victor) => void;

  // Other useful values
  readonly bgPattern: CanvasPattern;
  private width: number; // in world units
  private height: number; // in world units

  constructor(canvas: HTMLCanvasElement, imgs: AllImages, conf: config.Config,
    onclickUnit: (id: number) => void, onclickBlank: (loc: Victor) => void) {
    this.canvas = canvas;
    this.conf = conf;
    this.imgs = imgs;
    this.onclickUnit = onclickUnit;
    this.onclickBlank = onclickBlank;

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
   * Renders a width x height (in world units) map with the given bodies
   * and symmetry.
   */
  render(width: number, height: number, bodies: Map<number, MapUnit>,
    symmetricBodies: Map<number, MapUnit>): void {
    const scale = this.canvas.width / width;
    this.width = width;
    this.height = height;

    // setup correct rendering
    this.ctx.save();
    this.ctx.scale(scale, scale);

    this.renderBackground();
    this.renderBodies(bodies);
    this.renderBodies(symmetricBodies);

    // restore default rendering
    this.setEventListener(width, height, bodies, symmetricBodies);
    this.ctx.restore();
  }

  /**
   * Draw the background
   */
  private renderBackground(): void {
    this.ctx.save();
    this.ctx.fillStyle = this.bgPattern;

    const scale = 20;
    this.ctx.scale(1/scale, 1/scale);

    // scale the background pattern
    this.ctx.fillRect(0, 0, this.width * scale, this.height * scale);
    this.ctx.restore();
  }

  /**
   * Draw trees and units on the canvas
   */
  private renderBodies(bodies: Map<number, MapUnit>) {
    // const img = this.imgs.tree.fullHealth;
    this.ctx.fillStyle = "#84bf4b";
    bodies.forEach((body: MapUnit) => {
      const radius = body.radius;
      if (body.type = schema.BodyType.TREE_NEUTRAL) {
        this.ctx.beginPath();
        this.ctx.arc(body.loc.x, body.loc.y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        // this.ctx.drawImage(img, x-radius, y-radius, radius*2, radius*2);

      }
    });
  }

  /**
   * Sets the map editor display to contain of the information of the selected
   * tree, or on the selected coordinate if there is no tree.
   */
  private setEventListener(width: number, height: number,
    bodies: Map<number, MapUnit>, symmetricBodies: Map<number, MapUnit>) {
    this.canvas.onmousedown = (event: MouseEvent) => {
      let x = width * event.offsetX / this.canvas.offsetWidth;
      let y = height * event.offsetY / this.canvas.offsetHeight;
      let loc = new Victor(x, y);

      // Get the ID of the selected unit
      let selectedID;
      bodies.forEach(function(body: MapUnit, id: number) {
        if (loc.distance(body.loc) <= body.radius) {
          selectedID = id;
        }
      });
      symmetricBodies.forEach(function(body: MapUnit, id: number) {
        if (loc.distance(body.loc) <= body.radius) {
          selectedID = id;
        }
      });

      if (selectedID) {
        this.onclickUnit(selectedID);
      } else {
        this.onclickBlank(loc);
      }
    };
  }
}

// Relevant unit types
const ARCHON = schema.BodyType.ARCHON;
const TREE = schema.BodyType.TREE_NEUTRAL;

