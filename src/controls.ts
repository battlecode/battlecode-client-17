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

  constructor() {
    this.div = this.baseDiv();

    let pause = document.createElement('button');
    pause.appendChild(document.createTextNode('Pause'));
    pause.setAttribute('type', 'button');
    pause.onclick = () => this.pause();

    let forward = document.createElement('button');
    forward.appendChild(document.createTextNode('Forward'));
    forward.setAttribute('type', 'button');
    forward.onclick = () => this.forward();

    let restart = document.createElement('button');
    restart.appendChild(document.createTextNode('Restart'));
    restart.setAttribute('type', 'button');
    restart.onclick = () => this.restart();

    let fileUpload = document.createElement('input');
    fileUpload.setAttribute('type', 'file');
    fileUpload.accept = '.bc17';
    fileUpload.onchange = () => this.loadMatch(fileUpload.files as FileList);
    this.speedReadout = document.createTextNode('No match loaded');

    this.div.appendChild(fileUpload);
    this.div.appendChild(pause);
    this.div.appendChild(forward);
    this.div.appendChild(restart);
    this.div.appendChild(this.speedReadout);
  }

  /**
   * Make the controls look good
   */
  baseDiv() {
    let div = document.createElement("div");

    // Positioning
    div.style.width = "100%";
    div.style.height = "40px";
    div.style.marginLeft = "310px";
    div.style.position = "fixed";
    div.style.zIndex = "0.5";
    div.style.top = "0";
    div.style.overflowX = "hidden";

    // Inner style and formatting
    div.style.backgroundColor = "gray";
    div.style.padding = "10px";

    return div;
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
    this.speedReadout.textContent =
      ` TIME: ${time} LOADED: ${loadedTime} UPS: ${ups | 0} FPS: ${fps | 0}`;

  }

  /**
   * Stop running the simulation, release all resources.
   */
  destroy() {
    console.log('DESTROY');
  }
}
