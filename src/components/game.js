/* jshint esnext: true */
'use strict';

import {Input, Player, Theme, OptionTree, Options, Library, Notification} from '../services';
import {RESIZE} from '../constants/signaling';
import {MenuView, OptionsView} from '../views';

import * as PIXI from 'pixi.js';
import Stats from 'stats-js';

import log from 'loglevel';

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

    // Global PIXI Container
    this.stage = new PIXI.Container();
    this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {backgroundColor : 0x0e333d, view: canvas}, true);

    // Handle PIXI timer manually
    this.ticker = PIXI.ticker.shared;
    this.ticker.autoStart = false;
    this.ticker.stop();

    // Specialized Containers
    this.viewStack = new PIXI.Container();
    this.notification = new PIXI.Container();

    this.stage.addChild(this.viewStack);
    this.stage.addChild(this.notification);

    if (debug === true) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.domElement);
    }

    this.views = [];
  }

  /**
   * Start the game
   */
  start() {

    let entries = [
      {
        name: 'Play',
        action: () => {
          Library.GeneratePackMenu(this);
        }
      },
      {
        name: 'Options',
        action: () => {
          let o = new OptionsView(Options.GetRoot(), '', this);
          this.pushView(o);
        }
      }];

    let menu = new MenuView(entries, this, true);
    this.pushView(menu);

    this.main();

  }

  /**
   * Initialize the services. We don't want promises in the constructor.
   */
  init() {
    let promises = [];

    // Initialize the Options
    log.debug('Initializing the options');
    Options.SetOptions(OptionTree());

    // We need to wait for the theme to load all its resources
    let themePromise = Theme.GetTheme().loaded;
    promises.push(themePromise);

    //Player.SavePlayers();
    log.debug('Initializing the players');
    Player.InitPlayers(this);

    log.debug('Init the Library');
    Library.Init();

    log.debug('Init the Notification');
    let notificationPromise = themePromise.then(() => {
      Notification.Init(this);
      this.notification.addChild(Notification.GetSprite());
    });

    promises.push(notificationPromise);

    log.debug('Waiting for all the asynchronous Initialization');
    return Promise.all(promises);
  }

  /**
   * Resize the renderer
   * @param {Number} width New width (in px)
   * @param {Number} height New height (in px)
   */
  resize(width, height) {
    this.width = width;
    this.height = height;

    this.renderer.resize(width, height);

    this.renderer.view.style.width = width + 'px';
    this.renderer.view.style.height = height + 'px';
  }

  /**
   * Get the music volume
   * @return {Number} The music Volume
   */
  getVolume() {
    let gp = Player.GamePlayer;
    let volume = gp.optionStore.get('.root.sound.musicVolume');

    if (volume === undefined) {
      log.error('Impossible to retrieve Volume value. Using value = 50');
      volume = 50;
    }

    return volume;
  }

  /**
   * Handle an upgrade
   * @param {object|array} modifications - Modifications to apply
   */
  upgrade(modifications) {
    if (!Array.isArray(modifications)) {
      modifications = [modifications];
    }

    for (let m of modifications) {
      this.handleModification(m);
    }

    for (let v of this.views) {
      v.upgrade(modifications);
    }
  }

  /**
   * Handle a modification
   * @param {object} modification - Modification to apply
   */
  handleModification(modification) {
    switch(modification.type) {
    case RESIZE:
      this.resize(modification.width, modification.height);
      break;
    }
  }

  /**
   * Push a view on top of the stack
   */
  pushView(view, blur=true) {

    // The old view looses focus
    if (this.views.length > 0 && blur === true) {
      this.views[0].onBlur();
    }

    // The new view is added and notified
    this.views.unshift(view);
    this.viewStack.addChild(view.getView());

    // We call the callbacks after adding the view
    // because otherwise they do not stack properly
    // if a view is inserted during the callback
    view.onFocus();
    view.onPushed();
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

    this.viewStack.removeChildAt(this.viewStack.children.length - 1);
  }

  /**
   * Main loop of the game
   */
  main(ts) {

    if (this.stats) {
      this.stats.begin();
    }

    this.ticker.update(ts);

    this.update(ts);
    this.renderer.render(this.stage);

    if (this.stats) {
      this.stats.end();
    }

    window.requestAnimationFrame((ts) => {this.main(ts);});
  }

  /**
   * Update the window content
   */
  update(ts) {
    if (this.views.length > 0) {
      this.views[0].update(ts);

      for (let c of Input.GetControllers()) {
        let cmds = c.handleInput();
        for (let cmd of cmds) {
          cmd();
        }
      }
    }
  }

  /**
   * Get the size of the game screen
   * @returns {Number} Screen width
   * @return {Number} Screen height
   */
  getScreenSize() {
    return [this.width, this.height];
  }
}
export default Game;
