import {Config, Mode} from '../../config';
import {AllImages} from '../../imageloader';
import Client from '../../app';

import {GameWorld} from 'battlecode-playback';

import * as http from 'http';

export default class GameArea {

  // HTML elements
  private readonly images: AllImages;
  readonly div: HTMLDivElement;
  readonly canvas: HTMLCanvasElement;
  readonly splashDiv: HTMLDivElement;
  private readonly wrapper: HTMLDivElement;
  private readonly mapEditorCanvas: HTMLCanvasElement;
  private currentMode : Mode;
  readonly client : Client;

  // Options
  private readonly conf: Config

  constructor(conf: Config, images: AllImages, mapEditorCanvas: HTMLCanvasElement, client: Client) {
    this.div = document.createElement("div");
    this.div.id = "gamearea";
    this.conf = conf;
    this.images = images;
    this.mapEditorCanvas = mapEditorCanvas;
	this.client = client;

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
    this.currentMode = Mode.SPLASH;

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
		
      var options = {
        host: 'battlecode-maven.s3-website-us-east-1.amazonaws.com',
        path: '/org/battlecode/battlecode/maven-metadata.xml'
      };

      var req = http.get(options, function(res) {
        let data = "";
        res.on('data', function(chunk) {
          data += chunk
        }).on('end', function() {
          
          var parser = new DOMParser();
          var doc = parser.parseFromString(data, "application/xml");
          var latest = doc.getElementsByTagName('release')[0].innerHTML;

          if(latest.trim() != version.trim()) {
            let newVersion = document.createElement("a");
            newVersion.id = "splashNewVersion";
            newVersion.href = "http://www.battlecode.org/contestants/releases/"
            newVersion.target = "_blank";
            newVersion.innerHTML = "New version available (download with <code>gradle build</code>): v" + latest;
            splashDiv.appendChild(newVersion);
          }
          
        })
      });
      
    })(this.splashDiv, this.conf.gameVersion);
      
  }

  /**
   * Displays the correct canvas depending on whether we are in game mode
   * or map editor mode
   */
  setCanvas = () => {
    var mode = this.conf.mode;

    // The canvas can be anything in help mode
    if (mode === Mode.HELP) return;

    // Otherwise clear the canvas area...
    // Keep splash screen, as it is always behind
    var children = this.wrapper.children
    for(var i = 0; i < children.length; i++) {
      var child = children[i]
      if (child != this.splashDiv) {
        this.wrapper.removeChild(children[i])
      }
    }

    // ...and add the correct one
    if (mode === Mode.MAPEDITOR) {
      this.wrapper.appendChild(this.mapEditorCanvas);
      this.currentMode = Mode.MAPEDITOR;
    } else if (mode === Mode.SPLASH) {
      //this.wrapper.appendChild(this.splashDiv);
      this.currentMode = Mode.SPLASH;
    } else {
      this.wrapper.appendChild(this.canvas);
      this.currentMode = Mode.GAME;
    }
  };
}