export type Team = {
  name: string,
  id: number,
  avatar: string, // external URL
};

/**
 * The splash screen for tournaments. Appears between every game (not match)
 * to show which two teams are coming up in which round.
 */
export default class Splash {

  private static screen: HTMLDivElement = document.createElement("div");
  private static container: HTMLDivElement = document.createElement("div");
  private static loaded: boolean = false;

  // Containers
  private static header: HTMLDivElement = document.createElement("div");
  private static columnLeft: HTMLDivElement = document.createElement("div");
  private static columnRight: HTMLDivElement = document.createElement("div");
  private static columnCenter: HTMLDivElement = document.createElement("div");

  // Team elements to modify every time we change the screen
  private static avatarA: HTMLImageElement = new Image();
  private static avatarB: HTMLImageElement = new Image();
  private static nameAndIDA: HTMLSpanElement = document.createElement("span");
  private static nameAndIDB: HTMLSpanElement = document.createElement("span");

  /**
   * Loads the HTML structure of the screen just once.
   * Modifies the team elements directly after that.
   */
  private static loadScreen(): void {
    if (!Splash.loaded) {
      Splash.screen.className = "blackout";
      Splash.container.className = "blackout-container";

      // Bracket string
      Splash.header.className = "tournament-header";

      // Team A information (red)
      Splash.columnLeft.className = "column-left";
      Splash.columnLeft.appendChild(Splash.avatarA);
      Splash.avatarA.className = "avatar red";
      Splash.columnLeft.appendChild(document.createElement("br"));
      Splash.columnLeft.appendChild(Splash.nameAndIDA);
      Splash.nameAndIDA.className = "red";

      // Center column (vs.)
      Splash.columnCenter.className = "column-center";
      Splash.columnCenter.appendChild(document.createTextNode("vs."));

      // Team B information (blue)
      Splash.columnRight.className = "column-right";
      Splash.columnRight.appendChild(Splash.avatarB);
      Splash.avatarB.className = "avatar blue";
      Splash.columnRight.appendChild(document.createElement("br"));
      Splash.columnRight.appendChild(Splash.nameAndIDB);
      Splash.nameAndIDB.className = "blue";

      // Put everything together
      Splash.container.appendChild(Splash.header);
      Splash.container.appendChild(document.createElement("br"));
      Splash.container.appendChild(Splash.columnLeft);
      Splash.container.appendChild(Splash.columnCenter);
      Splash.container.appendChild(Splash.columnRight);

      Splash.screen.appendChild(Splash.container);
      Splash.loaded = true;
    }
  }

  static addScreen(root: HTMLElement, teamA: Team, teamB: Team, text: string) {
    Splash.loadScreen();

    Splash.header.innerText = text;

    Splash.avatarA.src = teamA.avatar;
    Splash.nameAndIDA.innerText = `${teamA.name} (#${teamA.id})`;
    Splash.avatarB.src = teamB.avatar;
    Splash.nameAndIDB.innerText = `${teamB.name} (#${teamB.id})`;

    root.appendChild(Splash.screen);
  }

  static removeScreen() {
    Splash.screen.remove();
  }
}