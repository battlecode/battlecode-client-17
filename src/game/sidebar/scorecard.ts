/**
 * Keeps track of the number of matches won so far in a game.
 * Currently only compatible with tournaments!!!
 */
export default class Scorecard {

  div: HTMLDivElement = document.createElement("div");

  private teamA: HTMLSpanElement;
  private teamB: HTMLSpanElement;

  constructor() {
    this.teamA = document.createElement("span");
    this.teamA.className = "red";
    this.teamB = document.createElement("span");
    this.teamB.className = "blue";
    this.resetScore();

    this.div.className = "scorecard";
    this.div.appendChild(this.teamA);
    this.div.appendChild(document.createTextNode("-"));
    this.div.appendChild(this.teamB);
  }

  resetScore(): void {
    this.teamA.innerText = "0";
    this.teamB.innerText = "0";
  }

  setScore(teamAScore: number, teamBScore: number): void {
    this.teamA.innerText = String(teamAScore);
    this.teamB.innerText = String(teamBScore);
  }

  incrementA() {
    this.teamA.innerText = String(parseInt(this.teamA.innerText) + 1);
  }

  incrementB() {
    this.teamB.innerText = String(parseInt(this.teamB.innerText) + 1);
  }
}