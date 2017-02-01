import {Config} from '../../config';
import * as cst from '../../constants';
import {AllImages} from '../../imageloader';
import {Scorecard} from '../index';

import {schema} from 'battlecode-playback';

const hex: Object = {
  1: "#db3627",
  2: "#4f7ee6"
};

export type StatBar = {
  bar: HTMLDivElement,
  label: HTMLSpanElement
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
  private readonly teams: HTMLDivElement;
  private readonly images: AllImages;

  // Key is the team ID
  private robotTds: Object = {}; // Secondary key is robot type
  private statBars: Map<number, { bullets: StatBar, vps: StatBar }>;
  private statsTableElement: HTMLTableElement;

  // Scorecard for tournaments
  private redID: number;
  private blueID: number;
  private scorecard: Scorecard = new Scorecard();

  // Note: robot types and number of teams are currently fixed regardless of
  // match info. Keep in mind if we ever change these, or implement this less
  // statically.

  readonly robots: schema.BodyType[] = [
    cst.ARCHON, cst.GARDENER, cst.LUMBERJACK, cst.SOLDIER, cst.TANK, cst.SCOUT, cst.TREE_BULLET
  ];

  constructor(conf: Config, images: AllImages) {
    this.images = images;

    this.div = document.createElement("div");
    this.teams = document.createElement("div");
    this.div.appendChild(this.teams);
    this.div.appendChild(this.scorecard.div);

    let teamNames: Array<string> = ["?????", "?????"];
    let teamIDs: Array<number> = [1, 2];
    this.statsTableElement = document.createElement("table");
    this.initializeGame(teamNames, teamIDs);
  }

  /**
   * Colored banner labeled with the given teamName
   */
  private teamHeaderNode(teamName: string, inGameID: number, avatar?: string) {
    let teamHeader: HTMLDivElement = document.createElement("div");
    teamHeader.className += ' teamHeader';

    if (avatar) {
      let teamAvatarNode = document.createElement('img');
      teamAvatarNode.src = avatar;
      teamAvatarNode.className = "teamAvatar";
      let teamAvatarDiv = document.createElement('div');
      teamAvatarDiv.appendChild(teamAvatarNode);
      teamHeader.appendChild(teamAvatarDiv);
    }

    let teamNameNode = document.createTextNode(teamName);
    teamHeader.style.backgroundColor = hex[inGameID];
    teamHeader.appendChild(teamNameNode);
    return teamHeader;
  }

  /**
   * Create the table that displays the robot images along with their counts.
   * Uses the teamID to decide which color image to display.
   */
  private robotTable(teamID: number, inGameID: number): HTMLTableElement {
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

  private statsTable(teamIDs: Array<number>): HTMLTableElement {
    const table = document.createElement("table");
    const bars = document.createElement("tr");
    const counts = document.createElement("tr");
    const labels = document.createElement("tr");
    table.id = "stats-table";
    bars.id = "stats-bars";
    table.setAttribute("align", "center");

    // Add the bullet bars and labels
    teamIDs.forEach((id: number) => {
      const bar = document.createElement("td");
      bar.height = 150;
      bar.vAlign = "bottom";
      bar.appendChild(this.statBars.get(id).bullets.bar);
      bars.appendChild(bar);

      const count = document.createElement("td");
      count.appendChild(this.statBars.get(id).bullets.label);
      counts.appendChild(count);
    });

    // Add the VP bars and labels
    teamIDs.forEach((id: number) => {
      const bar = document.createElement("td");
      bar.height = 150;
      bar.vAlign = "bottom";
      bar.appendChild(this.statBars.get(id).vps.bar);
      bars.appendChild(bar);

      const count = document.createElement("td");
      count.appendChild(this.statBars.get(id).vps.label);
      counts.appendChild(count);
    });

    // Labels - "Bullets" and "Victory Points"
    const labelBullets = document.createElement("td");
    labelBullets.colSpan = 2;
    labelBullets.innerText = "Bullets";
    const labelVPs = document.createElement("td");
    labelVPs.colSpan = 2;
    labelVPs.innerText = "Victory Points";

    table.appendChild(bars);
    table.appendChild(counts);
    table.appendChild(labels);
    labels.appendChild(labelBullets);
    labels.appendChild(labelVPs);
    return table;
  }

  /**
   * Clear the current stats bar and reinitialize it with the given teams.
   */
  initializeGame(teamNames: Array<string>, teamIDs: Array<number>, teamAvatars?: Array<string>){
    // Remove the previous match info
    while (this.teams.firstChild) {
      this.teams.removeChild(this.teams.firstChild);
    }
    this.robotTds = {};
    this.statBars = new Map<number, { bullets: StatBar, vps: StatBar }>();

    // Store the team IDs as red and blue
    if (teamIDs.length >= 2) {
      this.redID = teamIDs[0];
      this.blueID = teamIDs[1];
    }

    // Populate with new info
    // Add a section to the stats bar for each team in the match
    for (var index = 0; index < teamIDs.length; index++) {
      // Collect identifying information
      let teamID = teamIDs[index];
      let teamName = teamNames[index];
      let teamAvatar = teamAvatars? teamAvatars[index] : undefined;
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

/*<<<<<<< HEAD
      // Similarly create td elements for the VPs, bullet count, and tree count;
      // maps stat type to count
      let initialStats: Object = {};
      for (let stat of this.stats) {
        initialStats[stat] = document.createElement("td");
        initialStats[stat].innerHTML = 0;
      }
      this.statTds[teamID] = initialStats;

      // Add the team name banner, the robot count table, and the stats table
      teamDiv.appendChild(this.teamHeaderNode(teamName, inGameID, teamAvatar));
      teamDiv.appendChild(this.robotTable(teamID, inGameID));
      teamDiv.appendChild(this.overallStatsTable(teamID, inGameID));
      /*teamDiv.appendChild(document.createElement("br"));
      teamDiv.appendChild(document.createElement("br"));*/
//=======*
      // Create the stat bar for bullets
      let bullets = document.createElement("div");
      bullets.className = "stat-bar";
      bullets.style.backgroundColor = hex[inGameID];
      let bulletsSpan = document.createElement("span");
      bulletsSpan.innerHTML = "0";

      // Create the stat bar for victory points
      let vps = document.createElement("div");
      vps.className = "stat-bar";
      vps.style.backgroundColor = hex[inGameID];
      let vpsSpan = document.createElement("span");
      vpsSpan.innerHTML = "0";

      // Store the stat bars
      this.statBars.set(teamID, {
        bullets: {
          bar: bullets,
          label: bulletsSpan
        },
        vps: {
          bar: vps,
          label: vpsSpan
        }
      });

      // Add the team name banner and the robot count table
      teamDiv.appendChild(this.teamHeaderNode(teamName, inGameID, teamAvatar));
      teamDiv.appendChild(this.robotTable(teamID, inGameID));
      teamDiv.appendChild(document.createElement("br"));
//>>>>>>> master

      this.teams.appendChild(teamDiv);
    }

    this.statsTableElement.remove();
    this.statsTableElement = this.statsTable(teamIDs);
    this.div.appendChild(this.statsTableElement);
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
    const statBar: StatBar = this.statBars.get(teamID).vps
    statBar.label.innerText = String(count);
    statBar.bar.style.height = `${100 * count / cst.VICTORY_POINT_THRESH}%`;

    if (this.images.star.parentNode === statBar.bar) {
      this.images.star.remove();
    }

    if (count >= cst.VICTORY_POINT_THRESH) {
      this.images.star.id = "star";
      statBar.bar.appendChild(this.images.star);
    }
  }

  /**
   * Change the bullets of the given team
   */
  setBullets(teamID: number, count: number) {
    const statBar: StatBar = this.statBars.get(teamID).bullets;
    statBar.label.innerText = String(count.toPrecision(5));
    statBar.bar.style.height = `${100 * count / cst.BULLET_THRESH}%`;
  }

  /**
   * Resets the scorecard to 0-0. Call this at the BEGINNING of a game.
   */
  resetScore(): void {
    this.scorecard.setScore(0, 0);
  }

  /**
   * Changes the scorecard by giving 1 point to the winning team of a match.
   * Call this at the END of each match. (we may have to invoke this manually? :/)
   */
  updateScore(winnerID: number) {
    if (winnerID === this.redID) {
      this.scorecard.incrementA();
    } else if (winnerID === this.blueID) {
      this.scorecard.incrementB();
    }
  }
}
