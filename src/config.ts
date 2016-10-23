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
}

/**
 * Handle setting up any values that the user doesn't set.
 */
export function defaults(supplied?: any): Config {
  supplied = supplied || {};
  return {
    gameVersion: supplied.gameVersion || "ANY",
    fullscreen: supplied.fullscreen || false,
    width: supplied.width || 540,
    height: supplied.height || 540
  };
}
