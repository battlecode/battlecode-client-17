import {StructOfArrays, Metadata, GameWorld} from 'battlecode-playback';
import {schema, flatbuffers} from 'battlecode-schema';

/**
 * For interpolated rendering.
 */
export default class NextStep {
  /**
   * {
   *   id: Int32Array,
   *   x: Float32Array,
   *   y: Float32Array
   * }
   */
  bodies: StructOfArrays;

  // Cache fields
  private _vecTableSlot: schema.VecTable;

  constructor() {
    this.bodies = new StructOfArrays({
      id: Int32Array,
      x: Float32Array,
      y: Float32Array
    }, 'id');
    this._vecTableSlot = new schema.VecTable();
  }

  /**
   * Load where robots will be in the next time step,
   * so that we can smoothly transition between steps.
   */
  loadNextStep(world: GameWorld, delta: schema.Round) {
    this.bodies.copyFrom(world.bodies);
    if (delta.roundID() != world.turn + 1) {
      throw new Error(`Bad Round [lerp]: world.turn = ${world.turn}, round.roundID() = ${delta.roundID()}`);
    }

    const movedLocs = delta.movedLocs(this._vecTableSlot);
    this.bodies.alterBulk({
      id: delta.movedIDsArray(),
      x: movedLocs.xsArray(),
      y: movedLocs.ysArray()
    });
  }
}
