import {Config, Mode} from '../../config';
import {AllImages} from '../../imageloader';

import {GameWorld} from 'battlecode-playback';

export default class GameArea {

  // HTML elements
  private readonly images: AllImages;
  readonly div: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  private readonly wrapper: HTMLDivElement;
  private readonly mapEditorCanvas: HTMLCanvasElement;

  // Options
  private readonly conf: Config

  constructor(conf: Config, images: AllImages, mapEditorCanvas: HTMLCanvasElement) {
    this.div = document.createElement("div");
    this.div.id = "gamearea";
    this.conf = conf;
    this.images = images;
    this.mapEditorCanvas = mapEditorCanvas;

    // Create the canvas
    const wrapper: HTMLDivElement = document.createElement("div");
    wrapper.id = "canvas-wrapper";
    this.wrapper = wrapper;

    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.id = "battlecode-canvas";
    this.canvas = canvas;

    // Add elements to the main div
    this.div.appendChild(this.wrapper);
    this.wrapper.appendChild(canvas);
  }

  /**
   * Sets canvas size to maximum dimensions while maintaining the aspect ratio
   */
  setCanvasDimensions(world: GameWorld): void {
    const scale: number = 30; // arbitrary scaling factor

    this.canvas.width = world.minCorner.absDistanceX(world.maxCorner) * scale;
    this.canvas.height = world.minCorner.absDistanceY(world.maxCorner) * scale;

  }

  /**
   * Displays the correct canvas depending on whether we are in game mode
   * or map editor mode
   */
  setCanvas = () => {
    const mode = this.conf.mode;

    // The canvas can be anything in help mode
    if (mode === Mode.HELP) return;

    // Otherwise clear the canvas area...
    while (this.wrapper.firstChild) {
      this.wrapper.removeChild(this.wrapper.firstChild);
    }

    // ...and add the correct one
    if (mode === Mode.MAPEDITOR) {
      this.wrapper.appendChild(this.mapEditorCanvas);
    } else {
      this.wrapper.appendChild(this.canvas);
    }
  };
}