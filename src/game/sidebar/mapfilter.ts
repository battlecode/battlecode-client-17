import ScaffoldCommunicator from '../../scaffold';

export enum MapType {
  DEFAULT,
  SPRINT,
  SEEDING,
  QUALIFYING,
  FINAL,
  CUSTOM
};

export type MapSchema = {
  name: string,
  type: MapType,
  input: HTMLInputElement,
  label: HTMLLabelElement,
  div: HTMLDivElement
};

export default class MapFilter {

  // The public div and other HTML containers
  readonly div: HTMLDivElement;
  private readonly filterDiv: HTMLDivElement;
  private readonly mapsDiv: HTMLDivElement;

  // Input to filter maps by name
  private readonly filterName: HTMLInputElement;
  private readonly filterType: Map<MapType, HTMLInputElement>;

  // Map types available (NOTE: Update after each tournament)
  private readonly types: MapType[] = [MapType.DEFAULT, MapType.SPRINT,
    MapType.SEEDING, MapType.CUSTOM];

  // All the maps displayed on the client
  private maps: Array<MapSchema>;

  // The scaffold
  private scaffold: ScaffoldCommunicator;
  private cb = (err: Error | null, maps?: Set<string>) => {
    // There was an error
    if (err) {
      console.log(err);
      return;
    }

    // Found the maps
    if (maps) {
      // Re-index the maps
      this.indexMaps(maps);
      this.maps.forEach((map: MapSchema) => {
        this.mapsDiv.appendChild(map.label);
      });

      // Refresh the UI
      this.applyFilter();
    }
  }

  constructor() {
    this.div = document.createElement("div");

    // Create the HTML elements
    this.filterDiv = document.createElement("div");
    this.mapsDiv = document.createElement("div");
    this.mapsDiv.id = "mapsDiv";
    this.filterName = document.createElement("input");
    this.filterType = new Map<MapType, HTMLInputElement>();
    this.maps = new Array<MapSchema>();

    // Add the HTML elements to the UI
    this.div.appendChild(this.filterDiv);
    this.div.appendChild(this.mapsDiv);
    this.loadFilters();
    this.addHTMLElements();
  }

  /**
   * Indexes maps internally by alphabetical order.
   */
  private indexMaps(maps: Set<string>): void {
    this.maps = new Array();
    maps.forEach((map: string) => {
      const checkbox = document.createElement("input");
      const label = document.createElement("label");
      const div = document.createElement("div");

      // Create a checkbox for each map...
      checkbox.type = "checkbox";
      checkbox.id = `${map}Map`;
      checkbox.value = map;
      checkbox.checked = false;
      checkbox.style.display = "none";
      checkbox.onchange = () => {
        div.className = checkbox.checked ? "map-label selected" : "map-label";
      }

      // ...disguise the checkbox with a nice-looking label...
      div.className = "map-label";
      div.appendChild(checkbox);
      div.appendChild(document.createTextNode(map));
      label.setAttribute("for", checkbox.id);
      label.appendChild(div);
      label.style.display = "unset";

      // ...and store it internally.
      this.maps.push({
        name: map,
        type: this.mapNameToMapType(map),
        input: checkbox,
        label: label,
        div: div
      });
    });

    // Sort the maps in alphabetical order
    this.maps.sort(function(a: MapSchema, b: MapSchema) {
      const aName: string = a.name.toLowerCase();
      const bName: string = b.name.toLowerCase();
      if (aName < bName) {
        return -1;
      } else if (aName > bName) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  /**
   * Creates the input elements for selecting filters
   */
  private loadFilters(): void {
    // Filter for map name
    this.filterName.type = "text";
    this.filterName.onkeyup = () => { this.applyFilter() };
    this.filterName.onchange = () => { this.applyFilter() };

    // Filter for map type
    for (let type of this.types) {
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = String(type);
      checkbox.checked = true;
      checkbox.onchange = () => {
        this.applyFilter();
      }
      this.filterType.set(type, checkbox);
    }
  }

  /**
   * Adds the input elements to the UI
   */
  private addHTMLElements(): void {
    this.filterDiv.appendChild(document.createTextNode("Search: "));
    this.filterDiv.appendChild(this.filterName);
    this.filterDiv.appendChild(document.createElement("br"));

    this.filterType.forEach((checkbox: HTMLInputElement, type: MapType) => {
      const span = document.createElement("span");
      span.appendChild(checkbox);
      span.appendChild(document.createTextNode(this.mapTypeToString(type)));
      this.filterDiv.appendChild(span);
    });
  }

  /**
   * Helper method.
   */
  private mapTypeToString(type: MapType): string {
    switch(type) {
      case MapType.DEFAULT: return "Default";
      case MapType.SPRINT: return "Sprint";
      case MapType.SEEDING: return "Seeding";
      case MapType.QUALIFYING: return "Qualifying";
      case MapType.FINAL: return "Final";
      default: return "Custom";
    }
  }

  /**
   * Helper method.
   */
  private mapNameToMapType(name: string): MapType {
    // TODO: If someone names their map the same as a default map, things get
    // messed up. We should just create a list of banned names in the editor.
    switch(name) {
      case "Barrier": return MapType.DEFAULT;
      case "DenseForest": return MapType.DEFAULT;
      case "Enclosure": return MapType.DEFAULT;
      case "Hurdle": return MapType.DEFAULT;
      case "LineOfFire": return MapType.DEFAULT;
      case "MagicWood": return MapType.DEFAULT;
      case "shrine": return MapType.DEFAULT;
      case "SparseForest": return MapType.DEFAULT;
      case "Arena": return MapType.SPRINT;
      case "Barbell": return MapType.SPRINT;
      case "Boxed": return MapType.SPRINT;
      case "Bullseye": return MapType.SPRINT;
      case "Chess": return MapType.SPRINT;
      case "Clusters": return MapType.SPRINT;
      case "Cramped": return MapType.SPRINT;
      case "CrossFire": return MapType.SPRINT;
      case "DigMeOut": return MapType.SPRINT;
      case "GiantForest": return MapType.SPRINT;
      case "LilForts": return MapType.SPRINT;
      case "Maniple": return MapType.SPRINT;
      case "MyFirstMap": return MapType.SPRINT;
      case "OMGTree": return MapType.SPRINT;
      case "PasscalsTriangles": return MapType.SPRINT;
      case "Shrubbery": return MapType.SPRINT;
      case "Sprinkles": return MapType.SPRINT;
      case "Standoff": return MapType.SPRINT;
      case "Waves": return MapType.SPRINT;
      case "1337Tree": return MapType.SEEDING;
      case "Aligned": return MapType.SEEDING;
      case "Alone": return MapType.SEEDING;
      case "Blitzkrieg": return MapType.SEEDING;
      case "BugTrap": return MapType.SEEDING;
      case "Captive": return MapType.SEEDING;
      case "Caterpillar": return MapType.SEEDING;
      case "Chevron": return MapType.SEEDING;
      case "Conga": return MapType.SEEDING;
      case "CropCircles": return MapType.SEEDING;
      case "Croquembouche": return MapType.SEEDING;
      case "DarkSide": return MapType.SEEDING;
      case "DeathStar": return MapType.SEEDING;
      case "Defenseless": return MapType.SEEDING;
      case "Fancy": return MapType.SEEDING;
      case "FlappyTree": return MapType.SEEDING;
      case "Grass": return MapType.SEEDING;
      case "GreatDekuTree": return MapType.SEEDING;
      case "GreenHouse": return MapType.SEEDING;
      case "HedgeMaze": return MapType.SEEDING;
      case "HiddenTunnel": return MapType.SEEDING;
      case "HouseDivided": return MapType.SEEDING;
      case "Interference": return MapType.SEEDING;
      case "Lanes": return MapType.SEEDING;
      case "Levels": return MapType.SEEDING;
      case "LilMaze": return MapType.SEEDING;
      case "Misaligned": return MapType.SEEDING;
      case "ModernArt": return MapType.SEEDING;
      case "Ocean": return MapType.SEEDING;
      case "Oxygen": return MapType.SEEDING;
      case "PacMan": return MapType.SEEDING;
      case "PeacefulEncounter": return MapType.SEEDING;
      case "Planets": return MapType.SEEDING;
      case "Present": return MapType.SEEDING;
      case "PureImagination": return MapType.SEEDING;
      case "Shortcut": return MapType.SEEDING;
      case "Slant": return MapType.SEEDING;
      case "Snowflake": return MapType.SEEDING;
      case "TheOtherSide": return MapType.SEEDING;
      case "TicTacToe": return MapType.SEEDING;
      case "TreeFarm": return MapType.SEEDING;
      case "Turtle": return MapType.SEEDING;
      case "Whirligig": return MapType.SEEDING;
      default: return MapType.CUSTOM;
    }
  }

  /**
   * Helper method that returns the map name being searched for, or undefined
   * if the search field is empty.
   */
  private getSearchedRegex(): RegExp | undefined {
    const value = this.filterName.value.trim().toLowerCase();
    return value === "" ? undefined : new RegExp(`^${value}`);
  }

  /**
   * Helper method that returns the list of selected map types.
   */
  private getTypes(): MapType[] {
    const types: MapType[] = new Array();
    this.filterType.forEach((checkbox: HTMLInputElement, type: MapType) => {
      if (checkbox.checked) {
        types.push(type);
      }
    });
    return types;
  }

  /**
   * Displays maps based on the current filter.
   */
  private applyFilter(): void {
    const regex: RegExp | undefined = this.getSearchedRegex();
    const types: MapType[] = this.getTypes();

    this.maps.forEach((map: MapSchema) => {
      const matchedType: boolean = types.includes(map.type);
      const matchedName: boolean = regex === undefined ||
        map.name.toLowerCase().search(regex) !== -1;
      map.label.style.display = matchedType && matchedName ? "unset" : "none";
    });
  }

  /**
   * Adds a scaffold and loads all the maps internally.
   */
  addScaffold(scaffold: ScaffoldCommunicator): void {
    this.scaffold = scaffold;
  }

  /**
   * Removes and reloads the maps displayed in the client.
   * (Can only be called after the scaffold is added)
   */
  refresh(): void {
    while (this.mapsDiv.firstChild) {
      this.mapsDiv.removeChild(this.mapsDiv.firstChild);
    }
    this.scaffold.getMaps(this.cb);
  }

  /**
   * Selects all visible maps
   */
  selectAll(): void {
    this.maps.forEach((map: MapSchema) => {
      if (map.label.style.display !== "none" && !map.input.checked) {
        map.label.click();
      }
    });
  }

  /**
   * Deselects all visible maps
   */
  deselectAll(): void {
    this.maps.forEach((map: MapSchema) => {
      if (map.label.style.display !== "none" && map.input.checked) {
        map.label.click();
      }
    });
  }

  /**
   * @return the selected maps
   */
  getMaps(): string[] {
    const maps: string[] = new Array();
    this.maps.forEach((map: MapSchema) => {
      if (map.input.checked) {
        maps.push(map.name);
      }
    });
    return maps;
  }
}