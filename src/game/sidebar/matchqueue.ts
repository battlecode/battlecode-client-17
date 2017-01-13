import {Config} from '../../config';
import {AllImages} from '../../imageloader';

import {Game} from 'battlecode-playback';

export default class MatchQueue {

  // The public div
  readonly div: HTMLDivElement;

  // Other HTML elements
  private gameNum: HTMLSpanElement;

  // Options
  private readonly conf: Config;

  // Callbacks initialized from outside Stats
  onNextMatch: () => void;
  onPreviousMatch: () => void;
  gotoMatch: (game: number, match: number) => void;
  removeGame: (game: number) => void;

  // Images
  private readonly images: AllImages;

  constructor(conf: Config, images: AllImages) {
    this.conf = conf;
    this.images = images;
    this.div = this.basediv();
  }

  private basediv(): HTMLDivElement {
    let div = document.createElement("div");
    div.id = "matchQueue";

    let title = document.createElement("b");
    title.appendChild(document.createTextNode("Games"));

    // Games (currentGame / numberOfGames)
    this.gameNum = document.createElement("span");
    this.gameNum.className += " gameNum";

    // Go to the previous match/round
    let back = document.createElement("button");
    back.setAttribute("class", "custom-button");
    back.setAttribute("type", "button");
    back.onclick = () => this.onPreviousMatch();
    back.appendChild(this.images.controls.matchBackward);

    // Go the next match/round
    let next = document.createElement("button");
    next.setAttribute("class", "custom-button");
    next.setAttribute("type", "button");
    next.onclick = () => this.onNextMatch();
    next.appendChild(this.images.controls.matchForward);

    // Append all the HTML elements
    title.appendChild(this.gameNum);
    title.appendChild(back);
    title.appendChild(next);
    div.appendChild(title);
    div.appendChild(document.createElement("br"));

    return div;
  }

  refreshGameList(gameList: Array<Game>, activeGame: number, activeMatch: number) {

    // Remove all games from the list
    while (this.div.childNodes[2]) {
      this.div.removeChild(this.div.childNodes[2]);
    }

    // Update the content of the active game tracker
    this.gameNum.textContent = `(${activeGame + 1}/${gameList.length})`;

    // Add a div for each game
    for (let gameIndex = 0; gameIndex < gameList.length; gameIndex++) {

      const game = gameList[gameIndex];
      if (game != null) {

        const meta = game.meta;
        const matchCount = game.matchCount;
        if (meta != null) {
          const gameWrapper = document.createElement("div");
          gameWrapper.className += " gameWrapper";

          // teamA vs. teamB title node
          const title = document.createElement("b");
          const teamVsTeam = this.teamVsTeam(meta.teams);
          title.appendChild(teamVsTeam);
          gameWrapper.appendChild(title);

          // Add class if an active game
          if (game === gameList[activeGame]) {
            gameWrapper.appendChild(document.createTextNode(
              `Playing match ${(activeMatch + 1)}/${matchCount}`));
          }
          gameWrapper.appendChild(document.createElement("br"));

          // Add a div for each match in the game
          for (let matchIndex = 0; matchIndex < matchCount; matchIndex++) {
            const match = game.getMatch(matchIndex);

            const mapName = match.current.mapName;
            const matchWinner = this.winnerTeam(meta.teams, match.winner);
            const rounds = match.lastTurn + 1;
            const active = gameIndex === activeGame && matchIndex === activeMatch;
            const cb = () => { this.gotoMatch(gameIndex, matchIndex) };

            gameWrapper.appendChild(this.matchWrapper(
              mapName, matchWinner, rounds, active, cb));
          }

          // Create remove button
          gameWrapper.appendChild(this.removeButton(gameIndex));
          this.div.appendChild(gameWrapper);
        }
      }
    }
  }

  /**
   * Returns the string of "$TEAMA vs. $TEAMB" in the corresponding team colors
   */
  private teamVsTeam(teams): HTMLDivElement {
    const div = document.createElement("div");

    let teamNumber: number = 1;
    for (let team in teams) {
      // Create the team name span
      const teamName = document.createElement("span");
      teamName.className += teamNumber === 1 ? " red" : " blue";
      teamName.innerHTML = teams[team].name;

      // Add it to the div
      div.appendChild(teamName)
      div.appendChild(document.createTextNode(" vs. "));
      teamNumber += 1
    }

    // Remove the last " vs. " because that's how it works
    if (div.lastChild != null) {
      div.removeChild(div.lastChild);
    }

    return div;
  }

  /**
   * Returns the name of the winning team in the team's color
   */
  private winnerTeam(teams, winnerID: number | null): HTMLSpanElement {
    const span = document.createElement("span");
    if (winnerID === null) {
      // There was a tie
      span.appendChild(document.createTextNode("(Loading...)"));
    } else {
      // Find the winner
      let teamNumber = 1;
      for (let team in teams) {
        if (teams[team].teamID === winnerID) {
          span.className += team === "1" ? " red" : " blue";
          span.innerHTML = teams[team].name;
          break;
        }
      }
    }
    return span;
  }

  /**
   * On click, the match wrapper will start playing the selected game/match.
   * Returns the match wrapper in the form:
   *   $MAPNAME - $WINNERTEAM wins after $ROUNDS rounds
   */
  private matchWrapper(mapName: string, winner: HTMLSpanElement, rounds: number,
    active: boolean, onclick: () => void): HTMLDivElement {
    // $MAPNAME - $WINNERTEAM wins after $ROUNDS rounds
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(`${mapName} - `));
    div.appendChild(winner);
    div.appendChild(document.createTextNode(` wins after ${rounds} rounds`));
    div.appendChild(document.createElement("br"));

    // Set the CSS of the box
    if (active) {
      div.className = 'active-match';
    } else {
      div.className = 'inactive-match';
      div.onclick = onclick;
    }
    return div;
  }

  /**
   * Returns a button to remove a certain game
   */
  private removeButton(gameNumber: number): HTMLButtonElement {
    let remove = document.createElement("button");
    remove.setAttribute("class", "custom-button");
    remove.setAttribute("type", "button");
    remove.textContent = "Remove";
    remove.onclick = () => {this.removeGame(gameNumber)};
    return remove;
  }
}