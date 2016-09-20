/* jshint esnext: true */
"use strict";


const TAP = Symbol.for('TAP');
const LIFT = Symbol.for('LIFT');

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
    let step = engine.actionStep;
    if (step === null) {
      return;
    }

    for (let note of step.notes) {

      if (note.direction === this.direction) {
        console.log('match');
      }
    }
  }

}
