import {Config} from './config';
import {AllImages} from './imageloader';
import MapEditorForm from './mapeditorform';

import {schema, flatbuffers} from 'battlecode-playback';

/**
 * Allows the canvas and the map editor form to communicate
 */
export default class MapEditor {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private readonly images: AllImages;
  private readonly form: MapEditorForm;
  readonly canvas: HTMLCanvasElement;

  // Options
  private readonly conf: Config;

  constructor(conf: Config, images: AllImages) {
    this.canvas = document.createElement("canvas");
    this.form = new MapEditorForm(conf, images, this.canvas);
    this.div = this.form.div;
    this.images = images;
    this.conf = conf;

  }

  /**
   * Write fields to a schema.GameMap and write the game map out to a file
   */
  private generateMap() {
    // TODO: Get values from input boxes

    // TODO: Add map name, corners, bodies, trees, and random seed
    const builder = new flatbuffers.Builder();
    schema.GameMap.startGameMap(builder);
    // schema.GameMap.addMinCorner(builder, schema.Vec.createVec(builder, 0, 0));
    // schema.GameMap.addMaxCorner(builder, schema.Vec.createVec(builder, 0, 0));
    const map = schema.GameMap.endGameMap(builder);

    // TODO: Write the game map to a file for download
  }
}