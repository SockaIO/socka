/* jshint esnext: true */
"use strict";


const TAP = Symbol.for('TAP');
const LIFT = Symbol.for('LIFT');

const EVENT_PAD_CONNECTED = Symbol.for('EVENT_PAD_CONNECTED');
const EVENT_PAD_DISCONNECTED = Symbol.for('EVENT_PAD_DISCONNECTED');

class KeyboardController {

  constructor() {

    this.state = {
      37: 0,
      40: 0,
      39: 0,
      38: 0,
      13: 0,
      8: 0
    };

    this.lookup = {
      37: 0, // left
      40: 1, // down
      39: 3, // right
      38: 2, // up
      13: 80, //start
      8: 81 //back
    };

    this.songPlayer = null;
    this.cmdQueue = [];
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

  setSongPlayer(player) {
    this.songPlayer = player;
  }

  addCommand(direction, action) {
    let time = this.songPlayer !== null ? this.songPlayer.getTime() : 0;
    let cmd = new DanceCommand(direction, action, time);
    this.cmdQueue.push(cmd);
  }

  handleEvent(e) {
    const key = e.keyCode;

    if (this.lookup[key] !== undefined){

      // Debouncing if kedown only
      if (e.type == 'keydown' && this.state[this.lookup[key]] === TAP) {
        return;
      }
      const action = (e.type === 'keydown') ? TAP : LIFT;
      this.state[this.lookup[key]] = action;
      this.addCommand(this.lookup[key], action);
    }
  }
}

class PadController {

  // handle the events for pad connection
  static Setup() {
    window.addEventListener('gamepadconnected', (e) => PadController.Connect(e), false);
    window.addEventListener('gamepaddisconnected', (e) => PadController.Disconnect(e), false);
  }

  static Connect(e) {

    console.log('test');

    let gamepad = e.gamepad;
    let pad = new PadController(gamepad);

    this.Controllers.set(gamepad.index, pad);

    let ev = {
      type: EVENT_PAD_CONNECTED,
      pad
    }

    PadController.Subject.notify(ev);
  }

  static Disconnect(e) {
    let gamepad = e.gamepad;
    let pad = this.Controller.get(gamepad.index);

    this.Controllers.delete(gamepad.index);

    let ev = {
      type: EVENT_PAD_DISCONNECTED,
      pad
    }

    PadController.Subject.notify(ev);
  }

  //
  // -----------------------------------------------------
  //

  constructor(gamepad) {
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
        let cmd = new DanceCommand(direction, action, time);
        output.push(cmd);
      }
    }

    return output;
  }
}

PadController.Controllers = new Map();
PadController.Subject = new Subject();

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
