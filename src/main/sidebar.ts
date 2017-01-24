import {Config, Mode} from '../config';
import {AllImages} from '../imageloader';

import Stats from '../game/sidebar/stats';
import Console from '../game/sidebar/console';
import MatchRunner from '../game/sidebar/matchrunner';
import MatchQueue from '../game/sidebar/matchqueue';
import MapEditor from '../mapeditor/mapeditor';
import ScaffoldCommunicator from '../scaffold';

import {electron} from '../electron-modules';

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
  readonly matchqueue: MatchQueue;
  private readonly help: HTMLDivElement;

  // Options
  private readonly conf: Config;

  // Scaffold
  private scaffold: ScaffoldCommunicator;

  // onkeydown event that uses the controls depending on the game mode
  private readonly onkeydownControls: (event: KeyboardEvent) => void;

  // Callback to update the game area when changing modes
  cb: () => void;

  // onkeydownControls is an onkeydown event that uses the controls depending on the game mode
  constructor(conf: Config, images: AllImages,
    onkeydownControls: (event: KeyboardEvent) => void) {
    // Initialize fields
    this.div = document.createElement("div");
    this.innerDiv = document.createElement("div");
    this.images = images;
    this.stats = new Stats(conf, images);
    this.console = new Console(conf);
    this.mapeditor = new MapEditor(conf, images);
    this.matchrunner = new MatchRunner(conf, () => {
      // Set callback for matchrunner in case the scaffold is loaded later
      electron.remote.dialog.showOpenDialog(
      {
        title: 'Please select your battlecode-scaffold directory.',
        properties: ['openDirectory']
      },
      (filePaths) => {
        if (filePaths.length > 0) {
          this.scaffold = new ScaffoldCommunicator(filePaths[0]);
          this.addScaffold(this.scaffold);
        } else {
          console.log('No scaffold found or provided');
        }
      })
    });
    this.matchqueue = new MatchQueue(conf, images);
    this.help = this.initializeHelp();
    this.conf = conf;
    this.onkeydownControls = onkeydownControls

    // Initialize div structure
    this.loadStyles();
    this.div.appendChild(this.battlecodeLogo());
    this.div.appendChild(this.modeButton(Mode.GAME, "Game"));
    this.div.appendChild(this.modeButton(Mode.QUEUE, "Queue"));
    this.div.appendChild(this.modeButton(Mode.CONSOLE, "Console"));
    this.div.appendChild(this.modeButton(Mode.MAPEDITOR, "Map Editor"));
    this.div.appendChild(this.modeButton(Mode.HELP, "Help"));
    this.div.appendChild(document.createElement("br"));
    this.div.appendChild(document.createElement("br"));
    this.div.appendChild(this.innerDiv);
    this.innerDiv.appendChild(this.stats.div);
  }

  /**
   * Sets a scaffold if a scaffold directory is found after everything is loaded
   */
  addScaffold(scaffold: ScaffoldCommunicator): void {
    this.mapeditor.addScaffold(scaffold);
    this.matchrunner.addScaffold(scaffold);
  }

  /**
   * Initializes the help div
   */
  private initializeHelp(): HTMLDivElement {
    const innerHTML: string =
    `This is the client for Battlecode 2017. If you run into any issues,
    make a post in the <a href="http://www.battlecodeforum.org" target="_blank">Battlecode forum</a>.
    Be sure to attach a screenshot of your console output (F12 in the app) and
    any other relevant information.<br>
    <br>
    <b class="red">Keyboard Shortcuts</b><br>
    LEFT - Step Back One Turn<br>
    RIGHT - Step Forward One Turn<br>
    P - Pause/Unpause<br>
    O - Stop<br>
    H - Toggle Health Bars<br>
    C - Toggle Circle Bots<br>
    V - Toggle Indicator Dots/Lines<br>
    B - Toggle Interpolation<br>
    N - Toggle Sight/Sensor Radius<br>
    M - Toggle Bullet Sight Radius<br>
    S - Add/Update (map editor mode)<br>
    D - Delete (map editor mode)<br>
    <br>
    <b class="blue">How to Play a Match</b><br>
    <i>From the application:</i> Click <b>'Queue'</b> and follow the
    instructions in the sidebar. Note that it may take a few seconds for
    matches to be displayed.<br>
    <i>From the web client:</i> If you are not running the client as a
    stand-alone application, you can always upload a <b>.bc17</b> file by
    clicking the + button in the top-right corner.<br>
    <br>
    Use the control buttons in <b>'Queue'</b> and the top of the screen to
    navigate the match.<br>
    <br>
    <b class="red">How to Use the Console</b><br>
    The console displays all System.out.println() data up to the current round.
    You can filter teams by checking the boxes and robot IDs by clicking the
    robot. You can also change the maximum number of rounds displayed in the
    input box. (WARNING: If you want to, say, suddenly display 3000 rounds
    of data on round 2999, pause the client first to prevent freezing.)<br>
    <br>
    <b class="blue">How to Use the Map Editor</b><br>
    Select the initial map settings: name, width, height, symmetry. Add trees
    and archons by setting the coordinates and radius, and clicking
    <b>"Add/Update."</b> The coordinates can also be set by clicking the map.
    The radius will automatically adjust to the maximum valid radius if the
    input is too large, and an archon always has radius 2. If the radius is 0,
    no unit of that type can be placed there.<br>
    <br>
    Modify or delete existing units by clicking on them, making changes, then
    clicking <b>“Add/Update."</b><br>
    <br>
    Before exporting, click <b>"Validate"</b> to see if any changes need to be
    made, and <b>"Remove Invalid Units"</b> to automatically remove off-map or
    overlapping units. When you are happy with your map, click <b>“EXPORT!”</b>.
    If you are directed to save your map, save it in the
    <b>/battlecode-scaffold-2017-master/maps</b> directory of your scaffold.
    (Note: the name of your .map17 file must be the same as the name of your
    map.)`;

    const div = document.createElement("div");
    div.id = "helpDiv";

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

    // Update the div and set the correct onkeydown events
    switch (this.conf.mode) {
      case Mode.GAME:
        this.innerDiv.appendChild(this.stats.div);
        // Reset the onkeydown event listener
        
        document.onkeydown = (event) => {
          this.onkeydownControls(event);
          var input = document.activeElement.nodeName == "INPUT";
          if(!input) {
            console.log(input);
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
              case 78: // "n" - Toggle sight radius
                this.conf.sightRadius = !this.conf.sightRadius;
                break;
              case 77: // "m" - Toggle bullet sight radius
                this.conf.bulletSightRadius = !this.conf.bulletSightRadius;
                break;
            }
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
      case Mode.QUEUE:
        this.innerDiv.appendChild(this.matchrunner.div);
        this.innerDiv.appendChild(this.matchqueue.div);
        break;
    }

    this.cb();
  }
}
