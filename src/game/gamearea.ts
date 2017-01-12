import {Config, Mode} from '../config';
import {AllImages} from '../imageloader';

import {GameWorld} from 'battlecode-playback';

import * as WebRequest from 'web-request';

export default class GameArea {

  // HTML elements
  private readonly images: AllImages;
  readonly div: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  readonly splashDiv: HTMLDivElement;
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
    
    this.splashDiv = document.createElement("div");
    this.splashDiv.id = "battlecode-splash";
    this.loadSplashDiv();

    // Add elements to the main div
    this.div.appendChild(this.wrapper);
    this.wrapper.appendChild(this.splashDiv);
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
   * Displays the splash screen
   */
  loadSplashDiv() {
    
    let splashTitle = document.createElement("h1");
    splashTitle.id = "splashTitle";
    splashTitle.appendChild(document.createTextNode("Battlecode Client"));
    this.splashDiv.appendChild(splashTitle);
    
    let splashSubtitle = document.createElement("h3");
    splashSubtitle.id = "splashSubtitle";
    splashSubtitle.appendChild(document.createTextNode("v" + this.conf.gameVersion));
    this.splashDiv.appendChild(splashSubtitle);
    
    // Set the version string from http://www.battlecode.org/contestants/latest/
    (async function (splashDiv, version) {
      
      var result = await WebRequest.get('http://www.battlecode.org/contestants/latest/');
      if(result.content.trim() != version.trim()) {
        let newVersion = document.createElement("a");
        newVersion.id = "splashNewVersion";
        newVersion.href = "http://www.battlecode.org/contestants/releases/"
        newVersion.innerHTML = "New version available (download with <code>gradle build</code>): v" + result.content;
        splashDiv.appendChild(newVersion);
      }
      
    })(this.splashDiv, this.conf.gameVersion);
      
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
    } else if (mode === Mode.SPLASH) {
      this.wrapper.appendChild(this.splashDiv);
    } else {
      this.wrapper.appendChild(this.canvas);
    }
  };
}