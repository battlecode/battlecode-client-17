import * as play from 'battlecode-playback';
import * as config from './config';

/**
 * The entrypoint to the battlecode client.
 * 
 * We "mount" the application at a particular HTMLElement - everything we create
 * on the page will live as a child of that element.
 *
 * We return a Client, which the web page can use to talk to the running client.
 * It can pause it, make it switch matches, etc.
 *
 * This architecture makes it easy to reuse the client on different web pages.
 */
window['battlecode'] = {
  mount: (root: HTMLElement, conf?: any): Client => 
    new Client(root, conf),
};

/**
 * The interface a web page uses to talk to a client.
 */
class Client {
  readonly conf: config.Config;
  readonly root: HTMLElement;

  constructor(root: HTMLElement, conf?: any) {
    console.log('Battlecode client loading...');

    this.root = root;
    this.conf = config.defaults(conf);

    // set up canvas
    let canvas = document.createElement("canvas");
    canvas.setAttribute("id", "canvas");
    canvas.setAttribute("width", this.conf.width);
    canvas.setAttribute("height", this.conf.height);
    canvas.setAttribute("style", "border: 1px solid black");

    // try drawing an image
    let ctx = canvas.getContext("2d");
    let img = new Image();
    img.onload = function () {
        ctx.drawImage(img, 200, 200);
    }
    img.src = 'http://findicons.com/files/icons/98/nx11/256/internet_real.png';
    // img.src = require('./img/sprites/archon_white.png');

    root.appendChild(canvas)
    
    // set up game controls
    let pause = document.createElement('button');
    pause.appendChild(document.createTextNode('Pause'));
    pause.setAttribute('type', 'button');
    pause.setAttribute('id', 'pause');
    pause.setAttribute('onclick', 'this.pause()');  // this does not work
    
    root.appendChild(pause);
  }

  /**
   * Pause our simulation.
   */
  pause() {

  }

  /**
   * Unpause our simulation.
   */
  unpause() {

  }

  /**
   * Stop running the simulation, release all resources.
   */
  destroy() {

  }
}
