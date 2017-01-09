import {Config} from '../config';

/**
 * Displays the logs produced by the player
 */
export default class Console {

    // The public div
    readonly div: HTMLDivElement;

    // Options
    private readonly conf: Config;

    constructor(conf: Config) {
      this.conf = conf;
      this.div = this.basediv();
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