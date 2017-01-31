'use strict';

/**
 * @namespace services.Input
 */

import {Subject} from '../helpers';
import {TAP, LIFT, KEYS, KEY_UP, KEY_LEFT, KEY_RIGHT, KEY_DOWN, KEY_ENTER, KEY_BACK, EVENT_PAD_CONNECTED, EVENT_PAD_DISCONNECTED} from '../constants/input';

let controllers = new Map();
let controllerSubject = new Subject();

export {
  GetDefaultKeyboardController,
  Subscribe,
  GetControllers,
  GetDefaultKeyboardMapping,
  Mapping
};

/**
 * Interface for the controllers
 *
 * @interface
 * @memberof services.Input
 */
class Controller {

  constructor() {
    this.commands = new Map();
    this.commands.set(TAP, new Map());
    this.commands.set(LIFT, new Map());
  }

  /**
   * Return commands for the input that
   * occured since the last call.
   *
   * @return {Command|Array} Array of Commands
   *
   * @abstract
   */
  handleInput() {}

  /**
   * Set the binding between a button and a comman
   *
   * @param {Number} button | Button ID
   * @param {Symbol} action | Action
   * @param {function} cmd | Command function
   *
   */
  setCommand(action, button, cmd) {
    this.commands.get(action).set(button, cmd);
  }

  /**
   * Get the cmd associated with action and direction
   *
   * @param {Symbol} action | Action
   * @param {Number} button | Button ID
   *
   */
  getCommand(action, button) {
    if (!this.commands.has(action)) { // Should not happen
      throw new Error('Action not present in Controller');
    }

    return this.commands.get(action).get(button) || null;
  }

  /**
   * Reset the command associated with a button
   *
   * @param {Symbol} action | Action
   * @param {Number} button | Button ID
   *
   */
  resetCommand(action, button) {
    if (!this.commands.has(action)) { // Should not happen
      throw new Error('Action not present in Controller');
    }

    this.commands.get(action).delete(button);
  }

}

/**
 * Setup the listener for the gamepad connection/disconnection
 * and create the keyboard controller.
 *
 * @memberof services.Input
 */
function Setup() {
  window.addEventListener('gamepadconnected', (e) => Connect(e), false);
  window.addEventListener('gamepaddisconnected', (e) => Disconnect(e), false);

  controllers.set(-1, new KeyboardController());

  // We have to hardcode the fullscreen for ease of use
  document.addEventListener('keyup', (e) => {
    if (e.keyCode === 120) {
      let c = document.getElementById('game');
      e.preventDefault();
      let requestFullScreen = c.mozRequestFullScreen || c.webkitRequestFullScreen;
      requestFullScreen.bind(c)();
    }
  });
}

/**
 * Get the default keyboard Controller
 * @memberof services.Input
 */
function GetDefaultKeyboardController() {
  return controllers.get(-1);
}

/**
 * Subscribe to the Controller Events
 * @param {Observer} observer | Observer to subsribe to the subject
 * @memberof services.Input
 */
function Subscribe(observer) {
  controllerSubject.subscribe(observer);
}

function GetControllers() {
  return controllers.values();
}

/**
 * Setup a gamepad upon connection
 *
 * @listens gamepadconnected
 * @memberof services.Input
 */
function Connect(e) {

  let gamepad = e.gamepad;
  let pad = new PadController(gamepad);

  controllers.set(gamepad.index, pad);

  let ev = {
    type: EVENT_PAD_CONNECTED,
    pad
  };

  controllerSubject.notify(ev);
}

/**
 * Remove a gamepad upon disconnection
 *
 * @listens gamepaddisconnected
 * @memberof services.Input
 */
function Disconnect(e) {
  let gamepad = e.gamepad;
  let pad = controllers.get(gamepad.index);

  controllers.delete(gamepad.index);

  let ev = {
    type: EVENT_PAD_DISCONNECTED,
    pad
  };

  controllerSubject.notify(ev);
}

/**
 * Keyboard Controller.
 *
 * @extends Controller
 * @memberof services.Input
 */
class KeyboardController extends Controller{

  constructor() {

    super();

    this.pushed = new Set();

    this.songPlayer = null;
    this.cmdQueue = [];

    this.setup();
  }

  handleInput() {
    let output = this.cmdQueue;
    this.cmdQueue = [];

    return output;
  }

  setup() {
    document.addEventListener('keydown', this);
    document.addEventListener('keyup', this);
  }

  handleEvent(e) {
    const key = e.keyCode;

    // Debouncing if kedown only
    if (e.type == 'keydown' && this.pushed.has(key)) {
      return;
    }

    const action = (e.type === 'keydown') ? TAP : LIFT;
    if (action === TAP) {
      this.pushed.add(key);
    } else {
      this.pushed.delete(key);
    }

    let cmd = this.getCommand(action, key);
    if (cmd !== null) {
      this.cmdQueue.push(cmd);
    }
  }
}

/**
 * Gamepad Controller.
 *
 * @extends Controller
 * @memberof services.Input
 */
class PadController extends Controller {

  constructor(gamepad) {
    super();

    this.gamepad = gamepad;
    this.pushed = new Set();
  }

  handleInput() {

    let output = [];

    for (let i = 0; i < this.gamepad.buttons.length; ++i) {
      let b = this.gamepad.buttons[i];

      // If there was a change
      if (this.pushed.has(b) !==  b.pressed) {

        const action = b.pressed ? TAP : LIFT;
        if (action === TAP) {
          this.pushed.add(b);
        } else {
          this.pushed.delete(b);
        }

        let cmd = this.getCommand(action, i);
        if (cmd !== null) {
          output.push(cmd);
        }
      }
    }

    return output;
  }

}


/**
 * Key mapping for a player
 * @memberof services.Input
 */
class Mapping {

  constructor() {
    this.mapping = new Map();

    // Initialize all the keys
    for (let k of KEYS) {
      this.mapping.set(k, new Set());
    }

    this.bindings = new Set();
  }

  /**
   * Affect a controller button to a key
   *
   * @param {Symbol} key | Key Symbol
   * @param {Number} button | Button ID
   * @param {Controller} controller | Controller
   *
   */
  setKey(key, button, controller) {
    this.mapping.get(key).add([controller, button]);
  }

  /**
   * Set the commands
   *
   * @param {Map} | Command for each key
   *
   * @abstract
   */
  setCommands(cmds) {
    this.resetBindings();
    for (let [[key, action], cmd] of cmds.entries()) {
      this.bind(action, key, cmd);
    }
  }

  /**
   * Bind a command to a key
   *
   * @param {Symbol} action | Action
   * @param {Symbol} key | Key Symbol
   * @param {function} cmd | Command function
   *
   */
  bind(action, key,  cmd) {
    for (let [controller, button] of this.mapping.get(key).values()) {
      controller.setCommand(action, button, cmd);
      this.bindings.add([controller, action, button]);
    }
  }


  /**
   * Reset all the bindings
   */
  resetBindings() {
    for (let [controller, action, button] of this.bindings.values()) {
      controller.resetCommand(action, button);
    }
  }

}

/**
 * Return the default keyboard mapping
 * @returns {Mapping} Default Mapping for the keyboard (arrow keys)
 * @memberof services.Input
 *
 */
function GetDefaultKeyboardMapping() {
  let m = new Mapping();
  let c = GetDefaultKeyboardController();

  m.setKey(KEY_UP, 38, c);
  m.setKey(KEY_DOWN, 40, c);
  m.setKey(KEY_LEFT, 37, c);
  m.setKey(KEY_RIGHT, 39, c);

  m.setKey(KEY_ENTER, 13, c);
  m.setKey(KEY_BACK, 8, c);

  return m;
}

Setup();
