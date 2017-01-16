import {Config, Mode} from '../config';
import * as imageloader from '../imageloader';
import * as cst from '../constants';

/**
 * Game controls: pause/unpause, fast forward, rewind
 */
export default class Controls {
  div: HTMLDivElement;
  wrapper: HTMLDivElement;

  readonly speedReadout: Text;
  readonly locationReadout: Text;
  readonly infoString: HTMLTableDataCellElement;

  // Callbacks initialized from outside Controls
  // Yeah, it's pretty gross :/
  onGameLoaded: (data: ArrayBuffer) => void;
  onTogglePause: () => void;
  onToggleForward: () => void;
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
    seekForward: HTMLImageElement,
    skipForward: HTMLImageElement,
    seekBackward: HTMLImageElement,
    skipBackward: HTMLImageElement,
    goNext: HTMLImageElement,
    goPrevious: HTMLImageElement,
    upload: HTMLImageElement
  };

  constructor(conf: Config, images: imageloader.AllImages) {
    this.div = this.baseDiv();
    this.speedReadout = document.createTextNode('No match loaded');
    this.locationReadout = document.createTextNode('Location: (???, ???)');

    // initialize the images
    this.conf = conf;
    this.imgs = {
      playbackStart: images.controls.playbackStart,
      playbackPause: images.controls.playbackPause,
      playbackStop: images.controls.playbackStop,
      seekForward: images.controls.seekForward,
      skipForward: images.controls.skipForward,
      seekBackward: images.controls.seekBackward,
      skipBackward: images.controls.skipBackward,
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
    timeline.appendChild(this.speedReadout);

    // create the button controls
    let buttons = document.createElement("td");
    buttons.vAlign = "top";
    buttons.appendChild(this.createButton("playbackPause", () => this.pause(), "playbackStart"));
    buttons.appendChild(this.createButton("playbackStop", () => this.restart()));
    buttons.appendChild(this.createButton("skipBackward", () => this.rewind(), "seekBackward"));
    buttons.appendChild(this.createButton("skipForward", () => this.forward(), "seekForward"));
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
    canvas.height = 32;
    canvas.style.backgroundColor = "#222";
    canvas.style.display = "inline-block";
    canvas.style.width = "400";
    canvas.style.height = "32";
    this.ctx = canvas.getContext("2d");
    this.ctx.fillStyle = "white";
    this.canvas = canvas;
    return canvas;
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

    // Reset buttons
    this.resetButtons();
    this.imgs["playbackStart"].style.display = "unset";
    this.imgs["playbackPause"].style.display = "none";
  }

  resetButtons() {
    // Reset buttons
    this.imgs["playbackStart"].style.display = "none";
    this.imgs["playbackPause"].style.display = "unset";
    this.imgs["seekBackward"].style.display = "none";
    this.imgs["skipBackward"].style.display = "unset";
    this.imgs["seekForward"].style.display = "none";
    this.imgs["skipForward"].style.display = "unset";
  }

  /**
   * Pause our simulation.
   */
  pause() {
    this.onTogglePause();

    // toggle the play/pause button
    const isNowPaused: boolean = this.imgs.playbackPause.style.display === "none";
    this.resetButtons();
    if (isNowPaused) {
      this.imgs["playbackStart"].style.display = "none";
      this.imgs["playbackPause"].style.display = "unset";
    } else {
      this.imgs["playbackStart"].style.display = "unset";
      this.imgs["playbackPause"].style.display = "none";
    }
  }

  /**
   * Fast forward our simulation.
   */
  forward() {
    this.onToggleForward();

    // toggle speeds between regular speed and fast forward
    const isNowSkipping: boolean = this.imgs.skipForward.style.display === "none";
    this.resetButtons();
    if (isNowSkipping) {
      this.imgs["seekForward"].style.display = "none";
      this.imgs["skipForward"].style.display = "unset";
    } else {
      this.imgs["seekForward"].style.display = "unset";
      this.imgs["skipForward"].style.display = "none";
    }
  }

  /**
   * Continuous rewind of the simulation
   */
  rewind() {
    this.onToggleRewind();

    // toggle speeds between rewind and regular speed
    const isNowSkipping: boolean = this.imgs.skipForward.style.display === "none";
    this.resetButtons();
    if (isNowSkipping) {
      this.imgs["seekBackward"].style.display = "none";
      this.imgs["skipBackward"].style.display = "unset";
    } else {
      this.imgs["seekBackward"].style.display = "unset";
      this.imgs["skipBackward"].style.display = "none";
    }
  }

  /**
   * Restart simulation.
   */
  restart() {
    const isPlaying: boolean = this.imgs.playbackPause.style.display === "unset";
    const pauseButton = document.getElementById("playbackPause");
    if (isPlaying && pauseButton) {
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.fillRect(0, 0, this.canvas.width * time / loadedTime, this.canvas.height)

    // Edit the text
    this.speedReadout.textContent =
      ` TIME: ${time+1}/${loadedTime+1} UPS: ${ups | 0} FPS: ${fps | 0}`;
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
