/**
* Loads game stats: team name, victory points, bullets, robot count
*/
export default class Stats {

  div: HTMLDivElement;

  teams: Object = {};

  constructor() {
    /**
    *TEAM NAME
    *Victory Points
    *Bullets:
    *Robot Count:
    */
    this.div = this.baseDiv();
    this.div.appendChild(this.battlecodeLogo());

    let teamNames = ["Chicken Pad Thai", "Vegetable Fried rice"];
    for (var i = 0; i < teamNames.length; i++) {
      let teamName = teamNames[i];
      this.teams[teamName] = {
        "points": this.titleValueNode("Points", "0"),
        "bullets": this.titleValueNode("Bullets", "100"),
        "robots": this.titleValueNode("Robot Count", "1")
      };

      let div = document.createElement("div");
      div.setAttribute("id", teamName);
      let title = document.createElement("h2");
      title.appendChild(this.teamHeaderNode(teamName, "red"));
      div.appendChild(title);
      div.appendChild(this.teams[teamName].points);
      div.appendChild(this.teams[teamName].bullets);
      div.appendChild(this.teams[teamName].robots);

      this.div.appendChild(div);
    }
  }

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
    div.style.backgroundColor = "#222222";
    div.style.color = "white";
    div.style.textAlign = "center";
    div.style.fontFamily = "Bungee";

    // Inner formatting
    div.style.padding = "10px";

    return div;
  }

  battlecodeLogo() {
    let logo: HTMLDivElement = document.createElement("div");
    logo.style.fontWeight = "bold";
    logo.style.fontSize = "40px";
    logo.style.textAlign = "center";

    let text = document.createTextNode("Battlecode");
    logo.appendChild(text);
    return logo;
  }

  teamHeaderNode(teamName: string, color: string) {
    let teamHeader: HTMLDivElement = document.createElement("div");
    teamHeader.style.padding = "14px";
    teamHeader.style.fontSize = "20px";
    teamHeader.style.marginTop = "5px";
    teamHeader.style.marginBottom = "10px";
    teamHeader.style.fontFamily = "Bungee";

    let teamNameNode = document.createTextNode(teamName);
    teamHeader.style.backgroundColor = color;
    teamHeader.appendChild(teamNameNode);
    return teamHeader;
  }

  robotTable() {

  }

  titleValueNode(title: string, value: string) {
    let span = document.createElement("span");
    let titleNode = document.createElement("b");
    let titleText = document.createTextNode(`\t${title}: `);
    titleNode.appendChild(titleText);
    let valueNode = document.createTextNode(value);
    span.appendChild(titleNode);
    span.appendChild(valueNode);
    return span;
  }

}
