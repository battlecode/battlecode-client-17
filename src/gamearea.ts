import {Config} from './config';
import {AllImages} from './imageloader';

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

    // Positioning
    this.div.style.width = "100%";
    this.div.style.height = "100%";
    this.div.style.position = "fixed";
    this.div.style.top = "75px";
    this.div.style.left = "320px";

    // Style
    this.div.style.background = "#333"
    this.div.style.background = "-webkit-linear-gradient(#bbb, #333)"
    this.div.style.background = "-o-linear-gradient(#bbb, #333)"
    this.div.style.background = "-moz-linear-gradient(#bbb, #333)"
    this.div.style.background = "linear-gradient(#bbb, #333)"

    // Create the canvas
    const wrapper: HTMLDivElement = document.createElement("div");
    wrapper.id = "canvas-wrapper";
    wrapper.style.textAlign = "center";
    wrapper.style.paddingRight = "320px";
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

    // looks weird if the window is tall and skinny instead of short and fat
    this.canvas.style.height = "calc(100vh - 75px)";
  }

  /**
   * Displays the correct canvas depending on whether we are in game mode
   * or map editor mode
   */
  setCanvas = () => {
    // Clear the game area
    while (this.wrapper.firstChild) {
      this.wrapper.removeChild(this.wrapper.firstChild);
    }

    // Update with the correct canvas
    if (this.conf.inGameMode) {
      this.wrapper.appendChild(this.canvas);
    } else {
      this.wrapper.appendChild(this.mapEditorCanvas);
    }
  };
}