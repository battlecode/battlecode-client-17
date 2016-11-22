/**
* Loads game stats: team name, victory points, bullets, robot count
*/
export default class Stats {

  div: HTMLDivElement = document.createElement("div");
  teams: Object = {};

  constructor() {
    /**
    *TEAM NAME
    *Victory Points
    *Bullets:
    *Robot Count:
    */
    let teamNames = ["HAGS", "BATTLECODE"];
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
      let teamNameNode = document.createTextNode(teamName);
      title.appendChild(teamNameNode);
      div.appendChild(title);
      div.appendChild(this.teams[teamName].points);
      div.appendChild(this.teams[teamName].bullets);
      div.appendChild(this.teams[teamName].robots);

      this.div.appendChild(div);
    }
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
