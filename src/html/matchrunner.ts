import {Config} from '../config';

import ScaffoldCommunicator from '../scaffold';

/**
 * The interface to run matches from the scaffold.
 *
 * Should not show up if there is no scaffold or process.env.ELECTRON is false!
 */
export default class MatchRunner {

  // The public div
  readonly div: HTMLDivElement;
  private loading: Text;

  // Options
  private readonly conf: Config;

  // The scaffold
  private readonly scaffold: ScaffoldCommunicator;

  // Match information
  private teamA: HTMLSelectElement;
  private teamB: HTMLSelectElement;
  private mapsContainer: HTMLDivElement;
  private maps: Array<HTMLInputElement>;
  private runMatch: HTMLButtonElement;

  constructor(conf: Config, scaffold: ScaffoldCommunicator) {
    this.conf = conf;
    this.scaffold = scaffold;
    this.loading = document.createTextNode("Loading...");
    this.div = this.basediv();

    this.startForm();

    // Populate the form
    this.scaffold.getPlayers(this.teamCallback);
    this.scaffold.getMaps(this.mapCallback);
  }

  /**
   * The div that contains everything.
   */
  private basediv(): HTMLDivElement {
    let div = document.createElement("div");
    div.id = "matchrunner";
    return div;
  }

  /**
   * Creates the form elements and puts them in the UI.
   */
  private startForm(): void {
    this.teamA = document.createElement("select");
    this.teamB = document.createElement("select");
    this.mapsContainer = document.createElement("div");
    this.runMatch = document.createElement("button");

    // Team A selector
    const divA = document.createElement("div");
    divA.appendChild(document.createTextNode("Team A: "));
    divA.appendChild(this.teamA);
    divA.appendChild(document.createElement("br"));
    this.div.appendChild(divA);

    // Team B selector
    const divB = document.createElement("div");
    divB.appendChild(document.createTextNode("Team B: "));
    divB.appendChild(this.teamB);
    divB.appendChild(document.createElement("br"));
    this.div.appendChild(divB);

    // Map selector
    this.mapsContainer.appendChild(document.createTextNode("Select a map:"));
    this.mapsContainer.appendChild(this.loading);
    this.mapsContainer.appendChild(document.createElement("br"));
    this.div.appendChild(this.mapsContainer);

    // Run match button
    this.runMatch.type = "button";
    this.runMatch.appendChild(document.createTextNode("Run Match"));
    this.runMatch.onclick = this.run;
    this.div.appendChild(this.runMatch);
  }

  /**
   * If the scaffold can find the players, populate the client
   */
  private teamCallback = (err: Error | null, packages: string[] | null) => {
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
   * In the scaffold can find maps, populate the client
   */
  private mapCallback = (err: Error | null, maps: string[] | null) => {
    // There was an error
    if (err) {
      console.log(err);
      return;
    }

    // Found the maps
    if (maps) {
      console.log(maps);
      this.mapsContainer.removeChild(this.loading);
      this.maps = new Array();
      // Create a checkbox for each map...
      for (let map of maps) {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = map;

        // ...and put the checkbox in the UI
        this.maps.push(checkbox);
        this.mapsContainer.appendChild(checkbox);
        this.mapsContainer.appendChild(document.createTextNode(map));
        this.mapsContainer.appendChild(document.createElement("br"));
      }
    }
  }

  /**
   * If the scaffold can run a match, add the functionality to the run button
   */
  private run = () => {
    const cb = (err: Error | null, stdout: string, stderr: string) => {};
    this.scaffold.runMatch(
      this.getTeamA(),
      this.getTeamB(),
      this.getMaps(),
      cb
    );
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
    const maps: string[] = new Array();
    for (let map of this.maps) {
      if (map.checked) {
        maps.push(map.value);
      }
    }
    return maps;
  }
}