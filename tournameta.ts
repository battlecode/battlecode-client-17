// THIS SCRIPT SHOULD NOT BE BUNDLED
// IT'S JUST A SCRIPT
import {Tournament, readTournament} from './src/tournament';
import {schema, flatbuffers} from 'battlecode-playback';
import {ungzip} from 'pako';
import * as path from 'path';
import * as fs from 'fs';

var outstanding = 0;
var lengths = new Array<Array<number>>();

var parseLengths = (tournament: Tournament) => {
  if (outstanding >= 64) {
    setTimeout(() => parseLengths(tournament), 200);
    return;
  }

  outstanding++;

  const ri = tournament.roundIndex;
  const gi = tournament.gameIndex;

  function dealWith(length) {
    outstanding--;
    if (lengths[ri] == null) {
      lengths[ri] = [];
    }
    lengths[ri][gi] = length;
    //console.warn(ri, gi, length);
  }

  if (tournament.current().team2_name == "BYE") {
    dealWith(0);
  } else {
    tournament.readCurrent((err, game) => {
      if (err != null) throw err;
      if (game == null) throw new Error("NULL GAME?");

      const ungzipped = ungzip(new Uint8Array(game));
      const wrapper = schema.GameWrapper.getRootAsGameWrapper(
        new flatbuffers.ByteBuffer(ungzipped)
      );

      dealWith(wrapper.eventsLength());
    });
  }

  if (tournament.hasNext() && tournament.roundIndex < tournament.rounds - 1) {
    console.log(tournament.gameIndex, tournament.roundIndex);
    tournament.next();
    parseLengths(tournament);
  } else {
    console.log(JSON.stringify(lengths));
  }
}

readTournament('./seeding', (err, tournament) => {
  if (err != null) {
    throw err;
  }
  if (tournament == null) {
    throw new Error("Null tournament???");
  }
  console.log("Parsing "+tournament.rounds+" rounds, "+tournament.roundLengths);

  parseLengths(tournament);
});

