import * as cst from '../../constants';

export enum Symmetry {
  ROTATIONAL,
  HORIZONTAL,
  VERTICAL
};

export default class SymmetryForm {

  // The public div
  readonly div: HTMLDivElement;

  // HTML elements
  private select: HTMLSelectElement;

  // Callback on input change to redraw the canvas
  private cb: () => void;

  // Constants
  private readonly SYMMETRY_OPTIONS: Symmetry[] = [
    Symmetry.ROTATIONAL, Symmetry.HORIZONTAL, Symmetry.VERTICAL
  ];

  constructor(cb: () => void) {

    // Store the callback
    this.cb = cb;

    // Create the HTML elements
    this.div = document.createElement("div");
    this.select = document.createElement("select");

    // Create the form
    this.loadInputs();
    this.div.appendChild(this.createForm());
    this.loadCallbacks();
  }

  /**
   * Initializes input fields
   */
  private loadInputs(): void {
    this.SYMMETRY_OPTIONS.forEach((option: Symmetry) => {
      let opt = document.createElement("option");
      opt.value = String(option);
      opt.appendChild(document.createTextNode(cst.symmetryToString(option)));
      this.select.appendChild(opt);
    });
  }

  /**
   * Creates the form that selects symmetry.
   */
  private createForm(): HTMLFormElement {
    const form = document.createElement("form");
    form.appendChild(document.createTextNode("Symmetry:"));
    form.appendChild(this.select);
    form.appendChild(document.createElement("br"));
    form.appendChild(document.createElement("br"));
    return form;
  }

  /**
   * Add callbacks to the form elements
   */
  private loadCallbacks(): void {
    this.select.onchange = () => {
      // Rerender the canvas
      this.cb();
    }
  }

  /**
   * The symmetry of the map currently selected
   */
  getSymmetry(): Symmetry {
    return parseInt(this.select.options[this.select.selectedIndex].value);
  }
}