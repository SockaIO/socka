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
   * @abstract
   */
  setCommand(action, button, cmd) {}

  /**
   * Get the cmd associated with action and direction
   *
   * @param {Symbol} action | Action
   * @param {Number} button | Button ID
   *
   * @abstract
   */
  getCommand(action, button) {}

  /**
   * Reset the command associated with a button
   *
   * @param {Symbol} action | Action
   * @param {Number} button | Button ID
   *
   * @abstract
   */
  resetCommand(action, keycode) {}

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

    this.commands = new Map();
    this.commands.set(TAP, new Map());
    this.commands.set(LIFT, new Map());

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

  resetCommand(action, button) {
   if (!this.commands.has(action)) { // Should not happen
      throw new Error("Action not present in Controller");
    }

    this.commands.get(action).delete(button);
  }

  setCommand(action, button, cmd) {
    this.commands.get(action).set(button, cmd);
  }

  getCommand(action, button) {
   if (!this.commands.has(action)) { // Should not happen
      throw new Error("Action not present in Controller");
    }

    return this.commands.get(action).get(button) || null;
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
 * @TODO: Redo for the new architecture
 *
 * @extends Controller
 */
class PadController extends Controller {

  

  //
  // -----------------------------------------------------
  //

  constructor(gamepad) {
    super();

    this.gamepad = gamepad;

    this.state = {
      0: LIFT,
      1: LIFT,
      3: LIFT,
      2: LIFT,
      80: LIFT,
      81: LIFT
    };

    this.lookup = {
      0: 0,
      1: 1,
      3: 3,
      2: 2,
      7: 80,
      6: 81
    };
  }

  setSongPlayer(player) {
    this.songPlayer = player;
  }

  handleInput() {

    let output = [];

    for (let b in this.lookup) {

      let action = this.state[this.lookup[b]] === LIFT ? TAP: LIFT;
      let direction = this.lookup[b];

      // Did the state of the direction changed
      if (this.gamepad.buttons[b].pressed === (this.state[direction] === LIFT)) {

        this.state[direction] = action;

        let time = this.songPlayer !== null ? this.songPlayer.getTime() : 0;
        //let cmd = new DanceCommand(direction, action, time);
        output.push(cmd);
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
