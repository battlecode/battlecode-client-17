import {Config} from './config';
import {AllImages} from './imageloader';
import MapRenderer from './maprenderer';

import {schema, flatbuffers} from 'battlecode-playback';

import {Symmetry, SpawnedBody, NeutralTree} from './maprenderer';
import Victor = require('victor');

/**
 * Reads and interprets information from the map editor input form
 */
export default class MapEditorForm {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private readonly images: AllImages;
  private readonly canvas: HTMLCanvasElement;
  private readonly renderer: MapRenderer;

  // Options
  private readonly conf: Config

  // Map information
  private name: string;
  private width: number;
  private height: number;
  private symmetry: Symmetry;
  private readonly spawnedBodies: Map<number, SpawnedBody>;
  private readonly trees: Map<number, NeutralTree>;

  constructor(conf: Config, imgs: AllImages, canvas: HTMLCanvasElement) {
    this.div = this.initialDiv();
    this.conf = conf;
    this.images = imgs;
    this.canvas = canvas;

    this.name = "";
    this.width = 50;
    this.height = 50;
    this.spawnedBodies = new Map<number, SpawnedBody>();
    this.trees = new Map<number, NeutralTree>();

    const onclickRobot = (robots: Map<number, SpawnedBody>, index: number) => {

    };
    const onclickTree = (trees: Map<number, NeutralTree>, index: number) => {

    };
    this.renderer = new MapRenderer(canvas, imgs, conf, onclickRobot, onclickTree);
    this.setCanvasDimensions();
    this.render();
  }

  private initialDiv(): HTMLDivElement {
    const div: HTMLDivElement = document.createElement("div");
    div.style.fontFamily = "tahoma, sans-serif";
    div.style.fontSize = "14px";

    div.appendChild(this.headerInput());
    div.appendChild(this.symmetryInput());
    div.appendChild(this.treeInput());
    return div;
  }

  private headerInput(): HTMLFormElement {
    // Map name
    const nodeMapName: HTMLDivElement = document.createElement("div");
    const labelMapName: HTMLLabelElement = document.createElement("label");
    const inputMapName: HTMLInputElement = document.createElement("input");
    labelMapName.appendChild(document.createTextNode("Map name: "));
    inputMapName.type = "text";
    inputMapName.onchange = () => {
      // Update internal map name
      this.name = inputMapName.value;
    }
    inputMapName.maxLength = 50;
    nodeMapName.appendChild(labelMapName);
    nodeMapName.appendChild(inputMapName);

    // Map width
    const nodeWidth: HTMLDivElement = document.createElement("div");
    const labelWidth: HTMLLabelElement = document.createElement("label");
    const inputWidth: HTMLInputElement = document.createElement("input");
    labelWidth.appendChild(document.createTextNode("Width: "));
    inputWidth.type = "text";
    inputWidth.onchange = () => {
      // Width must be in the range [30, 80]
      let value: number = parseFloat(inputWidth.value);
      if (value < 30) value = 30;
      if (value > 80) value = 80;
      inputWidth.value = String(value);
      // Update internal and canvas width
      this.width = value;
      this.setCanvasDimensions();
      this.render();
    };
    inputWidth.style.width = "50px";
    nodeWidth.appendChild(labelWidth);
    nodeWidth.appendChild(inputWidth);
    nodeWidth.style.textAlign = "left";

    // Map height
    const nodeHeight: HTMLDivElement = document.createElement("div");
    const labelHeight: HTMLLabelElement = document.createElement("label");
    const inputHeight: HTMLInputElement = document.createElement("input");
    labelHeight.appendChild(document.createTextNode("Height: "));
    inputHeight.type = "text";
    inputHeight.onchange = () => {
      // Height must be in the range [30, 80]
      let value: number = parseFloat(inputHeight.value);
      if (value < 30) value = 30;
      if (value > 80) value = 80;
      inputHeight.value = String(value);
      // Update internal and canvas width
      this.height = value;
      this.setCanvasDimensions();
      this.render();
    };
    inputHeight.style.width = "50px";
    nodeHeight.appendChild(labelHeight);
    nodeHeight.appendChild(inputHeight);
    nodeHeight.style.textAlign = "left";

    // HTML structure
    const headerInfo: HTMLFormElement = document.createElement("form");
    headerInfo.appendChild(nodeMapName);
    headerInfo.appendChild(nodeWidth);
    headerInfo.appendChild(nodeHeight);
    headerInfo.appendChild(document.createElement("br"));

    return headerInfo;
  }

  private symmetryInput(): HTMLDivElement {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode("Symmetry:"));

    const rotational = document.createElement("input");
    rotational.type = "radio";
    rotational.name = "symmetry";
    rotational.value = "rotational";
    rotational.checked = true;
    rotational.onchange = () => {
      if (rotational.checked) this.symmetry = Symmetry.ROTATIONAL;
    };
    div.appendChild(rotational);
    div.appendChild(document.createTextNode("Rotational"));
    div.appendChild(document.createElement("br"));

    const horizontal = document.createElement("input");
    horizontal.type = "radio";
    horizontal.name = "symmetry";
    horizontal.value = "horizontal";
    horizontal.onchange = () => {
      if (horizontal.checked) this.symmetry = Symmetry.HORIZONTAL;
    };
    div.appendChild(horizontal);
    div.appendChild(document.createTextNode("Horizontal"));
    div.appendChild(document.createElement("br"));

    const vertical = document.createElement("input");
    vertical.type = "radio";
    vertical.name = "symmetry";
    vertical.value = "vertical";
    vertical.onchange = () => {
      if (vertical.checked) this.symmetry = Symmetry.VERTICAL;
    };
    div.appendChild(vertical);
    div.appendChild(document.createTextNode("Vertical"));
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    return div;
  }

  private archonInput() {

    // Callbacks
    function validateX(input) {
      if (this.value < 0) this.value = 0;
      if (this.value > this.width) this.value = this.width;
    }
    function validateY(input) {
      if (this.value < 0) this.value = 0;
      if (this.value > this.height) this.value = this.height;
    }

    // Archon ID
    const nodeID: HTMLDivElement = document.createElement("div");
    const labelID: HTMLLabelElement = document.createElement("label");
    const valueID: HTMLLabelElement = document.createElement("label");
    labelID.appendChild(document.createTextNode("ID:"));
    valueID.appendChild(document.createTextNode(""))
    nodeID.appendChild(labelID);
    nodeID.appendChild(valueID);

    // X coordinate
    const nodeX: HTMLDivElement = document.createElement("div");
    const labelX: HTMLLabelElement = document.createElement("label");
    const inputX: HTMLInputElement = document.createElement("input");
    labelX.appendChild(document.createTextNode("X: "));
    inputX.type = "text";
    inputX.onchange = validateX;
    nodeX.appendChild(labelX);
    nodeX.appendChild(inputX);
    nodeX.style.textAlign = "left";

    // Y coordinate
    const nodeY: HTMLDivElement = document.createElement("div");
    const labelY: HTMLLabelElement = document.createElement("label");
    const inputY: HTMLInputElement = document.createElement("input");
    labelY.appendChild(document.createTextNode("Y: "));
    inputY.type = "text";
    inputY.onchange = validateY;
    nodeY.appendChild(labelY);
    nodeY.appendChild(inputY);
    nodeY.style.textAlign = "left";

    // HTML structure
    const archon: HTMLFormElement = document.createElement("form");
    archon.appendChild(nodeID);
    archon.appendChild(nodeX);
    archon.appendChild(nodeY);
    archon.appendChild(document.createElement("br"));

    return archon;
  }

  private treeInput() {

    // Callbacks
    function validateX(input) {
      if (this.value < 0) this.value = 0;
      if (this.value > this.width) this.value = this.width;
    }
    function validateY(input) {
      if (this.value < 0) this.value = 0;
      if (this.value > this.height) this.value = this.height;
    }

    // Archon ID
    const nodeID: HTMLDivElement = document.createElement("div");
    const labelID: HTMLLabelElement = document.createElement("label");
    const valueID: HTMLLabelElement = document.createElement("label");
    labelID.appendChild(document.createTextNode("ID:"));
    valueID.appendChild(document.createTextNode(""))
    nodeID.appendChild(labelID);
    nodeID.appendChild(valueID);

    // X coordinate
    const nodeX: HTMLDivElement = document.createElement("div");
    const labelX: HTMLLabelElement = document.createElement("label");
    const inputX: HTMLInputElement = document.createElement("input");
    labelX.appendChild(document.createTextNode("X: "));
    inputX.type = "text";
    inputX.onchange = validateX;
    nodeX.appendChild(labelX);
    nodeX.appendChild(inputX);
    nodeX.style.textAlign = "left";

    // Y coordinate
    const nodeY: HTMLDivElement = document.createElement("div");
    const labelY: HTMLLabelElement = document.createElement("label");
    const inputY: HTMLInputElement = document.createElement("input");
    labelY.appendChild(document.createTextNode("Y: "));
    inputY.type = "text";
    inputY.onchange = validateY;
    nodeY.appendChild(labelY);
    nodeY.appendChild(inputY);
    nodeY.style.textAlign = "left";

    // Radius
    const nodeRadius: HTMLDivElement = document.createElement("div");
    const labelRadius: HTMLLabelElement = document.createElement("label");
    const inputRadius: HTMLInputElement = document.createElement("input");
    labelRadius.appendChild(document.createTextNode("Radius: "));
    inputRadius.type = "text";
    nodeRadius.appendChild(labelRadius);
    nodeRadius.appendChild(inputRadius);
    nodeRadius.style.textAlign = "left";

    // Tree bullets
    const nodeBullets: HTMLDivElement = document.createElement("div");
    const labelBullets: HTMLLabelElement = document.createElement("label");
    const inputBullets: HTMLInputElement = document.createElement("input");
    labelBullets.appendChild(document.createTextNode("Bullets: "));
    inputBullets.type = "text";
    nodeBullets.appendChild(labelBullets);
    nodeBullets.appendChild(inputBullets);
    nodeBullets.style.textAlign = "left";

    // Tree body
    const nodeBody: HTMLDivElement = document.createElement("div");
    const labelBody: HTMLLabelElement = document.createElement("label");
    const inputBody: HTMLInputElement = document.createElement("input");
    labelBody.appendChild(document.createTextNode("Body: "));
    inputBody.type = "text";
    nodeBody.appendChild(labelBody);
    nodeBody.appendChild(inputBody);
    nodeBody.style.textAlign = "left";

    // Add/Update button
    const addButton: HTMLButtonElement = document.createElement("button");
    addButton.type = "button";
    addButton.appendChild(document.createTextNode("Add/Update"));

    // Delete button
    const deleteButton: HTMLButtonElement = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.appendChild(document.createTextNode("Delete"));

    // HTML structure
    const tree: HTMLFormElement = document.createElement("form");
    tree.appendChild(document.createTextNode("Tree Creator"));
    tree.appendChild(nodeID);
    tree.appendChild(nodeX);
    tree.appendChild(nodeY);
    tree.appendChild(nodeRadius);
    // tree.appendChild(nodeBullets);
    // tree.appendChild(nodeBody);
    tree.appendChild(document.createElement("br"));
    tree.appendChild(addButton);
    tree.appendChild(deleteButton);
    tree.appendChild(document.createElement("br"));

    return tree;
  }

  private setCanvasDimensions(): void {
    const scale: number = 30; // arbitrary scaling factor
    this.canvas.width = this.width * scale;
    this.canvas.height = this.height * scale;
    this.canvas.style.height = "calc(100vh - 75px)";
    this.canvas.style.cursor = "pointer";
  }

  private render() {
    this.renderer.render(this.width, this.height, this.spawnedBodies, this.trees);
  }
}