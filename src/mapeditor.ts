import {Config} from './config';
import {AllImages} from './imageloader';
import MapEditorForm from './mapeditorform';
import {MapUnit} from './maprenderer';

import {schema, flatbuffers} from 'battlecode-playback';

import Victor = require('victor');
import {createWriteStream} from 'fs';

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
    this.div = document.createElement("div");
    this.div.appendChild(this.form.div);
    this.div.appendChild(this.exportButton());
    this.images = images;
    this.conf = conf;
  }

  private exportButton(): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.appendChild(document.createTextNode("EXPORT!"));
    button.onclick = () => {this.exportFile()};
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
   * Write fields to a schema.GameMap and write the game map out to a file
   */
  private generateMap(): Uint8Array | undefined {
    if (!this.form.isValid()) {
      alert("This map is invalid! Make sure all of the fields are filled out.");
      return;
    }

    let builder = new flatbuffers.Builder();

    // Spawned body information
    let b: {
      robotIDs: number[],
      teamIDs: number[],
      types: schema.BodyType[],
      xs: number[],
      ys: number[]
    } = {robotIDs: [], teamIDs: [], types: [], xs: [], ys: []};
    // Neutral tree information
    let t: {
      robotIDs: number[],
      xs: number[],
      ys: number[],
      radii: number[],
      containedBullets: number[],
      containedBodies: schema.BodyType[]
    } = {robotIDs: [], xs: [], ys: [], radii: [], containedBullets: [], containedBodies: []};

    // Get body information from form and convert to arrays
    let formBodies: Map<number, MapUnit> = this.form.bodies;
    let formSymBodies: Map<number, MapUnit> = this.form.symmetricBodies;
    formBodies.forEach(function(unit: MapUnit, id: number) {
      let realID = id * 2; // To have unique ids for symmetric units
      if (unit.type === TREE) {
        t.robotIDs.push(realID);
        t.xs.push(unit.loc.x);
        t.ys.push(unit.loc.y);
        t.radii.push(unit.radius);
        t.containedBullets.push(unit.containedBullets || 0);
        t.containedBodies.push(unit.containedBody || TREE); // TODO
      } else if (unit.type === ARCHON) {
        b.robotIDs.push(realID);
        b.teamIDs.push(1); // Team 1 ID
        b.types.push(ARCHON);
        b.xs.push(unit.loc.x);
        b.ys.push(unit.loc.y);
      }
    });
    formSymBodies.forEach(function(unit: MapUnit, id: number) {
      let realID = id * 2 + 1; // To have unique ids for symmetric units
      if (unit.type === TREE) {
        t.robotIDs.push(realID);
        t.xs.push(unit.loc.x);
        t.ys.push(unit.loc.y);
        t.radii.push(unit.radius);
        t.containedBullets.push(unit.containedBullets || 0);
        t.containedBodies.push(unit.containedBody || TREE); // TODO
      } else if (unit.type === ARCHON) {
        b.robotIDs.push(realID);
        b.teamIDs.push(2); // Team 2 ID
        b.types.push(ARCHON);
        b.xs.push(unit.loc.x);
        b.ys.push(unit.loc.y);
      }
    });

    // Get header information from form
    let name: string = this.form.name;
    let minCorner: Victor = new Victor(Math.random()*500, Math.random()*500);
    let maxCorner: Victor = minCorner.clone();
    maxCorner.add(new Victor(this.form.width, this.form.height));
    let randomSeed: number = Math.round(Math.random()*1000);

    // Create the spawned bodies table
    let robotIDsVectorB = schema.SpawnedBodyTable.createRobotIDsVector(builder, b.robotIDs);
    let teamIDsVectorB = schema.SpawnedBodyTable.createTeamIDsVector(builder, b.teamIDs);
    let typesVectorB = schema.SpawnedBodyTable.createTypesVector(builder, b.types)
    let locsVecTableB = this.createVecTable(builder, b.xs, b.ys);
    schema.SpawnedBodyTable.startSpawnedBodyTable(builder)
    schema.SpawnedBodyTable.addRobotIDs(builder, robotIDsVectorB);
    schema.SpawnedBodyTable.addTeamIDs(builder, teamIDsVectorB);
    schema.SpawnedBodyTable.addTypes(builder, typesVectorB);
    schema.SpawnedBodyTable.addLocs(builder, locsVecTableB);
    const bodies = schema.SpawnedBodyTable.endSpawnedBodyTable(builder);

    // Create the neutral trees table
    let robotIDsVectorT = schema.NeutralTreeTable.createRobotIDsVector(builder, t.robotIDs);
    let locsVecTableT = this.createVecTable(builder, t.xs, t.ys);
    let radiiVectorT = schema.NeutralTreeTable.createRadiiVector(builder, t.radii);
    let containedBulletsVectorT = schema.NeutralTreeTable.createContainedBulletsVector(builder, t.containedBullets);
    let containedBodiesVectorT = schema.NeutralTreeTable.createContainedBodiesVector(builder, t.containedBodies);
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

  private exportFile() {
    let fileName = `${this.form.name}.bcmap`;
    let mimeType = "application/octet-stream";
    let data: Uint8Array | undefined = this.generateMap();

    if (data != undefined) {
      let blob = new Blob([data], { type: mimeType });
      let url = window.URL.createObjectURL(blob);

      let link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.style.display = "none";
      link.click();
      link.remove();

      setTimeout(function() {
        return window.URL.revokeObjectURL(url);
      }, 1000);
    }
  }
}

const ARCHON = schema.BodyType.ARCHON;
const TREE = schema.BodyType.TREE_NEUTRAL;