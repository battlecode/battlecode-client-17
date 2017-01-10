import {Config} from '../config';
import {AllImages} from '../imageloader';

import {Game} from 'battlecode-playback';

export default class MatchQueue {

  // The public div
  readonly div: HTMLDivElement;

  // Options
  private conf: Config;

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
    div.id = "matchViewer";
    div.style.fontFamily = "Tahoma, sans serif";

    let title = document.createElement("b");
    title.appendChild(document.createTextNode("Games"));

    // Add buttons
    let next = document.createElement("button");
    next.setAttribute("class", "custom-button");
    next.setAttribute("type", "button");
    next.onclick = () => this.onNextMatch();
    next.appendChild(this.images.controls.matchForward);

    let back = document.createElement("button");
    back.setAttribute("class", "custom-button");
    back.setAttribute("type", "button");
    back.onclick = () => this.onPreviousMatch();
    back.appendChild(this.images.controls.matchBackward);

    let gameNum = document.createElement("span");
    gameNum.className += " gameNum";

    title.appendChild(gameNum);
    title.appendChild(back);
    title.appendChild(next);
    div.appendChild(title);
    div.appendChild(document.createElement("br"));

    return div;
  }

  refreshGameList(gameList: Array<Game>, activeGame: number, activeMatch: number) {

    // Remove all games from the list
    while(this.div.childNodes[2]){
      this.div.removeChild(this.div.childNodes[2]);
    }

    this.div.childNodes[0].childNodes[1].textContent = " (" + (activeGame + 1) + "/" + gameList.length + ")";

    //for (let game of gameList) {
    for (var j = 0; j < gameList.length; j++) {
      let game = gameList[j];
      if(game != null) {

        var metaData = game.meta;
        var matchCount = game.matchCount;
        var winner = game.winner;

        // Construct a team vs. team string
        var vsString = document.createElement("div");
        var winnerString: HTMLSpanElement;
        if(metaData != null) {

          for (let team in metaData.teams) {
              var teamName = document.createElement("span");
              teamName.className += team === "1" ? " red" : " blue";
              teamName.innerHTML = metaData.teams[team].name;
              vsString.appendChild(teamName)
              vsString.appendChild(document.createTextNode(" vs. "));
              if(metaData.teams[team].teamID == winner) {
                winnerString = teamName;
              }
          }

          if(vsString.lastChild != null) {
            vsString.removeChild(vsString.lastChild);
          }

          var gameDiv = document.createElement("div");
          gameDiv.className += " gameDiv";
          var title = document.createElement("b");
          title.appendChild(vsString);
          //title.appendChild(document.createTextNode(" on " + game.matchCount + " matches"))
          // INSTEAD, Show i.e. Playing 1/3 << >>
          gameDiv.appendChild(title);
          if(game == gameList[activeGame]) {
            gameDiv.appendChild(document.createTextNode("Playing match " + (activeMatch + 1) + "/" + matchCount));
          }

          gameDiv.appendChild(document.createElement("br"));

          for (var i = 0; i < matchCount; i++) {
            var match = game.getMatch(i);
            var mapName = match.current.mapName;

            var matchWinner = document.createElement("span");
            for (let team in metaData.teams) {
                if(metaData.teams[team].teamID == match.winner) {
                  matchWinner.className += team === "1" ? " red" : " blue";
                  matchWinner.innerHTML = metaData.teams[team].name;
                  break;
                }
            }

            // Add the information to the list
            let matchEntry = document.createTextNode(" wins after " + (match.lastTurn + 1) + " rounds" );
            let matchPrefix = document.createTextNode(mapName + " - ");
            var matchWrapper = document.createElement("div");
            matchWrapper.appendChild(matchPrefix);
            matchWrapper.appendChild(matchWinner);
            matchWrapper.appendChild(matchEntry);
            matchWrapper.appendChild(document.createElement("br"));

            if(j == activeGame && i == activeMatch) {
              matchWrapper.className = 'active-match';
            } else {
              matchWrapper.className = 'inactive-match';

              matchWrapper.onclick = (function(game, match, gotoMatch) {
                  return function(){ gotoMatch(game, match); }
              })(j,i, this.gotoMatch);

            }

            gameDiv.appendChild(matchWrapper);

          }

          // Create remove button
          let remove = document.createElement("button");
          remove.setAttribute("class", "custom-button");
          remove.setAttribute("type", "button");
          remove.textContent = "Remove";

          remove.onclick = (function(game, removeGame) {
                  return function(){ removeGame(game); }
          })(j, this.removeGame);

          gameDiv.appendChild(remove);

          this.div.appendChild(gameDiv);

        }
      }
    }
  }
}