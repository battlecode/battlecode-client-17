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

  // Form elements
  private valueID: HTMLLabelElement;
  private inputX: HTMLInputElement;
  private inputY: HTMLInputElement;
  private inputRadius: HTMLInputElement;
  private setButton: HTMLButtonElement;
  private deleteButton: HTMLButtonElement;

  // Options
  private readonly conf: Config

  // Map information
  private lastID: number;
  private name: string;
  private width: number;
  private height: number;
  private symmetry: Symmetry;
  private readonly spawnedBodies: Map<number, SpawnedBody>;
  private readonly trees: Map<number, NeutralTree>;

  constructor(conf: Config, imgs: AllImages, canvas: HTMLCanvasElement) {
    this.conf = conf;
    this.images = imgs;
    this.canvas = canvas;

    this.lastID = 0;
    this.name = "DEFAULT_MAP";
    this.width = 50;
    this.height = 50;
    this.div = this.initialDiv();
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
    inputMapName.value = "DEFAULT_MAP";
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
    inputWidth.value = String(this.width);
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
    inputHeight.value = String(this.height);
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
    valueID.textContent = "";
    nodeID.appendChild(labelID);
    nodeID.appendChild(valueID);

    // X coordinate
    const nodeX: HTMLDivElement = document.createElement("div");
    const labelX: HTMLLabelElement = document.createElement("label");
    const inputX: HTMLInputElement = document.createElement("input");
    labelX.appendChild(document.createTextNode("X: "));
    inputX.type = "text";
    nodeX.appendChild(labelX);
    nodeX.appendChild(inputX);
    nodeX.style.textAlign = "left";

    // Y coordinate
    const nodeY: HTMLDivElement = document.createElement("div");
    const labelY: HTMLLabelElement = document.createElement("label");
    const inputY: HTMLInputElement = document.createElement("input");
    labelY.appendChild(document.createTextNode("Y: "));
    inputY.type = "text";
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

    // Set button
    const setButton: HTMLButtonElement = document.createElement("button");
    setButton.type = "button";
    setButton.appendChild(document.createTextNode("Set"));

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
    tree.appendChild(setButton);
    tree.appendChild(deleteButton);
    tree.appendChild(document.createElement("br"));

    this.valueID = valueID;
    this.inputX = inputX;
    this.inputY = inputY;
    this.inputRadius = inputRadius;
    this.setButton = setButton;
    this.deleteButton = deleteButton;
    this.initializeCallbacks();
    return tree;
  }

  private initializeCallbacks() {

    this.inputX.onchange = () => {
      // X must be in the range [0, this.width]
      let value: number = parseFloat(this.inputX.value);
      if (value < 0) value = 0;
      if (value > this.width) value = this.width;
      this.inputX.value = String(value);
    };
    this.inputY.onchange = () => {
      // Y must be in the range [0, this.height]
      let value: number = parseFloat(this.inputY.value);
      if (value < 0) value = 0;
      if (value > this.height) value = this.height;
      this.inputY.value = String(value);
    };
    this.inputRadius.onchange = () => {
      // Radius must be >= 0 and <= this.getMaxRadius(x, y)
      let value: number = parseFloat(this.inputRadius.value);
      let x: number = parseFloat(this.inputX.value);
      let y: number = parseFloat(this.inputY.value);
      if (value < 0) value = 0;
      if (value > this.getMaxRadius(x, y)) value = this.getMaxRadius(x, y);
      this.inputRadius.value = String(value);
    };
    this.setButton.onclick = () => {
      let id = this.valueID.textContent;
      let x = parseFloat(this.inputX.value);
      let y = parseFloat(this.inputY.value);
      let radius = parseFloat(this.inputRadius.value);

      // Return if invalid input
      if (isNaN(x) || isNaN(y) || isNaN(radius) || radius === 0) return;

      if (id === "") {
        // Create a new tree
        this.setTree(this.lastID, { loc: new Victor(x, y), radius: radius });
      } else if (id != null) {
        // Update existing tree
        this.setTree(parseInt(id), { loc: new Victor(x, y), radius: radius });
      }
    }
    this.deleteButton.onclick = () => {
      // Delete a tree is input is valid
      if (this.valueID.textContent != null) {
        let id = parseInt(this.valueID.textContent);
        if (!isNaN(id)) {
          this.deleteUnit(id);
        }
      }
    }
  }

  /**
   * Given an x, y on the map, returns the maximum radius such that the
   * corresponding unit centered on x, y is DELTA away from any other existing
   * unit. Returns 0 if no such radius exists.
   */
  private getMaxRadius(x, y): number {
    return 50; // TODO
  }

  /**
   * If a tree with the given ID already exists, updates the existing tree.
   * Otherwise, adds the tree to the internal trees and increments lastID.
   * Finally re-renders the canvas.
   */
  private setTree(id: number, tree: NeutralTree): void {
    if (!this.trees.has(id)) {
      this.lastID += 1;
    }
    this.trees.set(id, tree);
    this.render();
  }

  /**
   * If an archon with the given ID already exists, updates the existing archon.
   * Otherwise, adds the archon to the internal archons and increments lastID.
   * Finally re-renders the canvas.
   */
  private setArchon(id: number, body: SpawnedBody): void {
    if (!this.spawnedBodies.has(id)) {
      this.lastID += 1;
    }
    this.spawnedBodies.set(id, body);
    this.render();
  }

  /**
   * Deletes the tree/archon with the given ID if it exists and re-renders
   * the canvas. Otherwise does nothing.
   */
  private deleteUnit(id: number): void {
    if (this.spawnedBodies.has(id)) this.spawnedBodies.delete(id);
    if (this.trees.has(id)) this.trees.delete(id);
    this.render();
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

const DELTA = .01;