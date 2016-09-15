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
    this.firstNoteIndex = 0;
    this.lastNoteIndex = -1;

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

    this.notes = [];
    this.stream = new PIXI.Container();

    let offset = this.fieldWidth / 5;
    let scale = 0;

    for (let step of this.chart.steps) {

      for (let direction in step.arrows) {
        let arrow = step.arrows[direction];
        let note = Note.CreateNote(arrow.type, step.division, direction, step.beat, arrow.duration);


        if (scale === 0) {
          scale = offset / note.sprite.width;
        }

        note.graphicComponent.resize(scale, this.multiplier);

        note.sprite.x = (parseInt(direction, 10) + 1) * offset;
        note.sprite.y = step.beat * this.multiplier;
        this.stream.addChild(note.sprite);
        this.notes.push(note);
      }
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

    let x = this.firstNoteIndex;
    let note = this.notes[x];

    while (note.beat < beat + 2 * this.fieldView){

      // The note enter the existence window
      if (x > this.lastNoteIndex) {
        note.inside(this.stream);
        this.lastNoteIndex++;
      }

      // The note leaves the existence window
      if (note.beat < beat - this.fieldView) {
        note.out();
        this.firstNoteIndex = this.firstNoteIndex < this.notes.length ? this.firstNoteIndex++ : this.firstNoteIndex;
      }

      if (++x >= this.notes.length) {
        break;
      }
      note = this.notes[x];
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
