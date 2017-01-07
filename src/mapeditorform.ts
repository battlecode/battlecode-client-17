import {Config} from './config';
import {AllImages} from './imageloader';
import MapRenderer from './maprenderer';

import {schema, flatbuffers} from 'battlecode-playback';

import {Symmetry, MapUnit} from './maprenderer';
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
  private tree: HTMLInputElement;
  private archon: HTMLInputElement;
  private valueID: HTMLLabelElement;
  private inputX: HTMLInputElement;
  private inputY: HTMLInputElement;
  private inputRadius: HTMLInputElement;
  private setButton: HTMLButtonElement;
  private deleteButton: HTMLButtonElement;

  // Options
  private readonly conf: Config

  // Map information
  private type: schema.BodyType;
  private lastID: number; // To give bodies unique IDs
  name: string;
  width: number;
  height: number;
  private symmetry: Symmetry;
  readonly bodies: Map<number, MapUnit>;
  symmetricBodies: Map<number, MapUnit>;

  constructor(conf: Config, imgs: AllImages, canvas: HTMLCanvasElement) {
    this.conf = conf;
    this.images = imgs;
    this.canvas = canvas;

    this.lastID = 1;
    this.name = "DEFAULT_MAP";
    this.width = 50;
    this.height = 50;
    this.symmetry = Symmetry.ROTATIONAL;
    this.div = this.initialDiv();
    this.bodies = new Map<number, MapUnit>();
    this.symmetricBodies = new Map<number, MapUnit>();

    const onclickUnit = (id: number) => {
      this.valueID.textContent = String(id);
      if (this.bodies.has(id)) {
        let body: MapUnit = this.bodies.get(id);
        if (body.type === ARCHON) {
          this.archon.checked = true;
          this.tree.checked = false;
        } else {
          this.tree.checked = true;
          this.archon.checked = false;
        }
        this.inputX.value = String(body.loc.x);
        this.inputY.value = String(body.loc.y);
        this.inputRadius.value = String(body.radius);
      }
    };
    const onclickBlank = (loc: Victor) => {
      this.valueID.textContent = "";
      this.inputX.value = String(loc.x);
      this.inputY.value = String(loc.y);
      this.inputRadius.value = String(this.getMaxRadius(loc.x, loc.y, this.type));
    }
    this.renderer = new MapRenderer(canvas, imgs, conf, onclickUnit, onclickBlank);
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
    rotational.checked = true;
    rotational.onchange = () => {
      if (rotational.checked) this.symmetry = Symmetry.ROTATIONAL;
      this.render();
    };
    div.appendChild(rotational);
    div.appendChild(document.createTextNode("Rotational"));
    div.appendChild(document.createElement("br"));

    const horizontal = document.createElement("input");
    horizontal.type = "radio";
    horizontal.name = "symmetry";
    horizontal.onchange = () => {
      if (horizontal.checked) this.symmetry = Symmetry.HORIZONTAL;
      this.render();
    };
    div.appendChild(horizontal);
    div.appendChild(document.createTextNode("Horizontal"));
    div.appendChild(document.createElement("br"));

    const vertical = document.createElement("input");
    vertical.type = "radio";
    vertical.name = "symmetry";
    vertical.onchange = () => {
      if (vertical.checked) this.symmetry = Symmetry.VERTICAL;
      this.render();
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
    const body: HTMLFormElement = document.createElement("form");

    // Body type
    const tree = document.createElement("input");
    tree.type = "radio";
    tree.name = "bodytype";
    tree.checked = true;
    const archon = document.createElement("input");
    archon.type = "radio";
    archon.name = "bodytype";
    body.appendChild(tree);
    body.appendChild(document.createTextNode("Tree"));
    body.appendChild(archon);
    body.appendChild(document.createTextNode("Archon"));
    body.appendChild(document.createElement("br"));

    // ID
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
    body.appendChild(nodeID);
    body.appendChild(nodeX);
    body.appendChild(nodeY);
    body.appendChild(nodeRadius);
    // body.appendChild(nodeBullets);
    // body.appendChild(nodeBody);
    body.appendChild(document.createElement("br"));
    body.appendChild(setButton);
    body.appendChild(deleteButton);
    body.appendChild(document.createElement("br"));

    this.tree = tree;
    this.archon = archon;
    this.valueID = valueID;
    this.inputX = inputX;
    this.inputY = inputY;
    this.inputRadius = inputRadius;
    this.setButton = setButton;
    this.deleteButton = deleteButton;
    this.initializeCallbacks();
    return body;
  }

  private initializeCallbacks() {

    this.tree.onchange = () => {
      if (this.tree.checked) this.type = TREE;
      this.inputX.value = "";
      this.inputY.value = "";
      this.inputRadius.value = "";
    };
    this.archon.onchange = () => {
      if (this.archon.checked) this.type = ARCHON;
      this.inputX.value = "";
      this.inputY.value = "";
      this.inputRadius.value = "";
    };
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
      let value: number = parseFloat(this.inputRadius.value);
      let x: number = parseFloat(this.inputX.value);
      let y: number = parseFloat(this.inputY.value);
      if (value < 0) value = 0;
      if (value > this.getMaxRadius(x, y, this.type)) value = this.getMaxRadius(x, y, this.type);
      this.inputRadius.value = String(value);
    };
    this.setButton.onclick = () => {
      let id = this.valueID.textContent;
      let x = parseFloat(this.inputX.value);
      let y = parseFloat(this.inputY.value);
      let radius = parseFloat(this.inputRadius.value);

      // Return if invalid input
      if (isNaN(x) || isNaN(y) || isNaN(radius) || radius === 0) return;

      let type = this.tree.checked ? TREE : ARCHON;
      if (id === "") {
        // Create a new unit
        this.setUnit(this.lastID, {
          loc: new Victor(x, y),
          radius: radius,
          type: type
        });
      } else if (id != null) {
        // Update existing unit
        this.setUnit(parseInt(id), {
          loc: new Victor(x, y),
          radius: radius,
          type: type
        });
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
  private getMaxRadius(x, y, type: schema.BodyType): number {
    // Min distance to wall
    let maxRadius = Math.min(x, y, this.width - x, this.height -y);
    const loc = new Victor(x, y);

    // Min distance to tree or body
    this.bodies.forEach(function(body: MapUnit, id: number) {
      maxRadius = Math.min(maxRadius, loc.distance(body.loc) - body.radius);
    });
    this.symmetricBodies.forEach(function(body: MapUnit, id: number) {
      maxRadius = Math.min(maxRadius, loc.distance(body.loc) - body.radius);
    });

    maxRadius = Math.max(0, maxRadius - DELTA);
    if (type === ARCHON) {
      return maxRadius >= 2 ? 2 : 0;
    } else {
      return maxRadius;
    }
  }

  /**
   * If a unit with the given ID already exists, updates the existing unit.
   * Otherwise, adds the unit to the internal units and increments lastID.
   * Finally re-renders the canvas.
   */
  private setUnit(id: number, body: MapUnit): void {
    if (!this.bodies.has(id)) {
      this.lastID += 1;
    }
    this.bodies.set(id, body);
    this.render();
  }

  /**
   * Deletes the tree/archon with the given ID if it exists and re-renders
   * the canvas. Otherwise does nothing.
   */
  private deleteUnit(id: number): void {
    if (this.bodies.has(id)) this.bodies.delete(id);
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
    this.symmetricBodies = this.getSymmetricBodies();
    this.renderer.render(this.width, this.height, this.bodies,
      this.symmetricBodies);
  }

  private getSymmetricBodies(): Map<number, MapUnit> {
    // Whether or not loc lies on the point or line of symmetry
    const onSymmetricLine = (loc: Victor): boolean => {
      switch(this.symmetry) {
        case(Symmetry.ROTATIONAL):
        return loc.x === this.width / 2 && loc.y === this.height / 2;
        case(Symmetry.HORIZONTAL):
        return loc.y === this.height / 2;
        case(Symmetry.VERTICAL):
        return loc.x === this.width / 2;
      }
    };

    // Returns the symmetric location on the canvas
    const transformLoc = (loc: Victor): Victor => {
      function reflect(x: number, mid: number): number {
        if (x > mid) {
          return mid - Math.abs(x - mid);
        } else {
          return mid + Math.abs(x - mid);
        }
      }

      const midX = this.width / 2;
      const midY = this.height / 2;
      switch(this.symmetry) {
        case(Symmetry.ROTATIONAL):
        return new Victor(reflect(loc.x, midX), reflect(loc.y, midY));
        case(Symmetry.HORIZONTAL):
        return new Victor(loc.x, reflect(loc.y, midY));
        case(Symmetry.VERTICAL):
        return new Victor(reflect(loc.x, midX), loc.y);
      }
    };

    // Create the symmetric bodies
    const symmetricBodies: Map<number, MapUnit> = new Map<number, MapUnit>();
    this.bodies.forEach((body: MapUnit, id: number) => {
      if (!onSymmetricLine(body.loc)) {
        symmetricBodies.set(id, {
          loc: transformLoc(body.loc),
          radius: body.radius,
          type: body.type,
          containedBullets: body.containedBullets,
          containedBody: body.containedBody
        });
      }
    });

    return symmetricBodies;
  }

  /**
   * Whether the map is valid and ready to generate a GameMap
   */
  isValid(): boolean {
    return true;
  }
}

const DELTA = .0001;
const ARCHON_RADIUS = 2;
const ARCHON = schema.BodyType.ARCHON;
const TREE = schema.BodyType.TREE_NEUTRAL;