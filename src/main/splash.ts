import {Config} from '../config';
import {Tournament, TournamentGame} from '../tournament';

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
  private static subHeader: HTMLDivElement = document.createElement("div");
  private static columnLeft: HTMLDivElement = document.createElement("div");
  private static columnRight: HTMLDivElement = document.createElement("div");
  private static columnCenter: HTMLDivElement = document.createElement("div");

  // Team elements to modify every time we change the screen
  private static avatarA: HTMLImageElement = document.createElement("img");
  private static avatarB: HTMLImageElement = document.createElement("img");
  private static nameAndIDA: HTMLSpanElement = document.createElement("span");
  private static nameAndIDB: HTMLSpanElement = document.createElement("span");

  // HACKS
  private static winnerScreen: HTMLDivElement = document.createElement("div");
  private static winnerContainer: HTMLDivElement = document.createElement("div");
  private static winnerLoaded: boolean = false;

  private static winnerHeader: HTMLDivElement = document.createElement("div");
  private static winnerAvatar: HTMLImageElement = document.createElement("img");
  private static winnerExtra: HTMLDivElement = document.createElement("div");

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
      Splash.subHeader.className = "tournament-subheader";

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
      Splash.container.appendChild(Splash.subHeader);
      Splash.container.appendChild(document.createElement("br"));
      Splash.container.appendChild(Splash.columnLeft);
      Splash.container.appendChild(Splash.columnCenter);
      Splash.container.appendChild(Splash.columnRight);

      Splash.screen.appendChild(Splash.container);
      Splash.loaded = true;
    }
  }

  /**
   * Loads the HTML structure of the screen just once.
   * Modifies the team elements directly after that.
   */
  private static loadWinnerScreen(): void {
    if (!Splash.winnerLoaded) {
      Splash.winnerScreen.className = "blackout";
      Splash.winnerContainer.className = "blackout-container";

      // Put everything together
      Splash.winnerContainer.appendChild(Splash.winnerHeader);
      Splash.winnerContainer.appendChild(document.createElement("br"));
      Splash.winnerContainer.appendChild(Splash.winnerAvatar);
      Splash.winnerContainer.appendChild(document.createElement('br'));
      Splash.winnerContainer.appendChild(Splash.winnerExtra);

      Splash.winnerScreen.appendChild(Splash.winnerContainer);
      Splash.winnerLoaded = true;
    }
  }

  /**
   * "Round m of n". Display "Quarterfinals", "Semifinals", and "Finals"
   * accordingly.
   */
  private static getBracketString(tournament: Tournament): string {
    if (tournament.desc.type == "single-elimination") {
      const difference = tournament.rounds - tournament.roundIndex;
      switch(difference) {
        case 0: return "Finals (Top 2)";
        case 1: return "Semifinals (Top 4)";
        case 2: return "Quarterfinals (Top 8)";
        default: return `Round ${tournament.roundIndex} of ${tournament.rounds}`;
      }
    } else {
      // SHRUG EMOJI
      return tournament.desc.rounds[tournament.roundIndex].name;
    }
  }

  static addScreen(conf: Config, root: HTMLElement, game: TournamentGame, tournament: Tournament, maxRound: number): void {
    if (!conf.tournamentGetAvatar) throw new Error("Can't splash like that");

    this.loadScreen();

    this.header.innerText = this.getBracketString(tournament);
    this.subHeader.innerText = `Game ${tournament.gameIndex+1} of ${tournament.roundLengths[tournament.roundIndex]}`;

    this.avatarA.src = conf.tournamentGetAvatar(game.team1_id) || "";
    this.nameAndIDA.innerText = `${game.team1_name} (#${game.team1_id})`;
    if (game.team2_name == "BYE") {
      this.avatarB.src = require('../static/img/gray.jpg');
      this.nameAndIDB.innerText = "No opponent"
    } else {
      this.avatarB.src = conf.tournamentGetAvatar(game.team2_id) || "";
      this.nameAndIDB.innerText = `${game.team2_name} (#${game.team2_id})`;
    }

    root.appendChild(this.screen)
  }

  static addWinnerScreen(conf: Config, root: HTMLElement, game: TournamentGame, winner: 'A' | 'B') {
    if (!conf.tournamentGetAvatar) throw new Error("Can't splash like that");

    this.loadWinnerScreen();

    if (winner == 'A' || game.team2_name == 'BYE') {
      this.winnerHeader.innerText = `${game.team1_name} (#${game.team1_id}) wins!`;
      this.winnerHeader.className = "tournament-header red";
      this.winnerAvatar.className = "big-avatar red";
      this.winnerAvatar.src = conf.tournamentGetAvatar(game.team1_id);
    } else if (winner == 'B') {
      this.winnerHeader.innerText = `${game.team2_name} (#${game.team2_id}) wins!`;
      this.winnerHeader.className = "tournament-header blue";
      this.winnerAvatar.className = "big-avatar blue";
      this.winnerAvatar.src = conf.tournamentGetAvatar(game.team2_id);
    }
    if (game.team2_name == 'BYE') {
      this.winnerExtra.innerText = "(by default)";
    } else {
      this.winnerExtra.innerText = "";
    }
    root.appendChild(this.winnerScreen);
  }

  static removeScreen() {
    Splash.screen.remove();
    Splash.winnerScreen.remove();
  }
}

window['Splash'] = Splash;
