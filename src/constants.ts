import {schema} from 'battlecode-playback';
import {Symmetry} from './mapeditor/renderer';

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

// Game canvas rendering parameters
export const HIGH_SPEED_THRESH = (2*2) - .00001;
export const MED_SPEED_THRESH = (1.5*1.5) - .00001;

// Map editor canvas parameters
export const DELTA = .0001;
export const ARCHON_RADIUS = 2;
export const MIN_DIMENSION = 30;
export const MAX_DIMENSION = 80;

// Server settings
export const NUMBER_OF_TEAMS = 2;
export const MIN_NUMBER_OF_ARCHONS = 1;
export const MAX_NUMBER_OF_ARCHONS = 3;

export function bodyTypeToString(bodyType: schema.BodyType) {
  switch(bodyType) {
    case ARCHON:     return "archon";
    case GARDENER:   return "gardener";
    case LUMBERJACK: return "lumberjack";
    case SOLDIER:    return "soldier";
    case TANK:       return "tank";
    case SCOUT:      return "scout";
    case NONE:       return "";
    default:         throw new Error("invalid body type");
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