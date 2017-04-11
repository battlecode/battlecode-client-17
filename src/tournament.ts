import {path, fs} from './electron-modules';

export function readTournament(dir: string, cb: (err: Error | null, t: Tournament | null) => void) {
  /*if (!process.env.ELECTRON) {
    cb(new Error("Can't read tournaments outside of electron"), null);
    return;
  }*/

  const desc_file = path.join(dir, 'tournament.json');

  fs.readFile(desc_file, 'utf8', (err, data) => {
    if (err) {
      cb(err, null);
      return;
    }
    
    var tournament;
    try {
      tournament = new Tournament(dir, JSON.parse(data));
    } catch (e) {
      cb(e, null);
      return;
    }
    cb(null, tournament);
  });
}

// Use like a "cursor" into a tournament.
// It's a bit awkward.
export class Tournament {
  readonly dir: string;
  readonly desc: TournamentDesc;

  // these are distinct from the "ids" in the desc;
  // they're just cursors in the list of matches.
  roundIndex: number;
  gameIndex: number;

  readonly rounds: number;
  readonly roundLengths: number[];

  constructor(dir: string, desc: TournamentDesc) {
    this.dir = dir;
    this.desc = desc;  
    this.roundIndex = 0;
    this.gameIndex = 0;
    this.rounds = desc.rounds.length;
    this.roundLengths = desc.rounds.map((round) => round.games.length);
    this.desc.seeds.forEach((seed) => {
      if (seed.name == "BYE") {
        throw new Error("Team has name BYE, everything is broken");
      }
    });
  }

  seek(roundIndex: number, gameIndex: number) {
    if (roundIndex < this.rounds && gameIndex < this.roundLengths[roundIndex]) {
      this.roundIndex = roundIndex;
      this.gameIndex = gameIndex;
    } else {
      throw new Error("Out of bounds: "+roundIndex+","+gameIndex);
    }
  }

  hasNext(): boolean {
    return this.roundIndex < this.rounds && this.gameIndex < this.roundLengths[this.roundIndex];
  }

  next() {
    if (!this.hasNext()) {
      throw new Error("No more games!");
    }
    this.gameIndex++;
    if (this.gameIndex >= this.roundLengths[this.roundIndex]) {
      this.gameIndex = 0;
      this.roundIndex++;
    }
  }

  hasPrev(): boolean {
    return this.roundIndex > 0 || this.gameIndex > 0;
  }

  prev() {
    if (!this.hasPrev()) {
      throw new Error("No previous games!");
    }
    this.gameIndex--;
    if (this.gameIndex < 0) {
      this.roundIndex--;
      this.gameIndex = this.roundLengths[this.roundIndex];
    }
  }

  current(): TournamentGame {
    if (this.roundIndex > this.rounds || this.gameIndex > this.roundLengths[this.roundIndex]) {
      throw new Error(`BAD COMBO: ROUND ${this.roundIndex}, ${this.gameIndex}`);
    }
    if (this.desc.rounds[this.roundIndex] == undefined) {
      throw new Error("Undefined round?? "+this.roundIndex);
    }
    return this.desc.rounds[this.roundIndex].games[this.gameIndex];
  }

  readCurrent(cb: (err: Error | null, match: ArrayBuffer | null) => void) {
    const current = this.current();
    if (current.match_file) {
      fs.readFile(path.join(this.dir, current.match_file), (err, data) => {
        if (err) {
          cb(err, null);
          return;
        }

        cb(null, data.buffer);
      });
    } else {
      process.nextTick(cb, new Error("No match file for BYE"), null);
    }
  }
}

export interface TournamentGame {
  /** unique (in tournament) game id */
  id: number,
  round: number,
  match_file: string | null,
  maps: string,

  team1_id: number,
  team1_name: string,
  team2_id: number,
  team2_name: string,

  winner_id: number,

  // the game ids where the winner and loser came from
  winner_from: number,
  loser_from: number,

}

export interface TournamentRound {
  name: string,
  games: [TournamentGame]
}

export interface TournamentSeed {
  seed: number,
  id: number,
  name: string
}

export interface TournamentDesc {
  name: string,
  type: "single-elimination",
  seeds: TournamentSeed[],
  rounds: TournamentRound[]
}
