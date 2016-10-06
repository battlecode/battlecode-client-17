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

    // set up a placeholder
    let text = document.createTextNode('Loading...');
    let p = document.createElement('p');
    p.appendChild(text);
    root.appendChild(p);
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
