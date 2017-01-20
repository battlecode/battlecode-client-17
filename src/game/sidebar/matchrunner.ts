import {Config} from '../../config';

import ScaffoldCommunicator from '../../scaffold';
import {MapFilter} from '../index';

/**
 * The interface to run matches from the scaffold.
 *
 * Should not show up if there is no scaffold or process.env.ELECTRON is false!
 */
export default class MatchRunner {

  // The public div
  readonly div: HTMLDivElement;

  // The div displayed depending on whether the scaffold is loaded
  private divNoElectron: HTMLDivElement;
  private divNoScaffold: HTMLDivElement;
  private divScaffold: HTMLDivElement;

  // Because Gradle is slow
  private isLoadingMatch: boolean;
  private compileLogs: HTMLDivElement;

  // Options
  private readonly conf: Config;

  // The scaffold
  private scaffold: ScaffoldCommunicator;
  private cb: () => void; // callback for loading the scaffold

  // The maps
  private maps: MapFilter;

  // Match information
  private teamA: HTMLSelectElement;
  private teamB: HTMLSelectElement;
  private selectAllMaps: HTMLButtonElement;
  private deselectAllMaps: HTMLButtonElement;
  private runMatch: HTMLButtonElement;
  private refreshButton: HTMLButtonElement

  constructor(conf: Config, cb: () => void) {
    this.conf = conf;
    this.cb = cb;
    this.isLoadingMatch = false;

    // The scaffold is loaded...
    this.divScaffold = this.loadDivScaffold();

    // ...but in case it's not
    this.divNoElectron = this.loadDivNoElectron();
    this.divNoScaffold = this.loadDivNoScaffold();

    // And finally
    this.div = this.basediv();
  }

  addScaffold(scaffold: ScaffoldCommunicator): void {
    this.scaffold = scaffold;

    // Populate the form
    this.maps.addScaffold(scaffold);
    this.refresh();

    // Hide existing elements and show divScaffold
    this.divNoElectron.style.display = "none";
    this.divNoScaffold.style.display = "none";
    this.divScaffold.style.display = "unset";
  }

  /**
   * The div that contains everything.
   */
  private basediv(): HTMLDivElement {
    let div = document.createElement("div");
    div.id = "matchRunner";

    // Add the potential divs
    div.appendChild(this.divNoElectron);
    div.appendChild(this.divNoScaffold);
    div.appendChild(this.divScaffold);

    // Show the correct div
    if (!process.env.ELECTRON) {
      // We're not even in electron
      this.divNoElectron.style.display = "unset";
    } else if (this.scaffold) {
      // We have the scaffold!
      this.divScaffold.style.display = "unset";
    } else {
      // Nope, no scaffold yet
      this.divNoScaffold.style.display = "unset";
    }

    return div;
  }

  /**
   * When there is electron and the scaffold is located - create the UI elements
   */
  private loadDivScaffold(): HTMLDivElement {
    let div = document.createElement("div");
    div.style.display = "none";

    this.teamA = document.createElement("select");
    this.teamB = document.createElement("select");
    this.runMatch = document.createElement("button");
    this.refreshButton = document.createElement("button");
    this.selectAllMaps = document.createElement("button");
    this.deselectAllMaps = document.createElement("button");

    // Compile error log
    this.compileLogs = document.createElement("div");
    this.compileLogs.className = "console";
    this.compileLogs.id = "compileLogs";
    this.compileLogs.innerHTML = "Compile messages..."
    div.appendChild(this.compileLogs);
    div.appendChild(document.createElement("br"));

    // Team A selector
    const divA = document.createElement("div");
    divA.appendChild(document.createTextNode("Team A: "));
    divA.appendChild(this.teamA);
    divA.appendChild(document.createElement("br"));
    div.appendChild(divA);

    // Team B selector
    const divB = document.createElement("div");
    divB.appendChild(document.createTextNode("Team B: "));
    divB.appendChild(this.teamB);
    divB.appendChild(document.createElement("br"));
    div.appendChild(divB);

    // Map selector
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createTextNode("Select a map: "));
    div.appendChild(document.createElement("br"));
    this.maps = new MapFilter();
    div.appendChild(this.maps.div);

    // Select all maps button
    this.selectAllMaps.type = "button";
    this.selectAllMaps.appendChild(document.createTextNode("Select All"));
    this.selectAllMaps.onclick = () => {
      this.maps.selectAll();
    };
    div.appendChild(this.selectAllMaps);

    // Deselect all maps button
    this.deselectAllMaps.type = "button";
    this.deselectAllMaps.appendChild(document.createTextNode("Deselect All"));
    this.deselectAllMaps.onclick = () => {
      this.maps.deselectAll();
    };
    div.appendChild(this.deselectAllMaps);

    // Refresh Button
    this.refreshButton.type = "button";
    this.refreshButton.appendChild(document.createTextNode("Refresh"));
    this.refreshButton.onclick = this.refresh;
    div.appendChild(this.refreshButton);
    div.appendChild(document.createElement("br"));

    // Run match button
    this.runMatch.type = "button";
    this.runMatch.appendChild(document.createTextNode("Run Match"));
    this.runMatch.id = "runMatch"
    this.runMatch.onclick = this.run;
    div.appendChild(this.runMatch);

    return div;
  }

  /**
   * When there isn't electron at all so you can only upload files
   */
  private loadDivNoElectron(): HTMLDivElement {
    const div = document.createElement("div");
    div.style.display = "none";
    div.appendChild(document.createTextNode(`You aren’t running the client as an
      application, so you can’t load matches directly from your scaffold. :(`));
    return div;
  }

  /**
   * When you're in electron but we can't find the scaffold directory automatically
   */
  private loadDivNoScaffold(): HTMLDivElement {
    const div = document.createElement("div");
    div.style.display = "none";
    div.appendChild(document.createTextNode(`Please select your battlecode-scaffold
      directory (the one you downloaded that has all those files in it) to run
      matches directly from the client.`))

    // Add a button to load the directory
    const button = document.createElement("button");
    button.type = "button";
    button.appendChild(document.createTextNode("Find Directory"));
    div.appendChild(button);

    // Open a dialog when it's clicked
    button.onclick = this.cb;
    return div;
  }

  /**
   * If the scaffold can find the players, populate the client
   */
  private teamCallback = (err: Error | null, packages?: string[]) => {
    // There was an error
    if (err) {
      console.log(err);
      return;
    }
    // Found the packages, make the team selectors
    if (packages) {
      for (let player of packages) {
        // Add the player to team A
        const optionA = document.createElement("option");
        optionA.value = player;
        optionA.appendChild(document.createTextNode(player));
        this.teamA.appendChild(optionA);

        // Add the player to team B
        const optionB = document.createElement("option");
        optionB.value = player;
        optionB.appendChild(document.createTextNode(player));
        this.teamB.appendChild(optionB);
      }
    }
  }

  /**
   * If the scaffold can run a match, add the functionality to the run button
   */
  private run = () => {
    // Already loading a match, don't run again
    if (this.isLoadingMatch) {
      return;
    }

    this.compileLogs.innerHTML = "";
    this.isLoadingMatch = true;
    this.scaffold.runMatch(
      this.getTeamA(),
      this.getTeamB(),
      this.getMaps(),
      (err) => {
        console.log(err.stack);
        this.isLoadingMatch = false;
      },
      () => {
        this.isLoadingMatch = false;
      },
      (stdoutdata) => {
        const logs = document.createElement('p');
        logs.innerHTML = stdoutdata.split('\n').join('<br/>');
        this.compileLogs.appendChild(logs);
        this.compileLogs.scrollTop = this.compileLogs.scrollHeight;
      },
      (stderrdata) => {
        const logs = document.createElement('p');
        logs.innerHTML = stderrdata.split('\n').join('<br/>');
        logs.className = 'errorLog';
        this.compileLogs.appendChild(logs);
        this.compileLogs.scrollTop = this.compileLogs.scrollHeight;
      }
    );
  }

  /**
   * Refresh the player list and maps
   */
  private refresh = () => {
    // Clear player and maps options
    while (this.teamA.firstChild) {
      this.teamA.removeChild(this.teamA.firstChild);
    }
    while (this.teamB.firstChild) {
      this.teamB.removeChild(this.teamB.firstChild);
    }

    // Refresh
    this.scaffold.getPlayers(this.teamCallback);
    this.maps.refresh();
  }

  /**********************************
   * Observers
   **********************************/
  private getTeamA(): string {
    return this.teamA.options[this.teamA.selectedIndex].value;
  }

  private getTeamB(): string {
    return this.teamB.options[this.teamB.selectedIndex].value;
  }

  private getMaps(): string[] {
    return this.maps.getMaps();
  }
}
