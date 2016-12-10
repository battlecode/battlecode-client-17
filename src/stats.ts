import * as imageloader from './imageloader';

/**
* Loads game stats: team name, victory points, bullets, robot count
*/
export default class Stats {

  div: HTMLDivElement;

  robotTds: Object[] = [Object, Object];
  statTds: Object[] = [Object, Object];
  images: imageloader.AllImages;

  readonly stats: string[] = ["Bullets", "Victory Points"];
  readonly colors: string[] = ["red", "blue"];
  readonly robots: string[] = ["archon", "gardener", "lumberjack", "recruit",
                               "scout", "soldier", "tank"];

  constructor(teamNames: string[], images: imageloader.AllImages) {
    this.images = images;
    this.div = this.baseDiv();
    this.div.appendChild(this.battlecodeLogo());

    for (var teamID = 0; teamID < teamNames.length; teamID++) {
      // Add the team name banner
      this.div.appendChild(this.teamHeaderNode(teamNames[teamID], this.colors[teamID]));

      // Create td elements for the robot counts and store them in robotTds
      // so we can update these robot counts later
      let initialRobotCount: Object = {};
      for (let robot of this.robots) {
        let td: HTMLTableCellElement = document.createElement("td");
        td.innerHTML = "0";
        initialRobotCount[robot] = td;
      }
      this.robotTds[teamID] = initialRobotCount;

      // Similarly create td elements for the VPs, bullet count, and tree count
      let initialStats: Object = {};
      for (let stat of this.stats) {
        initialStats[stat] = document.createElement("td");
        initialStats[stat].innerHTML = 0;
      }
      this.statTds[teamID] = initialStats;

      this.div.appendChild(this.robotTable(teamID));
      this.div.appendChild(this.overallStatsTable(teamID));

      this.div.appendChild(document.createElement("br"));
      this.div.appendChild(document.createElement("br"));
    }
  }

  /**
   * Initializes the styles for the stats div
   */
  baseDiv() {
    let div = document.createElement("div");

    // Positioning
    div.style.height = "100%";
    div.style.width = "300px";
    div.style.position = "fixed";
    div.style.zIndex = "1";
    div.style.top = "0";
    div.style.left = "0";
    div.style.overflowX = "hidden";

    // Inner style
    div.style.backgroundColor = "#000";
    div.style.color = "white";
    div.style.textAlign = "center";
    div.style.fontSize = "16px";
    div.style.fontFamily = "Bungee";

    // Inner formatting
    div.style.padding = "10px";

    return div;
  }

  /**
   * Battlecode logo or title, at the top of the stats bar
   */
  battlecodeLogo() {
    let logo: HTMLDivElement = document.createElement("div");
    logo.style.fontWeight = "bold";
    logo.style.fontSize = "40px";
    logo.style.textAlign = "center";
    logo.style.fontFamily = "Bungee";

    logo.style.paddingTop = "15px";
    logo.style.paddingBottom = "15px";

    let text = document.createTextNode("Battlecode");
    logo.appendChild(text);
    return logo;
  }

  /**
   * Colored banner labeled with the given teamName
   */
  teamHeaderNode(teamName: string, color: string) {
    let teamHeader: HTMLDivElement = document.createElement("div");
    teamHeader.style.padding = "14px";
    teamHeader.style.fontSize = "20px";
    teamHeader.style.marginTop = "5px";
    teamHeader.style.marginBottom = "10px";

    let teamNameNode = document.createTextNode(teamName);
    teamHeader.style.backgroundColor = color;
    teamHeader.appendChild(teamNameNode);
    return teamHeader;
  }

  /**
   * Create the table that displays the robot images along with their counts.
   * Uses the teamID to decide which color image to display.
   */
  robotTable(teamID: number) {
    let teamColor: string = this.colors[teamID];
    let table: HTMLTableElement = document.createElement("table");
    table.setAttribute("align", "center");

    // Create the table row with the robot images
    let robotImages: HTMLTableRowElement = document.createElement("tr");
    for (let robot of this.robots) {
      let td: HTMLTableCellElement = document.createElement("td");
      td.appendChild(this.images.robot[robot][teamID]);
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


  overallStatsTable(teamID: number) {
    let teamColor: string = this.colors[teamID];
    let table: HTMLTableElement = document.createElement("table");
    table.setAttribute("align", "center");
    table.style.marginTop = "10px";

    // Create a table row for each stat
    for (let stat of this.stats) {
      let tr: HTMLTableRowElement = document.createElement("tr");

      let tdLabel: HTMLTableCellElement = document.createElement("td");
      tdLabel.appendChild(document.createTextNode(stat));
      tdLabel.style.fontFamily = "Bungee";
      tdLabel.style.color = this.colors[teamID];
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

  /**
   * Change the robot count on the stats bar
   */
  setRobotCount(teamID: number, robotType: string, count: number) {
    let td: HTMLTableCellElement = this.robotTds[teamID][robotType];
    td.innerHTML = String(count);
  }

  /**
   * Change the count on the stats bar
   * @param stat "Victory Points" or "Bullets"
   */
  setTeamStat(teamID: number, stat: string, count: number) {
    let td: HTMLTableCellElement = this.statTds[teamID][stat];
    td.innerHTML = String(count);
  }
}
