'use strict';

/**
 * @namespace services.Input
 */

import {Notify}  from './notification';
import {Subject} from '../helpers';
import {TAP, LIFT, KEYS, KEY_UP, KEY_LEFT, KEY_RIGHT, KEY_DOWN, KEY_ENTER, KEY_BACK, EVENT_PAD_CONNECTED, EVENT_PAD_DISCONNECTED, RAPID_FIRE, INPUT_UPDATE, INPUT_ENTER, INPUT_CANCEL, PRIMARY, SECONDARY} from '../constants/input';

import log from 'loglevel';

let controllers = new Map();
let controllerSubject = new Subject();

export {
  GetDefaultKeyboardController,
  Subscribe,
  GetControllers,
  GetController,
  GetDefaultKeyboardMapping,
  Mapping,
  SetRawListener,
  RemoveRawListener,
  SetInputListener
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
    this.commands.set(RAPID_FIRE, new Map());

    this.rawListener = null;

    this.rapidFire = {
      id: null,
      speed: 200,
      startSpeed: 200,
      minSpeed: 50,
      acceleration: 10,
      stop: false,
      action: null
    };
  }

  /**
   * Get the ID of the Controller
   * @return {Number} ID
   */
  getId() {}

  /**
   * Called when a button with rapid fire is tapped
   * @param {Function} action The action to perform
   */
  rapidFireTap(action) {

    // Reset the rapidFire
    this.rapidFire.speed = this.rapidFire.startSpeed;
    this.rapidFire.stop = false;
    clearTimeout(this.rapidFire.id);

    this.rapidFire.action = action;

    const doFire = () => {

      // is the rapid fire released
      if (this.rapidFire.stop !== false) {
        return;
      }

      this.rapidFire.action();

      // Accelerate
      if (this.rapidFire.speed - this.rapidFire.acceleration >= this.rapidFire.minSpeed) {
        this.rapidFire.speed -= this.rapidFire.acceleration;
      }

      this.rapidFire.id = setTimeout(doFire, this.rapidFire.speed);
    };

    // Do the action at least once
    doFire();
  }

  /**
   * Called when a button with rapid fire is released
   */
  rapidFireLift() {
    this.rapidFire.stop = true;
  }

  /**
   * Add a callback listening on the raw events
   * @param {Function} callback Function to call
   */
  setRawListener(callback) {
    this.rawListener = callback;
  }

  /**
   * Remove Raw Listing callback
   */
  removeRawListener() {
    this.rawListener = null;
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
   * Set the binding between a button and a command
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

    // if the action is RAPID_FIRE we need to return different commands
    // for TAP and LIFT
    if ([TAP, LIFT].includes(action) && this.commands.get(RAPID_FIRE).has(button)) {

      const cmd = this.commands.get(RAPID_FIRE).get(button);

      if (action == TAP) {
        return () => {this.rapidFireTap(cmd);};
      } else {
        return () => {this.rapidFireLift();};
      }
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

  controllers.set(-1, new KeyboardController(-1));

  // We have to hardcode some bindings for ease of use
  document.addEventListener('keyup', (e) => {
    // Fullscreen with F9
    if (e.keyCode === 120) {
      let c = document.getElementById('game');
      e.preventDefault();
      let requestFullScreen = c.mozRequestFullScreen || c.webkitRequestFullScreen;
      requestFullScreen.bind(c)();

      // Reset the localstorage with F8
    } else if (e.keyCode === 119) {
      if (window.confirm('Are you sure you want to reset all the settings? (You know what you are doing right?)')) {
        localStorage.clear();
        window.location.reload();
      }
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
  controllerSubject.addObserver(observer);
}

function GetControllers() {
  return controllers.values();
}

/**
 * Get Controller By ID
 * @param {Number} id The Controller ID
 * @returns {Controller} the Controller
 */
function GetController(id) {
  return controllers.get(id);
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

  log.debug('Pad Connected');
  Notify('Pad Connected');

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

  constructor(id) {

    super();

    this.pushed = new Set();
    this.id = id;

    this.songPlayer = null;
    this.cmdQueue = [];

    this.setup();
  }

  getId() {
    return this.id;
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
      e.preventDefault();
      return;
    }

    const action = (e.type === 'keydown') ? TAP : LIFT;
    if (action === TAP) {
      this.pushed.add(key);
    } else {
      this.pushed.delete(key);
    }

    if (this.rawListener !== null) {
      this.rawListener({key, controller: this, jsEvent: e});
      return;
    }

    let cmd = this.getCommand(action, key);
    if (cmd !== null) {
      e.preventDefault();
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

  getId () {
    return this.gamepad.index;
  }

  handleInput() {

    // Somehow we need to refetch the gamepad object each time
    this.gamepad = navigator.getGamepads()[this.gamepad.index];

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

        if (this.rawListener !== null) {
          this.rawListener({controller: this, key: i});
          continue;
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
      this.mapping.set(k, new Map());
    }

    this.bindings = new Set();

    this.pendingMappings = new Map();
    this.pendingBindings = new Map();
  }

  /**
   * Affect a controller button to a key
   *
   * @param {Symbol} key | Key Symbol
   * @param {Number} button | Button ID
   * @param {Number} controllerId | Controller ID
   *
   */
  setKey(key, button, controllerId, layout=PRIMARY) {
    let controller = GetController(controllerId);

    if (controller !== undefined) {
      this.mapping.get(key).set(layout, [controller, button]);
    } else {
      this.setFutureKey(key, button, controllerId, layout);
    }
  }

  /**
   * Affect a controller button to a key when
   * the controller is plugged
   *
   * @param {Symbol} key | Key Symbol
   * @param {Number} button | Button ID
   * @param {Number} controllerId | Controller ID
   *
   */
  setFutureKey(key, button, controllerId, layout) {
    // Subscribe for Input Events
    log.debug('Subscribing For Input Event for future Binding');
    Subscribe(this);

    if (!this.pendingMappings.has(controllerId)) {
      this.pendingMappings.set(controllerId, []);
    }

    // Add the Key to the queue
    this.pendingMappings.get(controllerId).push([key, button, controllerId, layout]);
  }

  /**
   * Notify for Input events
   * @param {Object} ev | Event
   */
  onNotify(event) {
    if (event.type === EVENT_PAD_CONNECTED) {
      // We have pending bindings for this pad
      if (this.pendingMappings.has(event.pad.getId())) {

        for (let fk of this.pendingMappings.get(event.pad.getId())) {
          this.setKey(...fk);
        }

        this.pendingMappings.delete(event.pad.getId());
        // TODO: Unsubscribe from the Input Events
      }

      if (this.pendingBindings.has(event.pad.getId())) {

        for (let b of this.pendingBindings.get(event.pad.getId())) {
          this.bind(...b);
        }

        this.pendingBindings.delete(event.pad.getId());
        // TODO: Unsubscribe from the Input Events
      }
    }
  }

  /**
   * Reset the binding for a key
   * @param {Symbol} key | Key Symbol
   */
  resetKey(key) {
    this.mapping.get(key).clear();
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

    this.futureBind(action, key, cmd);
  }

  /**
   * Bind a command to a key when
   * the controller is plugged
   *
   * @param {Symbol} action | Action
   * @param {Symbol} key | Key Symbol
   * @param {function} cmd | Command function
   *
   */
  futureBind(action, key, cmd) {

    // No need to subscribe again. This must have been done already

    // Add the bindings to the queue
    for (let keyArray of this.pendingMappings.values()) {
      for (let [mappingKey,, controllerId ] of keyArray) {
        if (key === mappingKey) {

          if (!this.pendingBindings.has(controllerId)) {
            this.pendingBindings.set(controllerId, []);
          }

          // Add the Binding to the queue
          this.pendingBindings.get(controllerId).push([action, key, cmd]);
        }
      }
    }
  }

  /**
   * Get the Options
   */
  getOptions() {
    let out = [];

    let options = new Map();
    const layoutTxt = {
      [PRIMARY]: 'PRIMARY',
      [SECONDARY]: 'SECONDARY'
    };

    // Pending mapping
    for (let controller of this.pendingMappings.values()) {

      for (let [key, button, controllerId, layout] of controller) {
        let option = {};
        if (options.has(key)) {
          option = options.get(key);
        }

        option[layoutTxt[layout]] =  {key: button, controller: controllerId};
        options.set(key, option);
      }
    }

    // Active mappings
    for (let key of KEYS) {
      // Get returns a set of one element so we need to extract the value
      let layouts = [...this.mapping.get(key)];

      let option = {};
      if (options.has(key)) {
        option = options.get(key);
      }

      for (let [layoutType, [controller, button]] of layouts) {
        option[layoutTxt[layoutType]] =  {key: button, controller: controller.id};
      }

      options.set(key, option);
    }

    for (let [key, value] of options.entries()) {
      out.push([key, value]);
    }

    return out;
  }


  /**
   * Reset all the bindings
   */
  resetBindings() {
    for (let [controller, action, button] of this.bindings.values()) {
      controller.resetCommand(action, button);
    }

    this.bindings.clear();
    this.pendingBindings.clear();
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
  const id = c.getId();

  // PRIMARY Keyboard Keys

  m.setKey(KEY_UP, 38, id);
  m.setKey(KEY_DOWN, 40, id);
  m.setKey(KEY_LEFT, 37, id);
  m.setKey(KEY_RIGHT, 39, id);

  m.setKey(KEY_ENTER, 13, id);
  m.setKey(KEY_BACK, 8, id);

  const padId = 0;

  // SECONDARY Pad Keys
  m.setKey(KEY_UP, 2, padId, SECONDARY);
  m.setKey(KEY_DOWN, 0, padId, SECONDARY);
  m.setKey(KEY_LEFT, 1, padId, SECONDARY);
  m.setKey(KEY_RIGHT, 3, padId, SECONDARY);

  m.setKey(KEY_ENTER, 9, padId, SECONDARY);
  m.setKey(KEY_BACK, 8, padId, SECONDARY);

  return m;
}

function SetRawListener(callback) {
  for (let c of GetControllers()) {
    c.setRawListener(callback);
  }
}

function RemoveRawListener() {
  for (let c of GetControllers()) {
    c.removeRawListener();
  }
}

function SetInputListener(defaultValue, callback) {

  let input = document.getElementById('hiddenInput');
  input.value = defaultValue;
  input.selectionStart = input.selectionEnd = input.value.length;

  for (let c of GetControllers()) {
    c.setRawListener((e) => {

      let type = INPUT_UPDATE;
      if (e.key === 13 && e.jsEvent.type === 'keydown') { // Enter
        input.blur();
        type = INPUT_ENTER;
        RemoveRawListener();
      }
      else if (e.key === 27 && e.jsEvent.type === 'keydown') {
        input.blur();
        type = INPUT_CANCEL;
        RemoveRawListener();
      }
      callback(type, input.value);
    });
  }
  input.focus();
}

Setup();
