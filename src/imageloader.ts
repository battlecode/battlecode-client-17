import {Config} from './config';

type Image = HTMLImageElement;

export type AllImages = {
  background: Image,
  unknown: Image,
  tree: {
    fullHealth: Image,
    lowHealth: Image,
    sapling: Image,
  },
  bullet: {
    fast: Image,
    medium: Image,
    slow: Image,
  },
  robot: {
    archon: Array<Image>,
    gardener: Array<Image>,
    lumberjack: Array<Image>,
    scout: Array<Image>,
    soldier: Array<Image>,
    tank: Array<Image>,
    bulletTree: Array<Image>
  },
  controls: {
    goNext: Image,
    goPrevious: Image,
    playbackPause: Image,
    playbackStart: Image,
    playbackStop: Image,
    seekBackward: Image,
    seekForward: Image,
    skipBackward: Image,
    skipForward: Image,
    matchForward: Image,
    matchBackward: Image,
    upload: Image
  }
};

export function loadAll(config: Config, finished: (AllImages) => void) {
  let expected = 0, loaded = 0;
  let result: any = {tree: {}, bullet: {}, robot: {archon: [], gardener: [], lumberjack: [], scout: [], soldier: [], tank: [], bulletTree: []}, controls: {}};

  // write loaded image to obj[slot]
  function img(obj, slot, url: string) {
    // we expect another one
    expected++;
    let image = new Image();
    image.onload = () => {
      obj[slot] = image;
      // hey, we found it
      loaded++;
      if (loaded === expected) {
        console.log('All images loaded.');
        finished(Object.freeze(result) as AllImages);
      }
    };
    image.onerror = () => {
      loaded++;
      console.log(`CANNOT LOAD IMAGE: ${url}`);
      if (loaded === expected) {
        console.log('All images loaded.');
        finished(Object.freeze(result) as AllImages);
      }
    }
    image.src = url;
  }

  img(result, 'background', require('./img/map/tiled_1.jpg'));
  img(result, 'unknown', require('./img/sprites/unknown.png'));

  img(result.tree, 'fullHealth', require('./img/map/full_health_tree.png'));
  img(result.tree, 'lowHealth', require('./img/map/low_health_tree.png'));
  img(result.tree, 'sapling', require('./img/map/sapling.png'));

  img(result.bullet, 'fast', require('./img/bullets/bullet_fast.png'));
  img(result.bullet, 'medium', require('./img/bullets/bullet_medium.png'));
  img(result.bullet, 'slow', require('./img/bullets/bullet_slow.png'));

  // these are the teams we expect robots to be in according to current
  // battlecode-server
  // TODO(jhgilles):
  // we'll need to update them if team configuration becomes more dynamic
  img(result.robot.archon, 0, require('./img/sprites/archon_neutral.png'));
  img(result.robot.archon, 1, require('./img/sprites/archon_red.png'));
  img(result.robot.archon, 2, require('./img/sprites/archon_blue.png'));
  img(result.robot.bulletTree, 0, require('./img/sprites/bullet_tree_neutral.png'));
  img(result.robot.bulletTree, 1, require('./img/sprites/bullet_tree_red.png'));
  img(result.robot.bulletTree, 2, require('./img/sprites/bullet_tree_blue.png'));
  img(result.robot.gardener, 0, require('./img/sprites/gardener_neutral.png'));
  img(result.robot.gardener, 1, require('./img/sprites/gardener_red.png'));
  img(result.robot.gardener, 2, require('./img/sprites/gardener_blue.png'));
  img(result.robot.lumberjack, 0, require('./img/sprites/lumberjack_neutral.png'));
  img(result.robot.lumberjack, 1, require('./img/sprites/lumberjack_red.png'));
  img(result.robot.lumberjack, 2, require('./img/sprites/lumberjack_blue.png'));
  img(result.robot.scout, 0, require('./img/sprites/scout_neutral.png'));
  img(result.robot.scout, 1, require('./img/sprites/scout_red.png'));
  img(result.robot.scout, 2, require('./img/sprites/scout_blue.png'));
  img(result.robot.soldier, 0, require('./img/sprites/soldier_neutral.png'));
  img(result.robot.soldier, 1, require('./img/sprites/soldier_red.png'));
  img(result.robot.soldier, 2, require('./img/sprites/soldier_blue.png'));
  img(result.robot.tank, 0, require('./img/sprites/tank_neutral.png'));
  img(result.robot.tank, 1, require('./img/sprites/tank_red.png'));
  img(result.robot.tank, 2, require('./img/sprites/tank_blue.png'));

  img(result.controls, 'goNext', require('./img/controls/go-next.png'));
  img(result.controls, 'goPrevious', require('./img/controls/go-previous.png'));
  img(result.controls, 'playbackPause', require('./img/controls/playback-pause.png'));
  img(result.controls, 'playbackStart', require('./img/controls/playback-start.png'));
  img(result.controls, 'playbackStop', require('./img/controls/playback-stop.png'));
  img(result.controls, 'seekBackward', require('./img/controls/seek-backward.png'));
  img(result.controls, 'seekForward', require('./img/controls/seek-forward.png'));
  img(result.controls, 'skipBackward', require('./img/controls/skip-backward.png'));
  img(result.controls, 'skipForward', require('./img/controls/skip-forward.png'));
  img(result.controls, 'matchBackward', require('./img/controls/skip-backward.png'));
  img(result.controls, 'matchForward', require('./img/controls/skip-forward.png'));
  img(result.controls, 'upload', require('./img/controls/upload.png'));
}


