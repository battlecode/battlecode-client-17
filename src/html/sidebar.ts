import {Config, Mode} from '../config';
import {AllImages} from '../imageloader';

import Stats from './stats';
import Console from './console';
import MapEditor from '../mapeditor/main';
import MatchRunner from './matchrunner';
import ScaffoldCommunicator from '../scaffold';

export default class Sidebar {

  // HTML elements
  readonly div: HTMLDivElement; // The public div
  private readonly innerDiv: HTMLDivElement;
  private readonly images: AllImages;

  // Different modes
  readonly stats: Stats;
  readonly console: Console;
  readonly mapeditor: MapEditor;
  readonly matchrunner: MatchRunner;
  private readonly help: HTMLDivElement;

  // Options
  private readonly conf: Config;

  // onkeydown event that uses the controls depending on the game mode
  private readonly onkeydownControls: (event: KeyboardEvent) => void;

  // Callback to update the game area when changing modes
  cb: () => void;

  // onkeydownControls is an onkeydown event that uses the controls depending on the game mode
  constructor(conf: Config, images: AllImages,
    onkeydownControls: (event: KeyboardEvent) => void,
    scaffold: ScaffoldCommunicator | null) {
    // Initialize fields
    this.div = document.createElement("div");
    this.innerDiv = document.createElement("div");
    this.images = images;
    this.stats = new Stats(conf, images);
    this.console = new Console(conf);
    this.mapeditor = new MapEditor(conf, images);
    this.help = this.initializeHelp();
    this.conf = conf;
    this.onkeydownControls = onkeydownControls

    // Initialize div structure
    this.loadStyles();
    this.div.appendChild(this.battlecodeLogo());
    this.div.appendChild(this.modeButton(Mode.GAME, "Game"));
    if (process.env.ELECTRON && scaffold) {
      this.matchrunner = new MatchRunner(conf, scaffold);
      this.div.appendChild(this.modeButton(Mode.RUNMATCH, "Run Match"));
    }
    this.div.appendChild(this.modeButton(Mode.CONSOLE, "Console"));
    this.div.appendChild(this.modeButton(Mode.MAPEDITOR, "Map Editor"));
    this.div.appendChild(this.modeButton(Mode.HELP, "Help"));
    this.div.appendChild(document.createElement("br"));
    this.div.appendChild(document.createElement("br"));
    this.div.appendChild(this.innerDiv);
    this.innerDiv.appendChild(this.stats.div);
  }

  /**
   * Initializes the help div
   */
  private initializeHelp(): HTMLDivElement {
    const innerHTML: string =
    `This is the client for Battlecode 2017.<br>
    <br>
    <b class="red">How to Play a Match</b><br>
    <i>From the client:</i> Upload a <b>.bc17</b> file from your computer by
    clicking the + button in the top-right corner. Use the control buttons to
    navigate the match.<br>
    <i>From the scaffold:</i> TODO<br>
    <br>
    <b class="blue">Keyboard Shortcuts</b><br>
    LEFT - Skip/Seek Backward<br>
    RIGHT - Skip/Seek Forward<br>
    P - Pause/Unpause<br>
    O - Stop<br>
    H - Toggle Health Bars<br>
    C - Toggle Circle Bots<br>
    V - Toggle Indicator Dots/Lines<br>
    B - Toggle Interpolation<br>
    S - Add/Update (map editor mode)<br>
    D - Delete (map editor mode)<br>
    <br>
    <b class="red">How to Use the Map Editor</b><br>
    Select the initial map settings: name, width, height, symmetry. If you
    later change these settings and the map becomes invalid, you can click
    “EXPORT!” to see what modifications need to be made. You can also click
    “Clear invalid units” to automatically remove overlapping or off-map units,
    but data may be lost.<br>
    <br>
    Add trees and archons to the map by setting the coordinates and radius. The
    coordinates can also be set by clicking on the map. The tree radius will
    automatically adjust to the maximum valid radius if the input is too large,
    and the archon radius is always 2. If the radius is 0, no unit of that type
    can be placed there.<br>
    <br>
    Modify or delete existing units by clicking on them, making changes, then
    clicking “Add/Update.”<br>
    <br>
    When you are happy with your map, click “EXPORT!”. (Note: the name of your
    .map17 file must be the same as the name of your map.) Save the .map17
    file to <b>battlecode-server/src/main/battlecode/world/resources</b>
    directory of your scaffold.`;

    const div = document.createElement("div");
    div.id = "helpDiv";
    div.style.fontFamily = "Tahoma, sans serif";

    div.innerHTML = innerHTML;
    return div;
  }

  /**
   * Initializes the styles for the sidebar div
   */
  private loadStyles(): void {

    this.div.id = "sidebar";

  }

  /**
   * Battlecode logo or title, at the top of the sidebar
   */
  private battlecodeLogo(): HTMLDivElement {
    let logo: HTMLDivElement = document.createElement("div");
    logo.id = "logo";

    let text = document.createTextNode("Battlecode");
    logo.appendChild(text);
    return logo;
  }

  private modeButton(mode: Mode, text: string): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = text;
    button.onclick = () => {
      this.conf.mode = mode;
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

    // Update the div and set the corret onkeydown events
    switch (this.conf.mode) {
      case Mode.GAME:
        this.innerDiv.appendChild(this.stats.div);
        // Reset the onkeydown event listener
        document.onkeydown = (event) => {
          this.onkeydownControls(event);
          switch (event.keyCode) {
            case 72: // "h" - Toggle Health Bars
            this.conf.healthBars = !this.conf.healthBars;
            break;
            case 67: // "c" - Toggle Circle Bots
            this.conf.circleBots = !this.conf.circleBots;
            break;
            case 86: // "v" - Toggle Indicator Dots and Lines
            this.conf.indicators = !this.conf.indicators;
            break;
            case 66: // "b" - Toggle Interpolation
            this.conf.interpolate = !this.conf.interpolate;
            break;
          }
        };
        break;
      case Mode.HELP:
        this.innerDiv.appendChild(this.help);
        break;
      case Mode.MAPEDITOR:
        this.innerDiv.appendChild(this.mapeditor.div);
        // Reset the onkeydown event listener
        document.onkeydown = this.mapeditor.onkeydown();
        break;
      case Mode.CONSOLE:
        this.innerDiv.appendChild(this.console.div);
        break;
      case Mode.RUNMATCH:
        if (this.matchrunner) {
          this.innerDiv.appendChild(this.matchrunner.div);
        }
        break;
    }

    this.cb();
  }
}
