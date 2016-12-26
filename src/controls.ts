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
  imgs: {
    playbackStart: HTMLImageElement,
    playbackPause: HTMLImageElement,
    playbackStop: HTMLImageElement,
    seekForward: HTMLImageElement,
    skipForward: HTMLImageElement,
    upload: HTMLImageElement
  };

  constructor(images: imageloader.AllImages) {
    this.div = this.baseDiv();
    this.speedReadout = document.createTextNode('No match loaded');

    // initialize the images
    this.imgs = {
      playbackStart: images.controls.playbackStart,
      playbackPause: images.controls.playbackPause,
      playbackStop: images.controls.playbackStop,
      seekForward: images.controls.seekForward,
      skipForward: images.controls.skipForward,
      upload: images.controls.upload
    }

    let table = document.createElement("table");
    let tr = document.createElement("tr");

    // create the timeline
    let timeline = document.createElement("td");
    timeline.appendChild(this.timeline());

    // create the button controls
    let buttons = document.createElement("td");
    buttons.appendChild(this.createButton("playbackPause", () => this.pause(), "playbackStart"));
    buttons.appendChild(this.createButton("playbackStop", () => this.restart()));
    buttons.appendChild(this.createButton("skipForward", () => this.forward(), "seekForward"));
    buttons.appendChild(this.uploadFileButton());
    buttons.appendChild(this.speedReadout);

    table.appendChild(tr);
    tr.appendChild(timeline);
    tr.appendChild(buttons);
    this.div.appendChild(table);
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
      // let targetFrame = 4096 * width / this.width;
      // this.onSeek(targetFrame);
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

    // toggle the play/pause button
    if (this.imgs["playbackStart"].style.display == "none") {
      this.imgs["playbackStart"].style.display = "unset";
      this.imgs["playbackPause"].style.display = "none";

      // if pausing the simulation, reset the fast forward button
      this.imgs["seekForward"].style.display = "none";
      this.imgs["skipForward"].style.display = "unset";
    } else {
      this.imgs["playbackStart"].style.display = "none";
      this.imgs["playbackPause"].style.display = "unset";
    }
  }

  /**
   * Fast forward our simulation.
   */
  forward() {
    // toggle speeds between regular speed and fast forward
    this.onToggleForward();
    console.log("FORWARD");
    if (this.imgs["seekForward"].style.display == "none") {
      this.imgs["seekForward"].style.display = "unset";
      this.imgs["skipForward"].style.display = "none";
    } else {
      this.imgs["seekForward"].style.display = "none";
      this.imgs["skipForward"].style.display = "unset";
    }

    // toggle the pause button to play if the simulation is paused
    if (this.imgs["playbackPause"].style.display == "none") {
      this.imgs["playbackStart"].style.display = "none";
      this.imgs["playbackPause"].style.display = "unset";
    }
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
