export type Team = {
  name: string,
  id: number,
  avatar: string, // external URL
};

export default class Splash {

  private static screen: HTMLDivElement = document.createElement("div");
  private static container: HTMLDivElement = document.createElement("div");
  private static loaded: boolean = false;

  // Containers
  private static columnLeft: HTMLDivElement = document.createElement("div");
  private static columnRight: HTMLDivElement = document.createElement("div");
  private static columnCenter: HTMLDivElement = document.createElement("div");

  private static loadScreen(): void {
    if (!Splash.loaded) {
      Splash.screen.className = "blackout";
      Splash.container.className = "blackout-container";
      Splash.container.appendChild(document.createTextNode("A vs. B"))
      Splash.container.appendChild(document.createElement("br"));
      Splash.container.appendChild(document.createTextNode("Round bleh of blah"));

      Splash.screen.appendChild(Splash.container);
      Splash.loaded = true;
    }
  }

  static addScreen(root: HTMLElement, teamA: Team, teamB: Team, text: string) {
    Splash.loadScreen();
    root.appendChild(Splash.screen);
  }

  static removeScreen() {
    Splash.screen.remove();
  }
}