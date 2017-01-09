import {Config} from '../config';

/**
 * Displays the logs produced by the player
 *
 * Eventually this should have an object containing pre-processed console
 * output from playback. The console should have options to filter output
 * based on round number, robot ID, team, etc.
 */
export default class Console {

    // The public div
    readonly div: HTMLDivElement;

    // Options
    private readonly conf: Config;

    constructor(conf: Config) {
      this.conf = conf;
      this.div = this.basediv();

      for (let i=0; i< 40; i++) this.push("Welcome to Battlecode 2017...");
    }

    /**
     * The console.
     */
    private basediv(): HTMLDivElement {
      let div = document.createElement("div");
      div.id = "console";
      return div;
    }

    /**
     * Add a line to the console output.
     */
    push(line: string): void {
      this.div.appendChild(document.createTextNode(line));
      this.div.appendChild(document.createElement("br"));
    }

    /**
     * Clear the console.
     */
    clear(): void {
      while (this.div.firstChild) {
        this.div.removeChild(this.div.firstChild);
      }
    }
}