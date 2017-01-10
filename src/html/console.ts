import {Config} from '../config';
import {Log} from 'battlecode-playback';

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
  private readonly console: HTMLDivElement;

  // Options
  private teamA: HTMLInputElement;
  private teamB: HTMLInputElement;
  private readonly conf: Config;

  // Map from round number to list of logs
  private roundLogs: Map<number, Array<Log>>;
  private idLogs: Map<number, Array<Log>>;

  constructor(conf: Config) {
    this.conf = conf;
    this.roundLogs = new Map<number, Array<Log>>();
    this.idLogs = new Map<number, Array<Log>>();
    this.console = document.createElement("div");
    this.div = this.basediv();
  }

  /**
   * The console.
   */
  private basediv(): HTMLDivElement {
    let div = document.createElement("div");

    this.teamA = this.checkBox("A");
    this.teamB = this.checkBox("B");

    div.appendChild(this.teamA);
    div.appendChild(document.createTextNode("Team A"));
    div.appendChild(this.teamB);
    div.appendChild(document.createTextNode("Team B"));
    div.appendChild(document.createElement("br"));

    div.appendChild(this.console);
    this.console.id = "console";
    return div;
  }

  // team is A or B
  private checkBox(team: string): HTMLInputElement {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = team;
    checkbox.checked = true;
    return checkbox;
  }

  setLogs(logs: Array<Log>): void {
    logs.forEach((log: Log) => {
      const round = log.round;
      if (!this.roundLogs.has(round)) {
        this.roundLogs.set(round, new Array());
      }
      if (!this.idLogs.has(round)) {
        this.idLogs.set(round, new Array());
      }
      this.roundLogs.get(round).push(log);
      this.idLogs.get(round).push(log);
    });
  }

  /**
   * Clear the console.
   */
  clear(): void {
    while (this.console.firstChild) {
      this.console.removeChild(this.console.firstChild);
    }
  }

  pushRound(round: number, id: number | undefined): void {
    if (this.roundLogs.has(round)) {
      const roundLogs: Array<Log> = this.roundLogs.get(round);
      roundLogs.forEach((log: Log) => {
        if ((!id || id === log.id) && this.teamSelected(log.team)) {
          // No ID was selected, or an ID was selected and matches the log's ID
          this.push(log.text);
        }
      });
      this.console.scrollTop = this.console.scrollHeight;
    }
    this.removeExtraLogs();
  }

  // team is 'A' or 'B'
  private teamSelected(team: string): boolean {
    return (team === "A" && this.teamA.checked) ||
           (team === "B" && this.teamB.checked);
  }

  private removeExtraLogs(): void {
    while (this.console.scrollHeight > this.console.clientHeight) {
      if (this.console.firstChild) {
        this.console.removeChild(this.console.firstChild);
      } else {
        return;
      }
    }
  }

  /**
   * Add a line to the console output.
   */
  private push(line: string): void {
    this.console.appendChild(document.createTextNode(line));
    this.console.appendChild(document.createElement("br"));
  }
}