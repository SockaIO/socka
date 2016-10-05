/* jshint esnext: true */
"use strict";

class Engine {

  constructor(width, height, fieldView) {

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
    this.scheduledEvents = [];

    // Missed steps
    this.missedStepIndex = 0;

    // Timing
    this.missTiming = 0.250;

    // Graphic Component
    this.graphicComponent = theme.createEngineGC(width, height, fieldView);

    // TODO: Link to player, score, input

    // Score
    this.score = new Score();
    this.graphicComponent.placeScore(this.score.sprite);
  }

  loadSong(song, chartIndex, judge) {
    //TODO: Load resources
    
    this.chart = song.charts[chartIndex];
    this.song = song;

    this.steps = [];

    for (let step of this.chart.steps) {

      let noteStep = new NoteStep(step.beat, step.time, engine);

      for (let directionS in step.arrows) {
        let direction = parseInt(directionS, 10);
        let arrow = step.arrows[direction];

        let schedule = (time, action, absolute, beat) => {
          return this.schedule(time, action, absolute, beat);
        }

        let note = Note.CreateNote(arrow.type, step.division, direction, noteStep, schedule, arrow.duration, arrow.durationS);

        noteStep.notes.push(note);
      }
      this.steps.push(noteStep);
    }

    // Populate the step scores
    judge.populateSteps(this.steps, this.chart);

    this.graphicComponent.createStream(this.steps);
  }

  setMissTiming(timing) {
    this.missTiming = timing;
  }

  setSongPlayer(sp) {
    this.songPlayer = sp;
  }

  get sprite() {
    return this.graphicComponent.field;
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
    this.updateMissed();

    // Do the scheduled Actions
    this.handleScheduled();

    // Handle the inputs
    let cmds = this.controller.handleInput();
    for (let cmd of cmds) {
      cmd.execute(this);
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

  updateMissed() {

    if (this.missedStepIndex >= this.steps.length) {
      return;
    }

    let x = this.missedStepIndex;
    let step = this.steps[x];

    while (step.time + this.missTiming <= this.time) {

      step.applyToNotes('miss');
      this.missedStepIndex++;

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
        break;

      case EVENT_NOTE_FINISH:
        console.log("[Engine] A note is it finished", ev.note, ev.timing);
        break;

      case EVENT_NOTE_HIT:
        console.log("[Engine] A note is it hit", ev.note, ev.timing);


        // TODO Trigger
        // - Combo
        // - Life Update (or in Note?)
        break;
      case EVENT_STEP_HIT:
        console.log("[Engine] A step is it hit", ev.step, ev.timing);
        this.score.add(ev.score);
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

  schedule(at, action, absolute=true, beat=true) {

    let ev = {action};

    if (beat) {
      ev.beat = absolute ? at : at + this.beat;
    } else {
      ev.time = absolute ? at : at + this.time;
    }

    this.scheduledEvents.push(ev);
    console.log(ev);
  }

  handleScheduled() {

    let toRemove = [];

    for (let x=0; x<this.scheduledEvents.length; x++) {
      let ev = this.scheduledEvents[x];

      if ((ev.beat !== undefined && ev.beat <= this.beat) ||
          (ev.time !== undefined && ev.time <= this.time)) {
        ev.action();
        toRemove.push(x);
      }
    }

    // Remove the processed Events
    for (let i of toRemove) {
      this.scheduledEvents.splice(i);
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

// The Receptor only function is the graphic component
// TODO: Complete the interface
class ReceptorGraphicComponent {

  constructor(theme) {
    this.theme = theme;
  }

  create() {}
  remove() {}

}
