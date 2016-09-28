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

    // Missed steps
    this.missedStepIndex = 0;

    // Timing
    this.missTiming = 0.250;

    // Graphic Component
    this.graphicComponent = theme.createEngineGC(width, height, fieldView);

    // TODO: Link to player, score, input
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
        let note = Note.CreateNote(arrow.type, step.division, direction, noteStep, arrow.duration);

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
    let time = this.songPlayer.getTime();
    let [beat, index] = this.song.getBeat(time);

    // Update the note stream
    //this.updateWindow(beat, time);
    this.updateAction(time);
    this.graphicComponent.update(beat);

    // update the missed notes
    this.updateMissed(time);

    // Handle the inputs
    let cmds = this.controller.handleInput();
    for (let cmd of cmds) {
      cmd.execute(this);
    }
  }

  updateAction(time) {

    if (this.actionIndex >= this.steps.length - 2) {
      return;
    }

    let step = this.steps[this.actionIndex + 1];

    while (Math.abs(step.time - time) < this.missTiming) {

      // Add the notes to the action notes
      for (let note of step.notes) {

        let list;
        // Initialisation
        if (!this.actionNotes.has(note.direction)) {
          this.actionNotes.set(note.direction, []);
        }

        list = this.actionNotes.get(note.direction);

        // Remove stale notes
        while (list.length > 0 && list[0].getDistance(time) > this.missTiming) {
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
  updateWindow(beat, time) {

    if (this.firstStepIndex >= this.steps.length) {
      return;
    }

    let x = this.firstStepIndex;
    let step = this.steps[x];
    this.actionStep = null;
    let distance = -1;

    while (step.beat < beat + 2 * this.fieldView){

      // Step on which the cmd are performed is the closest from current time if less than the miss timing
      let delay = Math.abs(step.time - time);
      if ((this.actionStep === null && delay < this.missTiming) || (delay < distance)) {
        this.actionStep = step;
        distance = delay;
      }

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

  updateMissed(time) {

    if (this.missedStepIndex >= this.steps.length) {
      return;
    }

    let x = this.missedStepIndex;
    let step = this.steps[x];

    while (step.time + this.missTiming <= time) {

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

    switch(ev.type) {
      case EVENT_NOTE_HIT:
        console.log("[Engine] A note is it hit", ev.note, ev.timing);

        // TODO Trigger
        // - Combo
        // - Good, perfect
        // - Receptor Glowing
        break;
      case EVENT_STEP_HIT:
        console.log("[Engine] A step is it hit", ev.step, ev.timing);

        // TODO Trigger
        // - Score Update
        // - Life Update (or in Note?)
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

}

// The Receptor only function is the graphic component
class ReceptorGraphicComponent {

  constructor(theme) {
    this.theme = theme;
  }

  create() {}
  remove() {}

}
