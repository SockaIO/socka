/* jshint esnext: true */
"use strict";

class Engine {

  constructor() {

    // Field related info
    this.fieldWidth = 400;
    this.fieldHeight = 600;
    this.fieldView = 6;

    // Song related info
    this.chart = null;
    this.background = null;
    this.audio = null;

    // Window of existing notes
    this.firstStepIndex = 0;
    this.lastStepIndex = -1;

    // TODO: Link to player, score, input
  }

  loadSong(song, chartIndex) {
    //TODO: Load resources
    
    this.chart = song.charts[chartIndex];
    this.song = song;
  }


  createField() {

    // Create the container
    this.field = new PIXI.Container();
    this.field.width = this.fieldWidth;
    this.field.height = this.fieldHeight;

    this.multiplier = this.fieldHeight / this.fieldView;

    return this.field;
  }

  // Craete the Note stream
  createStream() {

    this.steps = [];
    this.stream = new PIXI.Container();

    let offset = this.fieldWidth / 5;
    let scale = 0;

    for (let step of this.chart.steps) {

      let noteStep = new NoteStep(step.beat, step.time);

      for (let direction in step.arrows) {
        let arrow = step.arrows[direction];
        let note = Note.CreateNote(arrow.type, step.division, direction, noteStep, arrow.duration);

        if (scale === 0) {
          scale = offset / note.sprite.width;
        }

        note.graphicComponent.resize(scale, this.multiplier);

        note.sprite.x = (parseInt(direction, 10) + 1) * offset;
        note.sprite.y = step.beat * this.multiplier;
        this.stream.addChild(note.sprite);
        noteStep.notes.push(note);
      }

      this.steps.push(noteStep);
    }

    this.field.addChild(this.stream);

  }

  setSongPlayer(sp) {
    this.songPlayer = sp;
  }

  update() {
    let time = this.songPlayer.getTime();
    let [beat, index] = this.song.getBeat(time);

    this.updateWindow(beat);

    this.field.children[1].y = -1 * beat * this.multiplier;

  }

  updateWindow(beat) {

    let x = this.firstStepIndex;
    let step = this.steps[x];

    while (step.beat < beat + 2 * this.fieldView){

      // The step enter the existence window
      if (x > this.lastStepIndex) {
        step.applyToNotes('inside',this.stream);
        this.lastStepIndex++;
      }

      // The step leaves the existence window
      if (step.beat < beat - this.fieldView) {
        step.applyToNotes('out');
        this.firstStepIndex = this.firstStepIndex < this.steps.length ? this.firstStepIndex++ : this.firstStepIndex;
      }

      if (++x >= this.steps.length) {
        break;
      }
      step = this.steps[x];
    }

  }

}

// note receptor
class Receptor {

  constructor() {
  }

}

class ReceptorGraphicComponent {

  constructor(theme) {
    this.theme = theme;
  }

  create() {}
  remove() {}

}
