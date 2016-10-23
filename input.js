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
   * Return the buttons that are pressed
   *
   * @return {Number|Array} Array of buttons
   *
   * @abstract
   */
  getPressed() {}

  /**
   * Set the commands
   *
   * @param {Map} | Command for each key
   *
   * @abstract
   */
  setCommands() {}

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

    this.state = {
      KEY_LEFT: LIFT,
      KEY_UP: LIFT,
      KEY_DOWN: LIFT,
      KEY_RIHT: LIFT,
      KEY_ENTER: LIFT,
      KEY_BACK: LIFT
    };

    this.lookup = {
      37: KEY_LEFT, // left
      40: KEY_DOWN, // down
      39: KEY_RIGHT, // right
      38: KEY_UP, // up
      13: KEY_ENTER, //start
      8: KEY_BACK //back
    };

    this.commands = new Map();

    this.songPlayer = null;
    this.cmdQueue = [];

    this.setup();
  }

  setCommands(cmds) {

    this.commands = new Map();
    this.commands.set(TAP, new Map());
    this.commands.set(LIFT, new Map());

    for (let [[keycode, action], cmd] of cmds.entries()) {
      this.commands.get(action).set(keycode, cmd);
    }
  }

  getCmd(action, keycode) {
    if (!this.commands.has(action)) {
      return null;
    }

    return this.commands.get(action).get(keycode) || null;
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

  getPressed() {
    let pressed = [];
    for (let d in this.state) {
      if (this.state[d] === TAP) {
        pressed.push(parseInt(d, 10));
      }
    }
    return pressed;
  }

  handleEvent(e) {
    const key = e.keyCode;

    let keycode = this.lookup[key];

    if (keycode !== undefined){

      // Debouncing if kedown only
      if (e.type == 'keydown' && this.state[keycode] === TAP) {
        return;
      }
      const action = (e.type === 'keydown') ? TAP : LIFT;
      this.state[keycode] = action;

      let cmd = this.getCmd(action, keycode);
      if (cmd !== null) {
        this.cmdQueue.push(cmd);
      }
    }
  }
}

/**
 * Gamepad Controller.
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

  getPressed() {
    let pressed = [];
    for (let d in this.state) {
      if (this.state[d] === TAP) {
        pressed.push(parseInt(d, 10));
      }
    }
    return pressed;
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
        let cmd = new DanceCommand(direction, action, time);
        output.push(cmd);
      }
    }

    return output;
  }
}


class DanceCommand {

  constructor(direction, action, time) {
    this.direction = direction;
    this.time = time;
    this.action = action;
  }

  execute(engine) {

    // Visual Effect
    if (this.action === TAP) {
      engine.graphicComponent.receptor.flash(this.direction);
    }

    // Action on the step
    let note = engine.getActionNote(this.direction, this.time);

    if (note === null) {
      return;
    }

    note.process(this);

  }

}
