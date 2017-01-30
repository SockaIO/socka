/* jshint esnext: true */
'use strict';

import {Input, Player} from '../services';
import {KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT, KEY_ENTER, KEY_BACK} from '../constants/input';

import * as PIXI from 'pixi.js';
import Stats from 'stats-js';

/**
 * Global Game entity.
 *
 * It is repsonsible for the instanciation and management
 * of all the other components.
 *
 * @memberof components
 *
 */
class Game {

  /**
   * Create a Game object
   * @param {number} width - Game window width
   * @param {number} height - Game window height 
   * @param {Bool} debug -  Show Debug Stats
   * @param {object} configuration - Configuration of the Game
   */
  constructor(width, height, debug=false) {
    this.width = width;
    this.height = height;

    // Create the PIXI Environment
    let canvas = document.getElementById('game');
    this.stage = new PIXI.Container();
    this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {backgroundColor : 0x1099bb, view: canvas}, true);

    if (debug === true) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.domElement);
    }

    this.views = [];

    this.createWindow();
  }

  /**
   * Initialize the services. We don't want promises in the constructor.
   */
  init() {
    let promises = [];

    // Create the first player
    let p = Player.CreatePlayer();
    p.setMapping(Input.GetDefaultKeyboardMapping());

    // Create a second plauer for test purpose
    let q = Player.CreatePlayer();
    let m = new Input.Mapping();
    let c = Input.GetDefaultKeyboardController();

    m.setKey(KEY_UP, 87, c);
    m.setKey(KEY_DOWN, 83, c);
    m.setKey(KEY_LEFT, 65, c);
    m.setKey(KEY_RIGHT, 68, c);

    m.setKey(KEY_ENTER, 32, c);
    m.setKey(KEY_BACK, 27, c);

    q.setMapping(m);

    return Promise.all(promises);
  }

  /**
   * Create the Game window
   */
  createWindow() {
    document.body.appendChild(this.renderer.view);
  }

  /**
   * Push a view on top of the stack
   */
  pushView(view) {

    // The old view looses focus
    if (this.views.length > 0) {
      this.views[0].onBlur();
    }

    // The new view is added and notified
    this.views.unshift(view);
    view.onPushed();
    view.onFocus();
    this.stage.addChild(view.getView());
  }

  /**
   * Remove the top view from the stack
   */
  popView() {
    if (this.views.length === 0) {
      return;
    }

    let oldView = this.views.shift();
    oldView.onBlur();
    oldView.onPoped();

    if (this.views.length > 0) {
      this.views[0].onFocus();
    }

    this.stage.removeChildAt(this.stage.children.length - 1);
  }

  /**
   * Main loop of the game
   */
  main() {

    if (this.stats) {
      this.stats.begin();
    }

    window.requestAnimationFrame(() => {this.main();});
    this.update();
    this.renderer.render(this.stage);

    if (this.stats) {
      this.stats.end();
    }

  }

  /**
   * Update the window content
   */
  update() {
    if (this.views.length > 0) {
      this.views[0].update();

      for (let c of Input.GetControllers()) {
        let cmds = c.handleInput();
        for (let cmd of cmds) {
          cmd();
        }
      }
    }
  }
}
export default Game;
