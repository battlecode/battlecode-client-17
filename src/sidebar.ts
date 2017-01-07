import {Config} from './config';
import {AllImages} from './imageloader';

import Stats from './stats';
import MapEditor from './mapeditor/main';

export default class Sidebar {

  // HTML elements
  readonly div: HTMLDivElement; // The public div
  private readonly innerDiv: HTMLDivElement;
  private readonly images: AllImages;

  // Different modes
  readonly stats: Stats;
  readonly mapeditor: MapEditor;
  private readonly help: HTMLDivElement;

  // Options
  private readonly conf: Config;

  // Callback to update the game area when changing modes
  cb: () => void;

  constructor(conf: Config, images: AllImages) {
    // Initialize fields
    this.div = document.createElement("div");
    this.innerDiv = document.createElement("div");
    this.images = images;
    this.stats = new Stats(conf, images);
    this.mapeditor = new MapEditor(conf, images);
    this.help = this.initializeHelp();
    this.conf = conf;

    // Initialize div structure
    this.loadStyles();
    this.div.appendChild(this.battlecodeLogo());
    this.div.appendChild(this.modeButton());
    this.div.appendChild(this.helpButton());
    this.div.appendChild(document.createElement("br"));
    this.div.appendChild(document.createElement("br"));
    this.div.appendChild(this.innerDiv);
    this.innerDiv.appendChild(this.stats.div);
  }

  /**
   * Initializes the help div
   */
  private initializeHelp(): HTMLDivElement {
    const options = [
      "LEFT - Skip/Seek Backward",
      "RIGHT - Skip/Seek Forward",
      "p - Pause/Unpause",
      "o - Stop",
      "h - Toggle Health Bars",
      "c - Toggle Circle Bots",
      "v - Toggle Indicator Dots/Lines",
      "b - Toggle Interpolation"
    ];

    const div = document.createElement("div");
    div.style.textAlign = "left";
    div.style.fontFamily = "Tahoma, sans serif";
    div.style.fontSize = "12px";
    div.style.border = "1px solid #ddd";
    div.style.padding = "10px";

    const title = document.createElement("b");
    title.appendChild(document.createTextNode("Keyboard Options"));
    div.appendChild(title);

    for (let option of options) {
      div.appendChild(document.createElement("br"));
      div.appendChild(document.createTextNode(option));
    }
    return div;
  }

  /**
   * Initializes the styles for the sidebar div
   */
  private loadStyles(): void {
    // Positioning
    this.div.style.height = "100%";
    this.div.style.width = "300px";
    this.div.style.position = "fixed";
    this.div.style.zIndex = "1";
    this.div.style.top = "0";
    this.div.style.left = "0";
    this.div.style.overflowX = "hidden";

    // Inner style
    this.div.style.backgroundColor = "#151515";
    this.div.style.color = "white";
    this.div.style.textAlign = "center";
    this.div.style.fontSize = "16px";
    this.div.style.fontFamily = "Graduate";

    // Inner formatting
    this.div.style.padding = "10px";
  }

  /**
   * Battlecode logo or title, at the top of the sidebar
   */
  private battlecodeLogo(): HTMLDivElement {
    let logo: HTMLDivElement = document.createElement("div");
    logo.style.fontWeight = "bold";
    logo.style.fontSize = "40px";
    logo.style.textAlign = "center";
    logo.style.fontFamily = "Graduate";

    logo.style.paddingTop = "15px";
    logo.style.paddingBottom = "15px";

    let text = document.createTextNode("Battlecode");
    logo.appendChild(text);
    return logo;
  }

  private modeButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = "Map Editor";
    button.onclick = () => {
      this.conf.inGameMode = !this.conf.inGameMode;
      this.setSidebar();
    };
    return button;
  }

  private helpButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = "Help";
    button.onclick = () => {
      this.conf.inHelpMode = !this.conf.inHelpMode;
      this.setSidebar();
    };
    return button;
  }

  /**
   * Update the inner div depending on the mode
   */
  private setSidebar(): void {
    // Clear the sidebar
    while (this.innerDiv.firstChild) {
      this.innerDiv.removeChild(this.innerDiv.firstChild);
    }

    // Update the div
    if (this.conf.inHelpMode) {
      this.innerDiv.appendChild(this.help);
    } else if (this.conf.inGameMode) {
      this.innerDiv.appendChild(this.stats.div);
    } else {
      this.innerDiv.appendChild(this.mapeditor.div);
    }

    this.cb();
  }
}
