import {Config, Mode} from '../config';
import * as imageloader from '../imageloader';
import * as cst from '../constants';

/**
 * Game controls: pause/unpause, fast forward, rewind
 */
export default class Controls {
  div: HTMLDivElement;
  wrapper: HTMLDivElement;

  readonly timeReadout: Text;
  readonly speedReadout: Text;
  readonly locationReadout: Text;
  readonly infoString: HTMLTableDataCellElement;

  // UPS slider
  private sliderBar: HTMLDivElement;
  private sliderBtn: HTMLDivElement;

  // Callbacks initialized from outside Controls
  // Yeah, it's pretty gross :/
  onGameLoaded: (data: ArrayBuffer) => void;
  onTogglePause: () => void;
  onToggleUPS: () => void;
  onToggleRewind: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSeek: (frame: number) => void;

  // qualities of progress bar
  canvas: HTMLCanvasElement;
  maxFrame: number;
  ctx;

  // buttons
  readonly conf: Config;
  readonly imgs: {
    playbackStart: HTMLImageElement,
    playbackPause: HTMLImageElement,
    playbackStop: HTMLImageElement,
    goNext: HTMLImageElement,
    goPrevious: HTMLImageElement,
    upload: HTMLImageElement
  };

  constructor(conf: Config, images: imageloader.AllImages) {
    this.div = this.baseDiv();
    this.timeReadout = document.createTextNode('No match loaded');
    this.speedReadout = document.createTextNode('UPS: 0 FPS: 0');
    this.locationReadout = document.createTextNode('Location: (???, ???)');

    // initialize the images
    this.conf = conf;
    this.imgs = {
      playbackStart: images.controls.playbackStart,
      playbackPause: images.controls.playbackPause,
      playbackStop: images.controls.playbackStop,
      goNext: images.controls.goNext,
      goPrevious: images.controls.goPrevious,
      upload: images.controls.upload
    }

    let table = document.createElement("table");
    let tr = document.createElement("tr");

    // create the timeline
    let timeline = document.createElement("td");
    timeline.appendChild(this.timeline());
    timeline.appendChild(document.createElement("br"));
    timeline.appendChild(this.timeReadout);

    // create the speed slider
    let slider = document.createElement("td");
    slider.vAlign = "top";
    slider.style.padding = "0px 16px";
    slider.appendChild(this.slider());
    slider.appendChild(document.createElement("br"));
    slider.appendChild(this.speedReadout);

    // create the button controls
    let buttons = document.createElement("td");
    buttons.vAlign = "top";
    buttons.appendChild(this.createButton("playbackPause", () => this.pause(), "playbackStart"));
    buttons.appendChild(this.createButton("playbackStop", () => this.restart()));
    buttons.appendChild(this.createButton("goPrevious", () => this.stepBackward()));
    buttons.appendChild(this.createButton("goNext", () => this.stepForward()));
    buttons.appendChild(this.uploadFileButton());
    buttons.appendChild(document.createElement("br"));
    buttons.appendChild(this.locationReadout);

    // create the info string display
    let infoString = document.createElement("td");
    infoString.vAlign = "top";
    infoString.style.fontSize = "11px";
    this.infoString = infoString;

    table.appendChild(tr);
    tr.appendChild(timeline);
    tr.appendChild(slider);
    tr.appendChild(buttons);
    tr.appendChild(infoString);

    this.wrapper = document.createElement("div");
    this.wrapper.appendChild(table);
    this.div.appendChild(this.wrapper);
  }

  /**
   * @param content name of the image in this.imgs to display in the button
   * @param onclick function to call on click
   * @param hiddenContent name of the image in this.imgs to display as none
   * @return a button with the given attributes
   */
  private createButton(content, onclick, hiddenContent?) {
    let button = document.createElement("button");
    button.setAttribute("class", "custom-button");
    button.setAttribute("type", "button");
    button.id = content;

    button.appendChild(this.imgs[content]);

    if (hiddenContent != null) {
      let hiddenImage = this.imgs[hiddenContent];
      hiddenImage.style.display = "none";
      button.appendChild(hiddenImage);
    }
    button.onclick = onclick;

    return button;
  }

  private uploadFileButton() {
    // disguise the default upload file button with a label
    let uploadLabel = document.createElement("label");
    uploadLabel.setAttribute("for", "file-upload");
    uploadLabel.setAttribute("class", "custom-button");
    uploadLabel.appendChild(this.imgs["upload"]);

    // create the functional button
    let upload = document.createElement('input');
    upload.id = "file-upload";
    upload.setAttribute('type', 'file');
    upload.accept = '.bc17';
    upload.onchange = () => this.loadMatch(upload.files as FileList);
    uploadLabel.appendChild(upload);

    return uploadLabel;
  }

  /**
   * Make the controls look good
   */
  private baseDiv() {
    let div = document.createElement("div");
    div.id = "baseDiv";

    return div;
  }

  private timeline() {
    let canvas = document.createElement("canvas");
    canvas.id = "timelineCanvas";
    canvas.width = 400;
    canvas.height = 1;
    this.ctx = canvas.getContext("2d");
    this.ctx.fillStyle = "white";
    this.canvas = canvas;
    return canvas;
  }

  /**
   * Creates the slider that adjusts UPS
   */
  private slider(): HTMLDivElement {
    const div = document.createElement("div");
    const slider = document.createElement("div");
    slider.className = "slide-control";
    const btn = document.createElement("div");
    btn.className = "slide-control-button";

    let startOffset, sliderWidth, handleWidth;

    btn.onmousedown = function(e) {
      e.preventDefault();
      handleWidth = btn.clientWidth / 2;
      startOffset = e.pageX - btn.offsetLeft - handleWidth;
      sliderWidth = slider.clientWidth;
      document.onmousemove = moveHandler;
      document.onmouseup = stopHandler;
    };

    const moveHandler = (e: MouseEvent) => {
      const zeroOffset = 30;
      const zeroBuffer = 4;
      var posX = e.pageX - startOffset;
      posX = Math.min(Math.max(0, posX), sliderWidth);

      // Snap to 0 UPS if within buffer
      posX = Math.abs(zeroOffset - posX) < zeroBuffer ? zeroOffset : posX;
      btn.style.left = `${posX}px`;
      this.onToggleUPS();
    }

    const stopHandler = () => {
      document.onmousemove = () => {};
      document.onmouseup = () => {};
    }

    div.appendChild(slider);
    slider.appendChild(btn);
    this.sliderBar = slider;
    this.sliderBtn = btn;
    return div;
  }

  /**
   * Returns the UPS determined by the slider
   */
  getUPS(): number {
    const zeroOffset = 30;
    const handleWidth = this.sliderBtn.clientWidth / 2
    const buttonOffset = this.sliderBtn.offsetLeft + handleWidth
    const upsMagnitude = 0.01 * Math.pow(buttonOffset - 30, 2);
    const ups = buttonOffset < zeroOffset ? -upsMagnitude : upsMagnitude;
    return Math.round(ups);
  }

  /**
   * Displays the correct controls depending on whether we are in game mode
   * or map editor mode
   */
  setControls = () => {
    const mode = this.conf.mode;

    // The controls can be anything in help mode
    if (mode === Mode.HELP) return;

    // Otherwise clear the controls...
    while (this.div.firstChild) {
      this.div.removeChild(this.div.firstChild);
    }

    // ...and add the correct thing
    if (mode !== Mode.MAPEDITOR) {
      this.div.appendChild(this.wrapper);
    }
  };

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
   * Whether or not the simulation is paused.
   */
  isPaused() {
    return this.imgs.playbackPause.style.display === "none";
  }

  /**
   * Pause our simulation.
   */
  pause() {
    this.onTogglePause();

    // toggle the play/pause button
    if (this.isPaused()) {
      this.imgs["playbackStart"].style.display = "none";
      this.imgs["playbackPause"].style.display = "unset";
    } else {
      this.imgs["playbackStart"].style.display = "unset";
      this.imgs["playbackPause"].style.display = "none";
    }
  }

  /**
   * Restart simulation.
   */
  restart() {
    const pauseButton = document.getElementById("playbackPause");
    if (!this.isPaused() && pauseButton) {
      pauseButton.click();
    }
    this.onSeek(0);
  }

  /**
   * Steps forward one turn in the simulation
   */
  stepForward() {
    this.onStepForward();
  }

  /**
   * Steps backward one turn in the simulation
   */
  stepBackward() {
    this.onStepBackward();
  }

  /**
   * Redraws the timeline and sets the current round displayed in the controls.
   */
  setTime(time: number, loadedTime: number, ups: number, fps: number) {
    // Redraw the timeline
    const scale = this.canvas.width / cst.MAX_ROUND_NUM;
    this.ctx.fillStyle = "#fff";
    this.ctx.fillRect(0, 0, time * scale, this.canvas.height)
    this.ctx.fillStyle = "#151515";
    this.ctx.fillRect(time * scale, 0, (loadedTime - time) * scale, this.canvas.height)
    this.ctx.clearRect(loadedTime * scale, 0, this.canvas.width, this.canvas.height)

    // Edit the text
    this.timeReadout.textContent = `TIME: ${time+1}/${loadedTime+1}`;
    this.speedReadout.textContent = `UPS: ${ups | 0} FPS: ${fps | 0}`;
  }

  /**
   * Updates the location readout
   */
  setLocation(x, y): void {
    this.locationReadout.textContent = `Location (${x.toFixed(3)}, ${y.toFixed(3)})`;
  }

  /**
   * Display an info string in the controls bar
   * "Robot ID id
   * Location: (x, y)
   * Health: health/maxHealth
   * Bytecodes Used: bytecodes"
   */
  setInfoString(id, x, y, health, maxHealth, bytecodes?: number): void {
    if (bytecodes !== undefined) {
      // Not a neutral tree or bullet tree
      this.infoString.innerHTML = `Robot ID ${id}<br>
        Location: (${x.toFixed(3)}, ${y.toFixed(3)})<br>
        Health: ${health.toFixed(3)}/${maxHealth.toFixed(3)}<br>
        Bytecodes Used: ${bytecodes}`;
    } else {
      // Neutral tree or bullet tree, no bytecode information
      this.infoString.innerHTML = `Robot ID ${id}<br>
        Location: (${x.toFixed(3)}, ${y.toFixed(3)})<br>
        Health: ${health.toFixed(3)}/${maxHealth.toFixed(3)}`;
    }
  }
}
