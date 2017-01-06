import {Config} from './config';
import {AllImages} from './imageloader';

export default class MapEditor {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private readonly images: AllImages;
  readonly canvas: HTMLCanvasElement;

  // Options
  private readonly conf: Config

  constructor(conf: Config, images: AllImages) {
    this.div = document.createElement("div");
    this.images = images;
    this.conf = conf;

    this.div.appendChild(document.createTextNode("This will be a map editor eventually."));
    this.canvas = document.createElement("canvas");
  }
}