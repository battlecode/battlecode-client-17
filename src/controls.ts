/**
 * Game controls: pause/unpause, fast forward, rewind
 */
export default class Controls {

  div: HTMLDivElement = document.createElement('div');

  constructor() {
    let pause = document.createElement('button');
    pause.appendChild(document.createTextNode('Pause'));
    pause.setAttribute('type', 'button');
    pause.setAttribute('id', 'pause');
    pause.onclick = () => this.pause();

    let forward = document.createElement('button');
    forward.appendChild(document.createTextNode('Forward'));
    forward.setAttribute('type', 'button');
    forward.setAttribute('id', 'forward');
    forward.onclick = () => this.forward();

    let fileUpload = document.createElement('input');
    fileUpload.setAttribute('type', 'file');
    fileUpload.onchange = () => this.upload();
    this.div.appendChild(pause);
    this.div.appendChild(fileUpload);
  }

  /**
   * Upload a battlecode match file.
   */
  upload() {
    console.log('uploaded');
  }

  /**
  * Pause our simulation.
  */
  pause() {
    console.log('PAUSE');
  }

  /**
  * Fast forward our simulation.
  */
  forward() {
    console.log('FORWARD');
  }

  /**
  * Stop running the simulation, release all resources.
  */
  destroy() {
    console.log('DESTROY');
  }
}