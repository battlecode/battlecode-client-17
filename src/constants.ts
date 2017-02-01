import {schema} from 'battlecode-playback';
import {Symmetry} from './mapeditor/index';

// Body types
export const ARCHON = schema.BodyType.ARCHON;
export const GARDENER = schema.BodyType.GARDENER;
export const LUMBERJACK = schema.BodyType.LUMBERJACK;
export const SOLDIER = schema.BodyType.SOLDIER;
export const TANK = schema.BodyType.TANK;
export const SCOUT = schema.BodyType.SCOUT;
export const TREE_BULLET = schema.BodyType.TREE_BULLET;
export const TREE_NEUTRAL = schema.BodyType.TREE_NEUTRAL;
export const NONE = schema.BodyType.NONE;

// Game canvas rendering sizes
export const BULLET_SIZE = .5;
export const BULLET_SIZE_HALF = BULLET_SIZE / 2;
export const INDICATOR_DOT_SIZE = .5;
export const INDICATOR_LINE_WIDTH = .4;
export const HEALTH_BAR_HEIGHT = .3;
export const HEALTH_BAR_WIDTH = 2;
export const HEALTH_BAR_WIDTH_HALF = HEALTH_BAR_WIDTH / 2;
export const SIGHT_RADIUS_LINE_WIDTH = .15

// Game canvas rendering parameters
export const HIGH_SPEED_THRESH = (4*4) - .00001;
export const MED_SPEED_THRESH = (2*2) - .00001;

// Map editor canvas parameters
export const DELTA = .0001;
export const ARCHON_RADIUS = 2;
export const MIN_TREE_RADIUS = 0.5;
export const MAX_TREE_RADIUS = 10;
export const MIN_DIMENSION = 30;
export const MAX_DIMENSION = 100;

// Server settings
export const NUMBER_OF_TEAMS = 2;
export const MIN_NUMBER_OF_ARCHONS = 1;
export const MAX_NUMBER_OF_ARCHONS = 3;
export const MAX_ROUND_NUM = 3000;
export const VICTORY_POINT_THRESH = 1000;

// Other constants
export const BULLET_THRESH = 10000;

// Maps available in the server.
export const SERVER_MAPS = [
  "Barrier",
  "DenseForest",
  "Enclosure",
  "Hurdle",
  "LineOfFire",
  "MagicWood",
  "shrine",
  "SparseForest",
  "Arena",
  "Barbell",
  "Boxed",
  "Bullseye",
  "Chess",
  "Clusters",
  "Cramped",
  "CrossFire",
  "DigMeOut",
  "GiantForest",
  "LilForts",
  "Maniple",
  "MyFirstMap",
  "OMGTree",
  "PasscalsTriangles",
  "Shrubbery",
  "Sprinkles",
  "Standoff",
  "Waves",
  "1337Tree",
  "Aligned",
  "Alone",
  "Blitzkrieg",
  "BugTrap",
  "Captive",
  "Caterpillar",
  "Chevron",
  "Conga",
  "CropCircles",
  "Croquembouche",
  "DarkSide",
  "DeathStar",
  "Defenseless",
  "Fancy",
  "FlappyTree",
  "Grass",
  "GreatDekuTree",
  "GreenHouse",
  "HedgeMaze",
  "HiddenTunnel",
  "HouseDivided",
  "Interference",
  "Lanes",
  "Levels",
  "LilMaze",
  "Misaligned",
  "ModernArt",
  "Ocean",
  "Oxygen",
  "PacMan",
  "PeacefulEncounter",
  "Planets",
  "Present",
  "PureImagination",
  "Shortcut",
  "Slant",
  "Snowflake",
  "TheOtherSide",
  "TicTacToe",
  "TreeFarm",
  "Turtle",
  "Whirligig"
];

export function bodyTypeToString(bodyType: schema.BodyType) {
  switch(bodyType) {
    case ARCHON:      return "archon";
    case GARDENER:    return "gardener";
    case LUMBERJACK:  return "lumberjack";
    case SOLDIER:     return "soldier";
    case TANK:        return "tank";
    case SCOUT:       return "scout";
    case TREE_BULLET: return "bulletTree";
    case NONE:        return "";
    default:          throw new Error("invalid body type");
  }
}

export function symmetryToString(symmetry: Symmetry) {
  switch(symmetry) {
    case Symmetry.ROTATIONAL: return "Rotational";
    case Symmetry.HORIZONTAL: return "Horizontal";
    case Symmetry.VERTICAL:   return "Vertical";
    default:         throw new Error("invalid symmetry");
  }
}

export function radiusFromBodyType(bodyType: schema.BodyType) {
  switch(bodyType) {
    case ARCHON:       return 2;
    case GARDENER:     return 1;
    case LUMBERJACK:   return 1;
    case SOLDIER:      return 1;
    case TANK:         return 2;
    case SCOUT:        return 1;
    case TREE_BULLET:  return 1;
    case NONE:         return 0;
    default:           throw new Error("invalid body type");
  }
}