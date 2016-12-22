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
    recruit: Array<Image>,
    scout: Array<Image>,
    soldier: Array<Image>,
    tank: Array<Image>,
    bulletTree: Array<Image>
  },
  controls: {
    pause: Image,
    start: Image,
    forward: Image,
    backward: Image,
    upload: Image
  }
};

export function loadAll(config: Config, finished: (AllImages) => void) {
  let expected = 0, loaded = 0;
  let result: any = {tree: {}, bullet: {}, robot: {archon: [], gardener: [], lumberjack: [], recruit: [], scout: [], soldier: [], tank: [], bulletTree: []}, controls: {}};

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
  img(result.robot.archon, 0, require('./img/sprites/archon_red.png'));
  img(result.robot.archon, 1, require('./img/sprites/archon_blue.png'));
  img(result.robot.archon, 2, require('./img/sprites/archon_neutral.png'));
  img(result.robot.bulletTree, 0, require('./img/sprites/bullet_tree_blue.png'));
  img(result.robot.bulletTree, 1, require('./img/sprites/bullet_tree_red.png'));
  img(result.robot.bulletTree, 2, require('./img/sprites/bullet_tree_neutral.png'));
  img(result.robot.gardener, 0, require('./img/sprites/gardener_red.png'));
  img(result.robot.gardener, 1, require('./img/sprites/gardener_blue.png'));
  img(result.robot.gardener, 2, require('./img/sprites/gardener_neutral.png'));
  img(result.robot.lumberjack, 0, require('./img/sprites/lumberjack_red.png'));
  img(result.robot.lumberjack, 1, require('./img/sprites/lumberjack_blue.png'));
  img(result.robot.lumberjack, 2, require('./img/sprites/lumberjack_neutral.png'));
  img(result.robot.recruit, 0, require('./img/sprites/recruit_red.png'));
  img(result.robot.recruit, 1, require('./img/sprites/recruit_blue.png'));
  img(result.robot.recruit, 2, require('./img/sprites/recruit_neutral.png'));
  img(result.robot.scout, 0, require('./img/sprites/scout_red.png'));
  img(result.robot.scout, 1, require('./img/sprites/scout_blue.png'));
  img(result.robot.scout, 2, require('./img/sprites/scout_neutral.png'));
  img(result.robot.soldier, 0, require('./img/sprites/soldier_red.png'));
  img(result.robot.soldier, 1, require('./img/sprites/soldier_blue.png'));
  img(result.robot.soldier, 2, require('./img/sprites/soldier_neutral.png'));
  img(result.robot.tank, 0, require('./img/sprites/tank_red.png'));
  img(result.robot.tank, 1, require('./img/sprites/tank_blue.png'));
  img(result.robot.tank, 2, require('./img/sprites/tank_neutral.png'));

  img(result.controls, 'pause', require('./img/controls/playback-pause.png'));
  img(result.controls, 'start', require('./img/controls/playback-start.png'));
  img(result.controls, 'forward', require('./img/controls/seek-forward.png'));
  img(result.controls, 'backward', require('./img/controls/seek-backward.png'));
  img(result.controls, 'upload', require('./img/controls/upload.png'));
}


