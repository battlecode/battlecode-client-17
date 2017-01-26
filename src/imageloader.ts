import {Config} from './config';

type Image = HTMLImageElement;

export type AllImages = {
  background: Image,
  unknown: Image,
  star: Image,
  tree: {
    fullHealth: Image,
    lowHealth: Image,
    sapling: Image,
    bullets: Image,
    robot: Image
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

  const dirname = "./static/img/";

  img(result, 'background', require(dirname + 'map/tiled_1.jpg'));
  img(result, 'unknown', require(dirname + 'sprites/unknown.png'));
  img(result, 'star', require(dirname + 'yellow_star.png'));

  img(result.tree, 'fullHealth', require(dirname + 'map/full_health_tree.png'));
  img(result.tree, 'lowHealth', require(dirname + 'map/low_health_tree.png'));
  img(result.tree, 'sapling', require(dirname + 'map/sapling.png'));
  img(result.tree, 'bullets', require(dirname + 'map/tree_bullets.png'));
  img(result.tree, 'robot', require(dirname + 'map/tree_robots.png'));

  img(result.bullet, 'fast', require(dirname + 'bullets/bullet_fast.png'));
  img(result.bullet, 'medium', require(dirname + 'bullets/bullet_medium.png'));
  img(result.bullet, 'slow', require(dirname + 'bullets/bullet_slow.png'));

  // these are the teams we expect robots to be in according to current
  // battlecode-server
  // TODO(jhgilles):
  // we'll need to update them if team configuration becomes more dynamic
  img(result.robot.archon, 0, require(dirname + 'sprites/archon_neutral.png'));
  img(result.robot.archon, 1, require(dirname + 'sprites/archon_red.png'));
  img(result.robot.archon, 2, require(dirname + 'sprites/archon_blue.png'));
  img(result.robot.bulletTree, 0, require(dirname + 'sprites/bullet_tree_neutral.png'));
  img(result.robot.bulletTree, 1, require(dirname + 'sprites/bullet_tree_red.png'));
  img(result.robot.bulletTree, 2, require(dirname + 'sprites/bullet_tree_blue.png'));
  img(result.robot.gardener, 0, require(dirname + 'sprites/gardener_neutral.png'));
  img(result.robot.gardener, 1, require(dirname + 'sprites/gardener_red.png'));
  img(result.robot.gardener, 2, require(dirname + 'sprites/gardener_blue.png'));
  img(result.robot.lumberjack, 0, require(dirname + 'sprites/lumberjack_neutral.png'));
  img(result.robot.lumberjack, 1, require(dirname + 'sprites/lumberjack_red.png'));
  img(result.robot.lumberjack, 2, require(dirname + 'sprites/lumberjack_blue.png'));
  img(result.robot.scout, 0, require(dirname + 'sprites/scout_neutral.png'));
  img(result.robot.scout, 1, require(dirname + 'sprites/scout_red.png'));
  img(result.robot.scout, 2, require(dirname + 'sprites/scout_blue.png'));
  img(result.robot.soldier, 0, require(dirname + 'sprites/soldier_neutral.png'));
  img(result.robot.soldier, 1, require(dirname + 'sprites/soldier_red.png'));
  img(result.robot.soldier, 2, require(dirname + 'sprites/soldier_blue.png'));
  img(result.robot.tank, 0, require(dirname + 'sprites/tank_neutral.png'));
  img(result.robot.tank, 1, require(dirname + 'sprites/tank_red.png'));
  img(result.robot.tank, 2, require(dirname + 'sprites/tank_blue.png'));

  img(result.controls, 'goNext', require(dirname + 'controls/go-next.png'));
  img(result.controls, 'goPrevious', require(dirname + 'controls/go-previous.png'));
  img(result.controls, 'playbackPause', require(dirname + 'controls/playback-pause.png'));
  img(result.controls, 'playbackStart', require(dirname + 'controls/playback-start.png'));
  img(result.controls, 'playbackStop', require(dirname + 'controls/playback-stop.png'));
  img(result.controls, 'matchBackward', require(dirname + 'controls/skip-backward.png'));
  img(result.controls, 'matchForward', require(dirname + 'controls/skip-forward.png'));
  img(result.controls, 'upload', require(dirname + 'controls/upload.png'));
}


