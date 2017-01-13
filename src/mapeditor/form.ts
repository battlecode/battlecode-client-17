import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';
import MapRenderer from './renderer';

import HeaderForm from './forms/header';
import SymmetryForm from './forms/symmetry';
import TreeForm from './forms/tree';
import ArchonForm from './forms/archon';

import {schema, flatbuffers} from 'battlecode-playback';

import {Symmetry, MapUnit} from './renderer';
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

  // Forms
  private readonly forms: {
    header: HeaderForm,
    symmetry: SymmetryForm,
    tree: TreeForm,
    archon: ArchonForm
  }

  private archon: HTMLInputElement;
  private tree: HTMLInputElement;

  private addbutton: HTMLButtonElement;
  private deletebutton: HTMLButtonElement;

  // Options
  private readonly conf: Config

  // Map information
  private lastID: number; // To give bodies unique IDs
  private originalBodies: Map<number, MapUnit>;
  private symmetricBodies: Map<number, MapUnit>;

  constructor(conf: Config, imgs: AllImages, canvas: HTMLCanvasElement) {
    this.conf = conf;
    this.images = imgs;
    this.canvas = canvas;

    this.forms = {
      header: new HeaderForm(() => {this.render()}),
      symmetry: new SymmetryForm(() => {this.render()}),
      tree: new TreeForm(
        () => {return this.width()},
        () => {return this.height()},
        (x: number, y: number, id?: number) => {return this.maxRadius(x, y, id)}
      ),
      archon: new ArchonForm(
        () => {return this.width()},
        () => {return this.height()},
        (x: number, y: number, id?: number) => {return this.maxRadius(x, y, id)}
      )
    };

    this.lastID = 1;
    this.div = this.initialDiv();
    this.originalBodies = new Map<number, MapUnit>();
    this.symmetricBodies = new Map<number, MapUnit>();

    this.initializeCallbacks();

    const onclickUnit = (id: number) => {
      if (this.originalBodies.has(id)) {
        // Set the corresponding form appropriately
        let body: MapUnit = this.originalBodies.get(id);
        if (body.type === cst.ARCHON) {
          this.archon.click();
          this.forms.archon.setForm(body.loc, body, id);
        } else if (body.type === cst.TREE_NEUTRAL) {
          this.tree.click();
          this.forms.tree.setForm(body.loc, body, id);
        }
      }
    };
    const onclickBlank = (loc: Victor) => {
      if (this.archon.checked) {
        this.forms.archon.setForm(loc);
      } else {
        this.forms.tree.setForm(loc);
      }
    }

    this.renderer = new MapRenderer(canvas, imgs, conf, onclickUnit, onclickBlank);
    this.render();
  }

  /**
   * Creates the div that contains all the map-editor related form elements.
   */
  private initialDiv(): HTMLDivElement {
    const div: HTMLDivElement = document.createElement("div");

    div.appendChild(this.forms.header.div);
    div.appendChild(this.forms.symmetry.div);
    div.appendChild(this.createUnitOption());

    div.appendChild(this.forms.tree.div);
    div.appendChild(this.createFormButtons());

    div.appendChild(document.createElement("br"));
    return div;
  }

  private createUnitOption(): HTMLDivElement {
    let div = document.createElement("div");

    // Tree option
    let tree = document.createElement("input");
    tree.type = "radio";
    tree.name = "bodytype";
    tree.checked = true;

    // Archon option
    let archon = document.createElement("input");
    archon.type = "radio";
    archon.name = "bodytype";

    // Add radio buttons HTML element
    div.appendChild(tree);
    div.appendChild(document.createTextNode("Tree"));
    div.appendChild(archon);
    div.appendChild(document.createTextNode("Archon"));
    div.appendChild(document.createElement("br"));

    // Save input elements
    this.tree = tree;
    this.archon = archon;
    return div;
  }

  private createFormButtons(): HTMLDivElement {
    // HTML structure
    const buttons = document.createElement("div");
    const deletebutton: HTMLButtonElement = document.createElement("button");
    const addbutton: HTMLButtonElement = document.createElement("button");
    buttons.appendChild(deletebutton);
    buttons.appendChild(addbutton);

    // Delete and Add/Update buttons
    deletebutton.type = "button";
    deletebutton.appendChild(document.createTextNode("Delete"));
    addbutton.type = "button";
    addbutton.appendChild(document.createTextNode("Add/Update"));

    // Save HTML elements
    this.deletebutton = deletebutton;
    this.addbutton = addbutton;

    return buttons;
  }

  private initializeCallbacks() {

    this.tree.onchange = () => {
      // Change the displayed form
      if (this.tree.checked) {
        this.div.replaceChild(this.forms.tree.div, this.forms.archon.div);
      }
    };
    this.archon.onchange = () => {
      // Change the displayed form
      if (this.archon.checked) {
        this.div.replaceChild(this.forms.archon.div, this.forms.tree.div);
      }
    };

    this.addbutton.onclick = () => {
      let unit: MapUnit | undefined;
      let id: number | undefined;
      if (this.tree.checked) {
        unit = this.forms.tree.getUnit();
        id = this.forms.tree.getID();
      } else {
        unit = this.forms.archon.getUnit(1);
        id = this.forms.archon.getID();
      }

      if (unit && !id) {
        // Create a new unit
        this.setUnit(this.lastID, unit);
        this.forms.archon.resetForm();
        this.forms.tree.resetForm();
      } else if (unit && id) {
        // Update existing unit
        this.setUnit(id, unit);
        this.forms.archon.resetForm();
        this.forms.tree.resetForm();
      }
    }

    this.deletebutton.onclick = () => {
      let id: number | undefined;
      if (this.tree.checked) {
        id = this.forms.tree.getID();
      } else {
        id = this.forms.archon.getID();
      }

      if (id && !isNaN(id)) {
        this.deleteUnit(id);
      }
    }
  }

  /**
   * Given an x, y on the map, returns the maximum radius such that the
   * corresponding unit centered on x, y is cst.DELTA away from any other existing
   * unit. Returns 0 if no such radius exists.
   *
   * If an id is given, does not consider the body with the corresponding id to
   * overlap with the given coordinates.
   */
  private maxRadius(x: number, y: number, ignoreID?: number): number {
    // Min distance to wall
    let maxRadius = Math.min(x, y, this.width() - x, this.height() -y);
    const loc = new Victor(x, y);

    // Min distance to tree or body
    ignoreID = ignoreID || -1;
    this.originalBodies.forEach((body: MapUnit, id: number) => {
      if (id != ignoreID) {
        maxRadius = Math.min(maxRadius, loc.distance(body.loc) - body.radius);
      }
    });
    this.symmetricBodies.forEach((body: MapUnit, id: number) => {
      if (id != ignoreID) {
        maxRadius = Math.min(maxRadius, loc.distance(body.loc) - body.radius);
      }
    });

    return Math.max(0, maxRadius - cst.DELTA);
  }

  /**
   * If a unit with the given ID already exists, updates the existing unit.
   * Otherwise, adds the unit to the internal units and increments lastID.
   * Finally re-renders the canvas.
   */
  private setUnit(id: number, body: MapUnit): void {
    if (!this.originalBodies.has(id)) {
      this.lastID += 1;
    }
    this.originalBodies.set(id, body);
    this.render();
  }

  /**
   * Deletes the tree/archon with the given ID if it exists and re-renders
   * the canvas. Otherwise does nothing.
   */
  private deleteUnit(id: number): void {
    if (this.originalBodies.has(id)) {
      this.originalBodies.delete(id);
      this.render();
    }
  }

  /**
   * Re-renders the canvas based on the parameters of the map editor.
   */
  render() {
    const scale: number = 50; // arbitrary scaling factor
    this.canvas.width = this.width() * scale;
    this.canvas.height = this.height() * scale;
    this.symmetricBodies = this.getSymmetricBodies();
    this.renderer.render(this.width(), this.height(), this.originalBodies, this.symmetricBodies);
  }


  // Whether or not loc lies on the point or line of symmetry
  private onSymmetricLine(loc: Victor): boolean {
    switch(this.symmetry()) {
      case(Symmetry.ROTATIONAL):
      return loc.x === this.width() / 2 && loc.y === this.height() / 2;
      case(Symmetry.HORIZONTAL):
      return loc.y === this.height() / 2;
      case(Symmetry.VERTICAL):
      return loc.x === this.width() / 2;
    }
  };

  // Returns the symmetric location on the canvas
  private transformLoc (loc: Victor): Victor {
    function reflect(x: number, mid: number): number {
      if (x > mid) {
        return mid - Math.abs(x - mid);
      } else {
        return mid + Math.abs(x - mid);
      }
    }

    const midX = this.width() / 2;
    const midY = this.height() / 2;
    switch(this.symmetry()) {
      case(Symmetry.ROTATIONAL):
      return new Victor(reflect(loc.x, midX), reflect(loc.y, midY));
      case(Symmetry.HORIZONTAL):
      return new Victor(loc.x, reflect(loc.y, midY));
      case(Symmetry.VERTICAL):
      return new Victor(reflect(loc.x, midX), loc.y);
    }
  };

  /**
   * Uses the bodies stored internally to create a mapping of original body
   * IDs to the symmetric unit. A symmetric unit is a unit with the same ID
   * that is reflected or rotated around a line or point of symmetry based on
   * the parameter given in the map editor form.
   */
  private getSymmetricBodies(): Map<number, MapUnit> {
    const symmetricBodies: Map<number, MapUnit> = new Map<number, MapUnit>();
    this.originalBodies.forEach((body: MapUnit, id: number) => {
      if (!this.onSymmetricLine(body.loc)) {
        symmetricBodies.set(id, {
          loc: this.transformLoc(body.loc),
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
   * Adds the current unit to the map
   */
  addToMap(): void {
    return this.addbutton.click();
  }

  /**
   * Deletes the current unit from the map
   */
  deleteFromMap(): void {
    return this.deletebutton.click();
  }

  /**
   * The name of the map currently in the field
   */
  name(): string {
    return this.forms.header.getName();
  }

  /**
   * The width of the map currently in the field
   */
  width(): number {
    return this.forms.header.getWidth();
  }

  /**
   * The height of the map currently in the field
   */
  height(): number {
    return this.forms.header.getHeight();
  }

  /**
   * The bodies (trees and archons) currently on the map
   */
  bodies(): Map<number, MapUnit> {
    const map = new Map<number, MapUnit>();

    const offsetA = Math.round(Math.random()); // 0 or 1
    const offsetB = 1 - offsetA; // 1 or 0
    console.log(`${offsetA} ${offsetB}`);

    this.originalBodies.forEach((body: MapUnit, id: number) => {
      if (body.type === cst.ARCHON) body.teamID = 1;
      map.set(id * 2 + offsetA, body);
    });
    this.symmetricBodies.forEach((body: MapUnit, id: number) => {
      if (body.type === cst.ARCHON) body.teamID = 2;
      map.set(id * 2 + offsetB, body);
    });

    return map;
  }

  /**
   * The symmetry of the map currently selected
   */
  symmetry(): Symmetry {
    return this.forms.symmetry.getSymmetry();
  }

  /**
   * Whether the map is valid. If the map is valid, then the map eidtor is
   * ready to generate a map.
   */
  isValid(): boolean {
    let errors = new Array();

    if (isNaN(this.width()) || this.width() < cst.MIN_DIMENSION || this.width() > cst.MAX_DIMENSION) {
      // Width must be in range [cst.MIN_DIMENSION, cst.MAX_DIMENSION]
      errors.push(`The width must be between ${cst.MIN_DIMENSION} and ${cst.MAX_DIMENSION}.`);
    } else if (isNaN(this.height()) || this.height() < cst.MIN_DIMENSION || this.height() > cst.MAX_DIMENSION) {
      // Height must be in range [cst.MIN_DIMENSION, cst.MAX_DIMENSION]
      errors.push(`The height must be between ${cst.MIN_DIMENSION} and ${cst.MAX_DIMENSION}.`);
    }

    // There must be cst.MIN_NUMBER_OF_ARCHONS to cst.MAX_NUMBER_OF_ARCHONS archons
    let archonCount = 0;
    this.originalBodies.forEach((unit: MapUnit) => {
      archonCount += unit.type === cst.ARCHON ? 1 : 0;
    });
    if (archonCount < cst.MIN_NUMBER_OF_ARCHONS || archonCount > cst.MAX_NUMBER_OF_ARCHONS) {
      errors.push(`There must be ${cst.MIN_NUMBER_OF_ARCHONS} to ${cst.MAX_NUMBER_OF_ARCHONS} archons.`);
    }

    // Bodies must be on the map
    // Invariant: bodies in originalBodies don't overlap with each other, and
    //            bodies in symmetricBodies don't overlap with each other
    this.originalBodies.forEach((unit: MapUnit, id: number) => {
      let x = unit.loc.x;
      let y = unit.loc.y;
      let distanceToWall = Math.min(x, y, this.width() - x, this.height() - y);
      if (unit.radius > distanceToWall || x < 0 || y < 0 || x > this.width() || y > this.height()) {
        errors.push(`ID ${id} is off the map.`);
      }
    });

    // Bodies must not overlap
    this.originalBodies.forEach((unitA: MapUnit, idA: number) => {
      this.symmetricBodies.forEach((unitB: MapUnit, idB: number) => {
        if (unitA.loc.distance(unitB.loc) <= unitA.radius + unitB.radius) {
          errors.push (`IDs ${idA} and ${idB} are overlapping.`);
        }
      });
    });

    // Neutral trees cannot have a smaller radius than the body they contain
    this.originalBodies.forEach((unit: MapUnit, id: number) => {
      if (unit.type === cst.TREE_NEUTRAL) {
        const treeRadius = unit.radius;
        const bodyRadius = cst.radiusFromBodyType(unit.containedBody);
        if (treeRadius < bodyRadius) {
          errors.push(`Tree ID ${id} with radius ${treeRadius.toFixed(2)} contains a body with radius ${bodyRadius}`);
        }
      }
    });

    if (errors.length > 0) {
      alert(errors.join("\n"));
      return false;
    }

    // It's good :)
    return true;
  }

  removeInvalidUnits(): void {
    // NOTE: All changes that are made to originalBodies are reflected in
    // symmetricBodies when calling this.render()
    let actions = new Array();

    // If there are too many archons, remove them until there aren't
    let archonIDs = new Array<number>();
    this.originalBodies.forEach((unit: MapUnit, id: number) => {
      if (unit.type === cst.ARCHON) {
        archonIDs.push(id);
      }
    });
    while (archonIDs.length > cst.MAX_NUMBER_OF_ARCHONS) {
      let poppedID = archonIDs.pop();
      if (poppedID) {
        this.originalBodies.delete(poppedID);
        actions.push(`Removed archon ID ${poppedID}`);
      }
    }

    // If there aren't enough archons, tell them
    if (archonIDs.length < cst.MIN_NUMBER_OF_ARCHONS) {
      actions.push(`NOTE: You must manually add ${cst.MIN_NUMBER_OF_ARCHONS - archonIDs.length} archon(s).`);
    }

    // Remove bodies that are off the map
    this.originalBodies.forEach((unit: MapUnit, id: number) => {
      let x = unit.loc.x;
      let y = unit.loc.y;
      let distanceToWall = Math.min(x, y, this.width() - x, this.height() - y);
      if (unit.radius > distanceToWall || x < 0 || y < 0 || x > this.width() || y > this.height()) {
        this.originalBodies.delete(id);
        actions.push(`Removed ID ${id}. (off the map)`);
      }
    });

    // Remove bodies that overlap
    // Invariant: bodies in originalBodies don't overlap with each other, and
    //            bodies in symmetricBodies don't overlap with each other
    this.originalBodies.forEach((unitA: MapUnit, idA: number) => {
      this.symmetricBodies.forEach((unitB: MapUnit, idB: number) => {
        if (unitA.loc.distance(unitB.loc) <= unitA.radius + unitB.radius) {
          this.originalBodies.delete(idA);
          this.originalBodies.delete(idB);
          actions.push (`Removed IDs ${idA} and ${idB}. (overlapping)`);
        }
      });
    });

    // Remove the body from neutral trees with a smaller radius than the contained body
    this.originalBodies.forEach((unit: MapUnit, id: number) => {
      if (unit.type === cst.TREE_NEUTRAL) {
        const treeRadius = unit.radius;
        const bodyRadius = cst.radiusFromBodyType(unit.containedBody);
        if (treeRadius < bodyRadius) {
          this.originalBodies.get(id).containedBody = cst.NONE;
          actions.push(`Removed a body from tree ID ${id}`);
        }
      }
    });

    if (actions.length > 0) {
      alert(actions.join("\n"));
      this.render();
    } else {
      alert("Congratulations, the map is already valid!");
    }
  }

  reset(): void {
    this.lastID = 1;
    this.originalBodies = new Map<number, MapUnit>();
    this.symmetricBodies = new Map<number, MapUnit>();
    this.render();
  }
}
