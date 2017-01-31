/**
 * All of the top-level tunable options for the game client.
 */
export interface Config {
  /**
   * The version of the game we're simulating.
   */
  readonly gameVersion: string;

  /**
   * Whether to try to run the game in full-screen
   */
  readonly fullscreen: boolean;

  /**
   * Dimensions of the canvas
   */
  readonly width: number;
  readonly height: number;

  /**
   * Turns per second.
   *
   * (DISTINCT from fps!)
   */
  readonly defaultTPS: number;

  /**
   * The url to listen for websocket data on, if any.
   */
  readonly websocketURL: string | null;

  /**
   * The match file URL to load when we start.
   */
  readonly matchFileURL: string | null;

  /**
   * How often to poll the server via websocket, in ms.
   */
  readonly pollEvery: number;

  /**
   * Whether or not to interpolate between frames.
   */
  interpolate: boolean;

  /**
   * Whether or not to display health bars
   */
  healthBars: boolean;

  /**
   * Whether or not to draw a circle under each robot
   */
  circleBots: boolean;

  /**
   * Whether or not to display indicator dots and lines
   */
  indicators: boolean;

  /**
   * Whether or not to display the sight radius
   */
  sightRadius: boolean;

  /**
   * Whether or not to display the bullet sight radius
   */
  bulletSightRadius: boolean;

  /**
   * The mode of the game
   */
  mode: Mode;

  /**
   * Whether to display the splash screen.
   */
  splash: boolean;
}

/**
 * Different game modes that determine what is displayed on the client
 */
export enum Mode {
  GAME,
  HELP,
  MAPEDITOR,
  CONSOLE,
  QUEUE
}

/**
 * Handle setting up any values that the user doesn't set.
 */
export function defaults(supplied?: any): Config {
  supplied = supplied || {};
  return {
    gameVersion: supplied.gameVersion || "2017.1.6.2", //TODO: Change this on each release!
    fullscreen: supplied.fullscreen || false,
    width: supplied.width || 600,
    height: supplied.height || 600,
    defaultTPS: supplied.defaultTPS || 20,
    websocketURL: supplied.websocketURL || null,
    matchFileURL: supplied.matchFileURL || null,
    pollEvery: supplied.pollEvery || 500,
    interpolate: supplied.interpolate || true,
    healthBars: supplied.healthBars || true,
    circleBots: supplied.circleBots || false,
    indicators: supplied.indicators || true,
    mode: supplied.mode || Mode.QUEUE,
    splash: supplied.splash || supplied.matchFileURL == null || true,
    sightRadius: supplied.sightRadius || false,
    bulletSightRadius: supplied.bulletSightRadius || false
  };
}
