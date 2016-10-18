/* jshint esnext: true */
"use strict";

class Engine {

  constructor(width, height, fieldView) {

    // Controller
    this.controller = null;

    // Song related info
    this.chart = null;

    // Window of existing notes
    this.fieldView = fieldView;
    this.firstStepIndex = 0;
    this.lastStepIndex = -1;
    this.actionIndex = -1;
    this.actionNotes = new Map();
    this.time = 0;
    this.beat = 0;

    // Scheduling
    this.scheduledEvents = new Set();

    // Missed steps
    this.missedStepIndex = 0;

    // Collision step
    this.collisionStepIndex = 0;

    // Timing
    this.missTiming = 0.250;

    // Graphic Component
    this.graphicComponent = theme.createEngineGC(width, height, fieldView);

    // Score
    this.score = new Score();
    this.graphicComponent.placeScore(this.score.sprite);

    // Combo
    this.combo = new Combo();
    this.graphicComponent.placeCombo(this.combo.sprite);

    // Life
    this.lifemeter = new Lifemeter();
    console.log(this.lifemeter.sprite);
    this.graphicComponent.placeLifemeter(this.lifemeter.sprite);
  }

  loadSong(song, chartIndex, judge) {
    //TODO: Load resources
    
    this.chart = song.charts[chartIndex];
    this.song = song;
    this.judge = judge;

    this.steps = [];

    for (let step of this.chart.steps) {

      let noteStep = new NoteStep(step.beat, step.time, this);

      for (let directionS in step.arrows) {
        let direction = parseInt(directionS, 10);
        let arrow = step.arrows[direction];

        let schedule = (time, action, absolute, beat, ev=null) => {
          return this.schedule(time, action, absolute, beat, ev);
        };

        let note = Note.CreateNote(arrow, direction, noteStep, schedule);

        noteStep.addNote(note);
      }
      this.steps.push(noteStep);
    }

    // Populate the step scores
    this.judge.populateSteps(this.steps, this.chart);

    this.graphicComponent.createStream(this.steps);
  }

  setMissTiming(timing) {
    this.missTiming = timing;
  }

  setMineTiming(timing) {
    this.mineTiming = timing;
  }

  setSongPlayer(sp) {
    this.songPlayer = sp;
  }

  get sprite() {
    return this.graphicComponent.sprite;
  }

  update() {

    // Get the time information
    this.time = this.songPlayer.getTime();
    let [beat, index] = this.song.getBeat(this.time);
    this.beat = beat;


    // Update the note stream
    //this.updateWindow(beat);
    this.updateAction();
    this.graphicComponent.update(beat);

    // update the missed notes
    this.updateEvents();

    // Do the scheduled Actions
    this.handleScheduled();

    // Handle the inputs
    if (this.controller !== null) {
      let cmds = this.controller.handleInput();
      for (let cmd of cmds) {
        cmd.execute(this);
      }
    }
  }

  updateAction() {

    if (this.actionIndex >= this.steps.length - 2) {
      return;
    }

    let step = this.steps[this.actionIndex + 1];

    while (Math.abs(step.time - this.time) < this.missTiming) {

      // Add the notes to the action notes
      for (let note of step.notes) {

        let list;
        // Initialisation
        if (!this.actionNotes.has(note.direction)) {
          this.actionNotes.set(note.direction, []);
        }

        list = this.actionNotes.get(note.direction);

        // Remove stale notes
        while (list.length > 0 && list[0].getDistance(this.time) > this.missTiming) {
          list.shift();
        }

        list.push(note);
      }

      this.actionIndex++;
      if (this.actionIndex >= this.steps.length - 2) {
        return;
      }

      step = this.steps[this.actionIndex + 1];

    }

  }

  // TODO: Reduce to just find the actionStep?
  // The inside and out are not used currently
  updateWindow(beat) {

    if (this.firstStepIndex >= this.steps.length) {
      return;
    }

    let x = this.firstStepIndex;
    let step = this.steps[x];
    this.actionStep = null;
    let distance = -1;

    while (step.beat < beat + 2 * this.fieldView){

      // The step enter the existence window
      if (x > this.lastStepIndex) {
        step.applyToNotes('inside',this.stream);
        this.lastStepIndex++;
      }

      // The step leaves the existence window
      if (step.beat < beat - this.fieldView) {
        step.applyToNotes('out');
        this.firstStepIndex++;
      }

      if (++x >= this.steps.length) {
        break;
      }
      step = this.steps[x];
    }

  }

  updateEvents() {

    let startStep = Math.min(this.missedStepIndex, this.collisionStepIndex)

    if (startStep >= this.steps.length) {
      return;
    }

    let x = startStep;
    let step = this.steps[x];

    while (step.time - this.mineTiming <= this.time) {

      // Note passed the miss window
      if (step.time + this.missTiming <= this.time && x >= this.missedStepIndex) {
        for (let n of step.notes) {
          if (n.type === MINE_NOTE) {
            n.dodge();
          } else {
            n.miss();
          }
        }
        this.missedStepIndex++;
      }

      // Note is in the collision window
      // TODO: This might fire too many events and slow down the game (maybe?)
      if (x >= this.collisionStepIndex) {
        let pressed = this.controller.getPressed();

        if (pressed.length > 0) {
          step.applyToDirections(this.controller.getPressed(), 'collide');
        }

        if (step.time + this.mineTiming <= this.time) {
          this.collisionStepIndex++;
        }
      }

      if (++x >= this.steps.length) {
        break;
      }

      step = this.steps[x];
    }
  }

  // Refactor function call instead of switch?
  onNotify(ev) {

    // Common processing
    this.graphicComponent.feedback(ev);

    // Type dependent processing
    switch(ev.type) {
      case EVENT_NOTE_MISS:
        console.log("[Engine] A note is it missed", ev.note);
        this.combo.reset();
        this.lifemeter.updateLife(this.judge.getPoints(ev.note, ev.timing));
        break;

      case EVENT_NOTE_DODGE:
        console.log("[Engine] A note is it dodged", ev.note);
        break;

      case EVENT_NOTE_FINISH:
        console.log("[Engine] A note is it finished", ev.note, ev.timing);
        this.lifemeter.updateLife(this.judge.getPoints(ev.note, ev.timing));
        break;

      case EVENT_NOTE_HIT:
        console.log("[Engine] A note is it hit", ev.note, ev.timing);

        if (this.judge.isGoodTiming(ev.timing)) {
          this.combo.add();
        } else {
          this.combo.reset();
        }
        this.lifemeter.updateLife(this.judge.getPoints(ev.note, ev.timing));

        break;
      case EVENT_STEP_HIT:
        console.log("[Engine] A step is it hit", ev.step, ev.timing);
        this.score.add(ev.score);
        break;
      case EVENT_PAD_CONNECTED:
        console.log('[Engine] Pad Connected');
        this.controller = ev.pad;
        this.controller.setSongPlayer(this.songPlayer);
        break;
    }

  }

  // Get the target note
  getActionNote(direction, time) {

    let list = this.actionNotes.get(direction) || [];

    if (list.length === 0) {
      return null;
    }

    let best = 9999;
    let target = null;


    for (let note of list) {
      // Look for the min
      // TODO: Could be optimized to stop at first increase
      if (note.getDistance(time) < best) {
        target = note;
        best = note.getDistance(time);
      }
    }

    return target;

  }

  schedule(at, action, absolute=true, beat=true, base_ev=null) {

    let ev = {action};

    if (base_ev !== null) {
      ev = base_ev;
    }

    if (beat) {
      ev.beat = absolute ? at : at + this.beat;
    } else {
      ev.time = absolute ? at : at + this.time;
    }

    if (base_ev === null) {
      this.scheduledEvents.add(ev);
    }

    return ev;
  }

  handleScheduled() {

    for (let ev of this.scheduledEvents) {
      if ((ev.beat !== undefined && ev.beat <= this.beat) ||
          (ev.time !== undefined && ev.time <= this.time)) {
        ev.action();
        this.scheduledEvents.delete(ev);
      }
    }
  }


}

class Score {

  constructor() {
    this.score = 0;
    this.graphicComponent = theme.createScoreGC();
  }

  add(amount) {
    this.score += amount;
    this.graphicComponent.update(this.score);
  }

  get sprite() {
    return this.graphicComponent.sprite;
  }
}

class Combo {

  constructor() {
    this.combo = 0;
    this.graphicComponent = theme.createComboGC();
  }

  add() {
    this.combo++;
    this.graphicComponent.update(this.combo);
  }

  reset() {
    this.combo = 0;
    this.graphicComponent.update(this.combo);
  }

  get sprite() {
    return this.graphicComponent.sprite;
  }
}

class Lifemeter {

  constructor() {
    this.maximum = 100;
    this.life = 50;

    this.graphicComponent = theme.createLifemeterGC();
    this.updateLife(0);
  }

  updateLife(amount) {

    this.life += amount;
    this.life = Math.max(Math.min(this.life, this.maximum), 0)

    this.graphicComponent.update(this.life / this.maximum);
  }

  get sprite() {
    return this.graphicComponent.sprite;
  }


}


// The Receptor only function is the graphic component
// TODO: Complete the interface
class ReceptorGraphicComponent {

  constructor(theme) {
    this.theme = theme;
  }

  create() {}
  remove() {}

}
