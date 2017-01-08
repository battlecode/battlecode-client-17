import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';

import {Game, schema} from 'battlecode-playback';

const hex: Object = {
  1: "#a62014",
  2: "#0636ac"
};

/**
* Loads game stats: team name, victory points, bullets, robot count
* We make the distinction between:
*    1) Team names - a global string identifier i.e. "Teh Devs"
*    2) Team IDs - each Battlecode team has a unique numeric team ID i.e. 0
*    3) In-game ID - used to distinguish teams in the current match only;
*       team 1 is red, team 2 is blue
*/
export default class Stats {

  readonly div: HTMLDivElement;
  private readonly images: AllImages;

  // Match Options
  private matches: HTMLDivElement;

  // Key is the team ID, folllowed by the robot/stat type
  private robotTds: Object = {};
  private statTds: Object = {};

  // Callbacks initialized from outside Stats
  // Yeah, it's pretty gross :/
  onNextMatch: () => void;
  onPreviousMatch: () => void;
  gotoMatch: (game: number, match: number) => void;
  removeGame: (game: number) => void;

  // Note: robot types and number of teams are currently fixed regardless of
  // match info. Keep in mind if we ever change these, or implement this less
  // statically.

  private readonly stats: string[] = ["Bullets", "Victory Points"];
  private readonly robots: schema.BodyType[] = [
    cst.ARCHON, cst.GARDENER, cst.LUMBERJACK, cst.SOLDIER, cst.TANK, cst.SCOUT
  ];

  constructor(conf: Config, images: AllImages) {
    this.images = images;

    this.div = document.createElement("div");
    this.matches = this.matchViewer();

    let teamNames: Array<string> = ["?????", "?????"];
    let teamIDs: Array<number> = [1, 2];
    this.initializeGame(teamNames, teamIDs);
  }

  /**
   * Colored banner labeled with the given teamName
   */
  private teamHeaderNode(teamName: string, inGameID: number) {
    let teamHeader: HTMLDivElement = document.createElement("div");
    teamHeader.style.padding = "14px";
    teamHeader.style.fontSize = "20px";
    teamHeader.style.marginTop = "5px";
    teamHeader.style.marginBottom = "10px";

    let teamNameNode = document.createTextNode(teamName);
    teamHeader.style.backgroundColor = hex[inGameID];
    teamHeader.appendChild(teamNameNode);
    return teamHeader;
  }

  /**
   * Create the table that displays the robot images along with their counts.
   * Uses the teamID to decide which color image to display.
   */
  private robotTable(teamID: number, inGameID: number) {
    let table: HTMLTableElement = document.createElement("table");
    table.setAttribute("align", "center");

    // Create the table row with the robot images
    let robotImages: HTMLTableRowElement = document.createElement("tr");
    for (let robot of this.robots) {
      let robotName: string = cst.bodyTypeToString(robot);
      let td: HTMLTableCellElement = document.createElement("td");
      td.appendChild(this.images.robot[robotName][inGameID]);
      robotImages.appendChild(td);
    }
    table.appendChild(robotImages);

    // Create the table row with the robot counts
    let robotCounts: HTMLTableRowElement = document.createElement("tr");
    for (let robot of this.robots) {
      let td: HTMLTableCellElement = this.robotTds[teamID][robot];
      robotCounts.appendChild(td);
    }
    table.appendChild(robotCounts);

    return table;
  }


  private overallStatsTable(teamID: number, inGameID: number) {
    let table: HTMLTableElement = document.createElement("table");
    table.setAttribute("align", "center");
    table.style.marginTop = "10px";

    // Create a table row for each stat
    for (let stat of this.stats) {
      let tr: HTMLTableRowElement = document.createElement("tr");

      let tdLabel: HTMLTableCellElement = document.createElement("td");
      tdLabel.appendChild(document.createTextNode(stat));
      tdLabel.style.fontFamily = "Graduate";
      tdLabel.style.color = hex[inGameID];
      tdLabel.style.textAlign = "right";
      tdLabel.style.padding = "5px";
      tr.appendChild(tdLabel);

      let tdCount: HTMLTableCellElement = this.statTds[teamID][stat];
      tdCount.style.paddingLeft = "10px";
      tdCount.style.textAlign = "left";
      tr.appendChild(tdCount);

      table.appendChild(tr);
    }

    return table;
  }

  private matchViewer() {

    let div = document.createElement("div");
    div.style.textAlign = "left";
    div.style.fontFamily = "Tahoma, sans serif";
    div.style.fontSize = "18px";
    div.style.border = "1px solid #ddd";
    div.style.padding = "10px";

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
    while(this.matches.childNodes[2]){
      this.matches.removeChild(this.matches.childNodes[2]);
    }

    console.log(this.matches.childNodes);
    this.matches.childNodes[0].childNodes[1].textContent = " (" + (activeGame + 1) + "/" + gameList.length + ")";

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

          this.matches.appendChild(gameDiv);

        }
      }
    }
  }

  /**
   * Clear the current stats bar and reinitialize it with the given teams.
   */
  initializeGame(teamNames: Array<string>, teamIDs: Array<number>){
    // Remove the previous match info
    while (this.div.firstChild) {
      this.div.removeChild(this.div.firstChild);
    }
    this.robotTds = {};
    this.statTds = {};

    // Populate with new info
    // Add a section to the stats bar for each team in the match
    for (var index = 0; index < teamIDs.length; index++) {
      // Collect identifying information
      let teamID = teamIDs[index];
      let teamName = teamNames[index];
      let inGameID = index + 1; // teams start at index 1

      // A div element containing all stats information about this team
      let teamDiv = document.createElement("div");

      // Create td elements for the robot counts and store them in robotTds
      // so we can update these robot counts later; maps robot type to count
      let initialRobotCount: Object = {};
      for (let robot of this.robots) {
        let td: HTMLTableCellElement = document.createElement("td");
        td.innerHTML = "0";
        initialRobotCount[robot] = td;
      }
      this.robotTds[teamID] = initialRobotCount;

      // Similarly create td elements for the VPs, bullet count, and tree count;
      // maps stat type to count
      let initialStats: Object = {};
      for (let stat of this.stats) {
        initialStats[stat] = document.createElement("td");
        initialStats[stat].innerHTML = 0;
      }
      this.statTds[teamID] = initialStats;

      // Add the team name banner, the robot count table, and the stats table
      teamDiv.appendChild(this.teamHeaderNode(teamName, inGameID));
      teamDiv.appendChild(this.robotTable(teamID, inGameID));
      teamDiv.appendChild(this.overallStatsTable(teamID, inGameID));
      teamDiv.appendChild(document.createElement("br"));
      teamDiv.appendChild(document.createElement("br"));

      this.div.appendChild(teamDiv);
    }

    this.div.appendChild(this.matches);
  }

  /**
   * Change the robot count on the stats bar
   */
  setRobotCount(teamID: number, robotType: schema.BodyType, count: number) {
    let td: HTMLTableCellElement = this.robotTds[teamID][robotType];
    td.innerHTML = String(count);
  }

  /**
   * Change the victory points of the given team
   */
  setVPs(teamID: number, count: number) {
    let td: HTMLTableCellElement = this.statTds[teamID]["Victory Points"];
    td.innerHTML = String(count);
  }

  /**
   * Change the bullets of the given team
   */
  setBullets(teamID: number, count: number) {
    let td: HTMLTableCellElement = this.statTds[teamID]["Bullets"];
    td.innerHTML = count.toFixed(2);
  }
}
