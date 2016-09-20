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
    this.actionStep = null;

    // Missed steps
    this.missedStepIndex = 0;

    // Timing
    this.missTiming = 0.250;

    // Graphic Component
    this.graphicComponent = theme.createEngineGC(width, height, fieldView);

    // TODO: Link to player, score, input
  }

  loadSong(song, chartIndex) {
    //TODO: Load resources
    
    this.chart = song.charts[chartIndex];
    this.song = song;

    this.steps = [];

    for (let step of this.chart.steps) {

      let noteStep = new NoteStep(step.beat, step.time);

      for (let directionS in step.arrows) {
        let direction = parseInt(directionS, 10);
        let arrow = step.arrows[direction];
        let note = Note.CreateNote(arrow.type, step.division, direction, noteStep, arrow.duration);

        noteStep.notes.push(note);
      }
      this.steps.push(noteStep);
    }

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
    this.updateWindow(beat);
    this.graphicComponent.update(beat);

    // update the missed notes
    this.updateMissed(time);

    // Handle the inputs
    let cmds = this.controller.handleInput();
    for (let cmd of cmds) {
      cmd.execute(this);
    }
  }

  updateWindow(beat) {

    if (this.firstStepIndex >= this.steps.length) {
      return;
    }

    let x = this.firstStepIndex;
    let step = this.steps[x];
    let distance = this.actionStep !== null ? Math.abs(this.actionStep.beat - beat) : 999999;

    while (step.beat < beat + 2 * this.fieldView){

      // Step on which the cmd are performed is the closest from current beat
      // TODO: Can be optimized I think
      if (this.actionStep === null || distance > Math.abs(step.beat - beat)) {
        this.actionStep = step;
        distance = Math.abs(step.beat - beat);
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

    while (step.time + this.missTiming >= time) {

      step.applyToNotes('miss');
      this.missedStepIndex++;

      if (++x >= this.steps.length) {
        break;
      }

      step = this.steps[x];
    }
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
