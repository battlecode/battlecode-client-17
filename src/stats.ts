import {Config} from './config';
import * as cst from './constants';
import {AllImages} from './imageloader';

import {schema} from 'battlecode-playback';

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

  // Key is the team ID, folllowed by the robot/stat type
  private robotTds: Object = {};
  private statTds: Object = {};

  // Note: robot types and number of teams are currently fixed regardless of
  // match info. Keep in mind if we ever change these, or implement this less
  // statically.
  private readonly stats: string[] = ["Bullets", "Victory Points"];
  private readonly robots: schema.BodyType[] = [
    cst.ARCHON, cst.GARDENER, cst.LUMBERJACK, cst.RECRUIT, cst.SOLDIER, cst.TANK, cst.SCOUT
  ];

  constructor(conf: Config, images: AllImages) {
    this.images = images;
    this.div = document.createElement("div");

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
      let robotName: string = this.bodyTypeToString(robot);
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

  private bodyTypeToString(bodyType: schema.BodyType) {
    switch(bodyType) {
      case cst.ARCHON: return "archon";
      case cst.GARDENER: return "gardener";
      case cst.LUMBERJACK: return "lumberjack";
      case cst.RECRUIT: return "recruit";
      case cst.SOLDIER: return "soldier";
      case cst.TANK: return "tank";
      case cst.SCOUT: return "scout";
      default:
        throw new Error("invalid body type");
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
