import * as imageloader from './imageloader';

/**
 * Game controls: pause/unpause, fast forward, rewind
 */
export default class Controls {
  div: HTMLDivElement;

  readonly speedReadout: Text;

  // Callbacks initialized from outside Controls
  // Yeah, it's pretty gross :/
  onGameLoaded: (data: ArrayBuffer) => void;
  onTogglePause: () => void;
  onToggleForward: () => void;
  onSeek: (frame: number) => void;

  // qualities of progress bar
  canvas: HTMLCanvasElement;
  ctx;

  // buttons
  img: imageloader.AllImages;

  constructor(images: imageloader.AllImages) {
    this.div = this.baseDiv();
    this.img = images;

    let uploadLabel = document.createElement("label");
    uploadLabel.setAttribute("for", "file-upload");
    uploadLabel.setAttribute("class", "custom-button");
    uploadLabel.appendChild(this.img.controls.start);

    let upload = document.createElement('input');
    upload.id = "file-upload";
    upload.setAttribute('type', 'file');
    upload.accept = '.bc17';
    upload.onchange = () => this.loadMatch(upload.files as FileList);
    uploadLabel.appendChild(upload);
    this.speedReadout = document.createTextNode('No match loaded');

    let table = document.createElement("table");
    let tr = document.createElement("tr");

    // create the timeline
    let timeline = document.createElement("td");
    timeline.appendChild(this.timeline());

    // create the button controls
    let buttons = document.createElement("td");
    buttons.appendChild(this.createButton(this.img.controls.pause, () => this.pause()));
    buttons.appendChild(this.createButton(this.img.controls.backward, () => this.restart()));
    buttons.appendChild(this.createButton(this.img.controls.forward, () => this.forward()));
    buttons.appendChild(uploadLabel);
    buttons.appendChild(this.speedReadout);

    table.appendChild(tr);
    tr.appendChild(timeline);
    tr.appendChild(buttons);
    this.div.appendChild(table);
  }

  /**
   * @param content of the button (like text or an image)
   * @param function to call on click
   * @return a button with the given attributes
   */
  private createButton(content, onclick) {
    let button = document.createElement("button");
    button.setAttribute("class", "custom-button");
    button.setAttribute("type", "button");
    button.appendChild(content);
    button.onclick = onclick;

    return button;
  }

  /**
   * Make the controls look good
   */
  private baseDiv() {
    let div = document.createElement("div");

    // Positioning
    div.style.width = "100%";
    div.style.height = "40px";
    div.style.marginLeft = "310px";
    div.style.position = "fixed";
    div.style.zIndex = "0.5";
    div.style.top = "0";
    div.style.overflowX = "hidden";
    div.style.overflowY = "hidden";

    // Inner style and formatting
    div.style.color = "white";
    div.style.backgroundColor = "#444";
    div.style.padding = "10px";

    return div;
  }

  private timeline() {
    let canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 32;
    canvas.style.backgroundColor = "#222";
    canvas.style.display = "inline-block";
    this.ctx = canvas.getContext("2d");
    this.ctx.fillStyle = "white";

    canvas.addEventListener("mousedown", function(event) {
      // TODO: update the progress bar and jump to this time in the game
      // let offsetLeft = 330;
      // let width = event.x - offsetLeft;
      // let frame = width * 3000 / this.width;
      // onSeek(width);
    }, false);

    this.canvas = canvas;
    return canvas;
  }

  drawProgress(frame: number, maxFrame: number) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillRect(0, 0, this.canvas.width * frame / maxFrame, this.canvas.height)
  }

  /**
   * Upload a battlecode match file.
   */
  loadMatch(files: FileList) {
    console.log(files);
    const file = files[0];
    console.log(file);
    const reader = new FileReader();
    reader.onload = () => {
      this.onGameLoaded(reader.result);
    };
    reader.readAsArrayBuffer(file);
  }

  /**
   * Pause our simulation.
   */
  pause() {
    this.onTogglePause();
    console.log('PAUSE');
  }

  /**
   * Fast forward our simulation.
   */
  forward() {
    console.log('FORWARD');
    this.onToggleForward();
  }

  /**
   * Restart simulation.
   */
  restart() {
    console.log('RESTART');
    this.onSeek(0);
  }

  setTime(time: number, loadedTime: number, ups: number, fps: number) {
    this.drawProgress(time, loadedTime);
    this.speedReadout.textContent =
      ` TIME: ${time}/${loadedTime} UPS: ${ups | 0} FPS: ${fps | 0}`;

  }

  /**
   * Stop running the simulation, release all resources.
   */
  destroy() {
    console.log('DESTROY');
  }
}
