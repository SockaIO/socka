/* jshint esnext: true */
"use strict";

/** @global */
const TAP = Symbol.for('TAP');
/** @global */
const LIFT = Symbol.for('LIFT');

/** @global */
const EVENT_PAD_CONNECTED = Symbol.for('EVENT_PAD_CONNECTED');
/** @global */
const EVENT_PAD_DISCONNECTED = Symbol.for('EVENT_PAD_DISCONNECTED');

/** @global */
const KEY_LEFT = Symbol.for('KEY_LEFT');

/** @global */
const KEY_UP = Symbol.for('KEY_UP');

/** @global */
const KEY_RIGHT = Symbol.for('KEY_RIGHT');

/** @global */
const KEY_DOWN = Symbol.for('KEY_DOWN');

/** @global */
const KEY_ENTER = Symbol.for('KEY_ENTER');

/** @global */
const KEY_BACK = Symbol.for('KEY_BACK');


/** @global */
const KEYS = [
  KEY_LEFT,
  KEY_RIGHT,
  KEY_DOWN,
  KEY_UP,
  KEY_ENTER,
  KEY_BACK
]


/**
 * Interface for the controllers
 *
 * @interface
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
      throw new Error("Action not present in Controller");
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
      throw new Error("Action not present in Controller");
    }

    this.commands.get(action).delete(button);
  }

   /**
   * Setup the listener for the gamepad connection/disconnection
   * and create the keyboard controller.
   *
   * @static
   */
  static Setup() {
    window.addEventListener('gamepadconnected', (e) => PadController.Connect(e), false);
    window.addEventListener('gamepaddisconnected', (e) => PadController.Disconnect(e), false);

    Controller.Controllers.set(-1, new KeyboardController());
  }

  /**
   * Get the default keyboard Controller
   */
  static GetDefaultKeyboardController() {
    return Controller.Controllers.get(-1);
  }

  /**
   * Setup a gamepad upon connection
   *
   * @static
   * @listens gamepadconnected
   */
  static Connect(e) {

    let gamepad = e.gamepad;
    let pad = new PadController(gamepad);

    this.Controllers.set(gamepad.index, pad);

    let ev = {
      type: EVENT_PAD_CONNECTED,
      pad
    }

    Controller.Subject.notify(ev);
  }

  /**
   * Remove a gamepad upon disconnection
   *
   * @static
   * @listens gamepaddisconnected
   */
  static Disconnect(e) {
    let gamepad = e.gamepad;
    let pad = this.Controller.get(gamepad.index);

    this.Controllers.delete(gamepad.index);

    let ev = {
      type: EVENT_PAD_DISCONNECTED,
      pad
    }

    Controller.Subject.notify(ev);
  }
}

/**
 * Controllers Map
 * @static
 */
Controller.Controllers = new Map();

/**
 * Observer helper.
 * @static
 */
Controller.Subject = new Subject();

/**
 * Keyboard Controller.
 *
 * @extends Controller
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
 */
class Mapping {

  /**
   * Return the default keyboard mapping
   *
   * @return {Mapping} Default keyboard mapping
   *
   * @static
   */
  static GetDefaultKeyboardMapping() {
    let m = new Mapping();
    let c = Controller.GetDefaultKeyboardController();

    m.setKey(KEY_UP, 38, c);
    m.setKey(KEY_DOWN, 40, c);
    m.setKey(KEY_LEFT, 37, c);
    m.setKey(KEY_RIGHT, 39, c);

    m.setKey(KEY_ENTER, 13, c);
    m.setKey(KEY_BACK, 8, c);

    return m;
  }

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
