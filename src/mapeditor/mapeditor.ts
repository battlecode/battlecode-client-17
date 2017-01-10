import {Config} from '../config';
import * as cst from '../constants';
import {AllImages} from '../imageloader';
import MapEditorForm from './form';
import {MapUnit} from './renderer';
import ScaffoldCommunicator from '../scaffold';

import {schema, flatbuffers} from 'battlecode-playback';

import Victor = require('victor');

/**
 * Allows the user to download a .map17 file representing the map generated
 * in the map editor.
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

  // Scaffold
  private scaffold: ScaffoldCommunicator | null;

  // For storing map information
  private bodiesArray: {
    robotIDs: number[],
    teamIDs: number[],
    types: schema.BodyType[],
    xs: number[],
    ys: number[]
  };
  // Neutral tree information
  private treesArray: {
    robotIDs: number[],
    xs: number[],
    ys: number[],
    radii: number[],
    containedBullets: number[],
    containedBodies: schema.BodyType[]
  };

  constructor(conf: Config, images: AllImages) {
    this.canvas = document.createElement("canvas");
    this.form = new MapEditorForm(conf, images, this.canvas);
    this.scaffold = null;
    this.div = this.basediv();
    this.images = images;
    this.conf = conf;
  }

  basediv(): HTMLDivElement {
    let div = document.createElement("div");
    div.id = "mapEditor";

    div.appendChild(document.createTextNode(
      "TIP: \"S\"=quick add, \"D\"=quick delete."));
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    div.appendChild(this.form.div);

    div.appendChild(this.validateButton());
    div.appendChild(this.removeInvalidButton());
    div.appendChild(this.resetButton());
    div.appendChild(document.createElement("br"));
    div.appendChild(document.createElement("br"));

    div.appendChild(this.exportButton());

    return div;
  }

  /**
   * Quick add and delete units in the map editor
   */
  onkeydown(): (event: KeyboardEvent) => void {
    return (event: KeyboardEvent) => {
      switch (event.keyCode) {
        case 67: // "c" - Toggle Circle Bots
        this.conf.circleBots = !this.conf.circleBots;
        this.form.render();
        break;
        case 83: // "s" - Set (Add/Update)c
        this.form.addToMap();
        break;
        case 68: // "d" - Delete
        this.form.deleteFromMap();
        break;
      }
    };
  }

  private validateButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.appendChild(document.createTextNode("Validate"));
    button.onclick = () => {
      if (this.form.isValid()) {
        alert("Congratulations! Your map is valid. :)")
      }
    };
    return button;
  }

  /**
   * Sets a scaffold if a scaffold directory is found after everything is loaded
   */
  addScaffold(scaffold: ScaffoldCommunicator): void {
    this.scaffold = scaffold;
  }

  private removeInvalidButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.appendChild(document.createTextNode("Remove invalid units"));
    button.onclick = () => {
      let youAreSure = confirm(
        "WARNING: you will permanently lose all invalid units. Click OK to continue anyway.");
      if (youAreSure) {
        this.form.removeInvalidUnits();
      }
    };
    return button;
  }

  private resetButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.appendChild(document.createTextNode("RESET"));
    button.onclick = () => {
      let youAreSure = confirm(
        "WARNING: you will lose all your data. Click OK to continue anyway.");
      if (youAreSure) {
        this.form.reset();
      }
    };
    return button;
  }

  private exportButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.id = "export";
    button.type = "button";
    button.appendChild(document.createTextNode("EXPORT!"));

    button.onclick = () => {
      if (!this.form.isValid()) return;

      let name = this.form.name();
      let data: Uint8Array | undefined = this.generateMap();

      if (data) {
        if (process.env.ELECTRON && this.scaffold) {
          this.scaffold.saveMap(data, name, (err: Error | null) => {
            if (err) {
              console.log(err);
            } else {
              alert("Good to go! Restart the client to use your new map.");
            }
          });
        } else {
          this.exportFile(data, `${name}.map17`);
        }
      }
    }
    return button;
  }

  private createVecTable(builder: flatbuffers.Builder, xs: number[], ys: number[]) {
    const xsP = schema.VecTable.createXsVector(builder, xs);
    const ysP = schema.VecTable.createYsVector(builder, ys);
    schema.VecTable.startVecTable(builder);
    schema.VecTable.addXs(builder, xsP);
    schema.VecTable.addYs(builder, ysP);
    return schema.VecTable.endVecTable(builder);
  }

  /**
   * Adds a robot body to internal arrays
   */
  private addBody(robotID: number, teamID: number, type: schema.BodyType, x: number, y: number) {
    this.bodiesArray.robotIDs.push(robotID);
    this.bodiesArray.teamIDs.push(teamID);
    this.bodiesArray.types.push(type);
    this.bodiesArray.xs.push(x);
    this.bodiesArray.ys.push(y);
  }

  /**
   * Adds multiple bodies to internal arrays with the given teamID.
   */
  private addBodies(bodies: Map<number, MapUnit>, minCorner: Victor) {

    bodies.forEach((unit: MapUnit, id: number) => {
      if (unit.type === cst.TREE_NEUTRAL) {
        this.addTree(
          id,
          unit.loc.x + minCorner.x,
          unit.loc.y + minCorner.y,
          unit.radius,
          unit.containedBullets,
          unit.containedBody
        );
      } else if (unit.type === cst.ARCHON) {
        this.addBody(
          id,
          unit.teamID || 0, // Must be set if archon
          cst.ARCHON,
          unit.loc.x + minCorner.x,
          unit.loc.y + minCorner.y
        );
      }
    });
  }

  /**
   * Adds a tree to internal arrays
   */
  private addTree(robotID: number, x: number, y: number, radius: number,
    containedBullets: number, containedBody: schema.BodyType) {
    this.treesArray.robotIDs.push(robotID);
    this.treesArray.xs.push(x);
    this.treesArray.ys.push(y);
    this.treesArray.radii.push(radius);
    this.treesArray.containedBullets.push(containedBullets);
    this.treesArray.containedBodies.push(containedBody);
  }

  /**
   * Write fields to a schema.GameMap and write the game map out to a file
   */
  private generateMap(): Uint8Array | undefined {

    let builder = new flatbuffers.Builder();

    // Spawned body information
    this.bodiesArray = {
      robotIDs: [],
      teamIDs: [],
      types: [],
      xs: [],
      ys: []
    };
    // Neutral tree information
    this.treesArray = {
      robotIDs: [],
      xs: [],
      ys: [],
      radii: [],
      containedBullets: [],
      containedBodies: []
    };

    // Get header information from form
    let name: string = this.form.name();
    let minCorner: Victor = new Victor(Math.random()*500, Math.random()*500);
    let maxCorner: Victor = minCorner.clone();
    maxCorner.add(new Victor(this.form.width(), this.form.height()));
    let randomSeed: number = Math.round(Math.random()*1000);

    // Get body information from form and convert to arrays
    this.addBodies(this.form.bodies(), minCorner);

    // Create the spawned bodies table
    let robotIDsVectorB = schema.SpawnedBodyTable.createRobotIDsVector(builder, this.bodiesArray.robotIDs);
    let teamIDsVectorB = schema.SpawnedBodyTable.createTeamIDsVector(builder, this.bodiesArray.teamIDs);
    let typesVectorB = schema.SpawnedBodyTable.createTypesVector(builder, this.bodiesArray.types)
    let locsVecTableB = this.createVecTable(builder, this.bodiesArray.xs, this.bodiesArray.ys);
    schema.SpawnedBodyTable.startSpawnedBodyTable(builder)
    schema.SpawnedBodyTable.addRobotIDs(builder, robotIDsVectorB);
    schema.SpawnedBodyTable.addTeamIDs(builder, teamIDsVectorB);
    schema.SpawnedBodyTable.addTypes(builder, typesVectorB);
    schema.SpawnedBodyTable.addLocs(builder, locsVecTableB);
    const bodies = schema.SpawnedBodyTable.endSpawnedBodyTable(builder);

    // Create the neutral trees table
    let robotIDsVectorT = schema.NeutralTreeTable.createRobotIDsVector(builder, this.treesArray.robotIDs);
    let locsVecTableT = this.createVecTable(builder, this.treesArray.xs, this.treesArray.ys);
    let radiiVectorT = schema.NeutralTreeTable.createRadiiVector(builder, this.treesArray.radii);
    let containedBulletsVectorT = schema.NeutralTreeTable.createContainedBulletsVector(builder, this.treesArray.containedBullets);
    let containedBodiesVectorT = schema.NeutralTreeTable.createContainedBodiesVector(builder, this.treesArray.containedBodies);
    schema.NeutralTreeTable.startNeutralTreeTable(builder)
    schema.NeutralTreeTable.addRobotIDs(builder, robotIDsVectorT);
    schema.NeutralTreeTable.addLocs(builder, locsVecTableT);
    schema.NeutralTreeTable.addRadii(builder, radiiVectorT);
    schema.NeutralTreeTable.addContainedBullets(builder, containedBulletsVectorT);
    schema.NeutralTreeTable.addContainedBodies(builder, containedBodiesVectorT);
    const trees = schema.NeutralTreeTable.endNeutralTreeTable(builder);

    // Create the game map
    let nameP = builder.createString(name);
    schema.GameMap.startGameMap(builder);
    schema.GameMap.addName(builder, nameP);
    schema.GameMap.addMinCorner(builder, schema.Vec.createVec(builder, minCorner.x, minCorner.y));
    schema.GameMap.addMaxCorner(builder, schema.Vec.createVec(builder, maxCorner.x, maxCorner.y));
    schema.GameMap.addBodies(builder, bodies);
    schema.GameMap.addTrees(builder, trees);
    schema.GameMap.addRandomSeed(builder, randomSeed);
    const map = schema.GameMap.endGameMap(builder);

    // Return the game map to write to a file
    builder.finish(map);
    return builder.asUint8Array();
  }

  /**
   * When there isn't a scaffold, let the user download the file
   */
  private exportFile(data: Uint8Array, fileName: string) {
    let mimeType = "application/octet-stream";

    if (data != undefined) {
      let blob = new Blob([data], { type: mimeType });
      let url = window.URL.createObjectURL(blob);

      // Create phantom link
      let link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.style.display = "none";
      link.click();
      link.remove();

      setTimeout(function() {
        return window.URL.revokeObjectURL(url);
      }, 30000);
    }
  }
}
