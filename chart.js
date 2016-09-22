/* jshint esnext: true */
"use strict";

// Note Types

const TAP_NOTE = Symbol.for('TAP_NOTE');
const MINE_NOTE = Symbol.for('MINE_NOTE');
const LIFT_NOTE = Symbol.for('LIFT_NOTE');
const FAKE_NOTE = Symbol.for('FAKE_NOTE');

const ROLL_NOTE = Symbol.for('ROLL_NOTE');
const HOLD_NOTE = Symbol.for('HOLD_NOTE');


// Directions

const LEFT = Symbol.for('LEFT');
const RIGHT = Symbol.for('RIGHT');
const UP = Symbol.for('UP');
const DOWN = Symbol.for('DOWN');

// Events
const EVENT_NOTE_HIT = Symbol.for('EVENT_NOTE_HIT');
const EVENT_STEP_HIT = Symbol.for('EVENT_STEP_HIT');

// Virtual Base Note Class
class Note {

  static NoteHit(note, timing) {

    // TODO: Compute and return the score + put in event

    let ev = {
      note,
      timing,
      type: EVENT_NOTE_HIT,
      score: 10
    }

    // Add the note step as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have global observers
    // for such events
    Note.subject.notify(ev, [note.step]);
  }

  static noteMiss(note) {
    // TODO: Create the event
  }

  static CreateNote(type, division, direction, step, duration=0) {

    let note;

    if (typeof(Note.theme) === 'undefined') {
      console.log('You need to specify the theme for the Note factory');
      return;
    }

    // Create the right type of Note
    if ([TAP_NOTE, MINE_NOTE, LIFT_NOTE, FAKE_NOTE].includes(type)) {
      let graphicComponent = theme.createSimpleNoteGC();
      note = new SimpleNote(type, division, direction, graphicComponent, step);
    }

    if ([ROLL_NOTE, HOLD_NOTE].includes(type)) {
      let graphicComponent = theme.createLongNoteGC();
      note = new LongNote(type, division, direction, graphicComponent, step, duration);
    }

    return note;

  }

  constructor(type, division, direction, graphicComponent, step) {

    this.type = type;
    this.division = division;
    this.direction = direction;
    this.graphicComponent = graphicComponent;
    this.step = step;

    // other side of the relation
    this.graphicComponent.note = this;

    this.state = null;
  }

  setState(state) {
    this.state = state;
    this.state.enter();
  }

  tap(delay) {
    const state = this.state.tap(delay);
    if (state !== null) {
      this.setState(state);
    }
  }

  lift(delay) {
    const state = this.state.lift(delay);
    if (state !== null) {
      this.setState(state);
    }
  }

  // Note out of existence wiexistence window
  out() {
    const state = this.state.out();
    if (state !== null) {
      this.setState(state);
    }
  }

  // Note passed the action window
  miss() {
    const state = this.state.miss();
    if (state !== null) {
      this.setState(state);
    }
  }

  // Note in existence window
  inside(stream) {
    const state = this.state.inside(stream);
    if (state !== null) {
      this.setState(state);
    }
  }

  get sprite() {
    return this.graphicComponent.sprite;
  }


}

// Observer Pattern for the Note hit event
Note.subject = new Subject();


//-------------------------------------------------------------------


// Note that have no duration (tap, lift...)
class SimpleNote extends Note {
  constructor(type, division, direction, graphicComponent, step) {
    super(type, division, direction, graphicComponent, step);
    this.setState(new SimpleNoteFreshState(this));
  }
}

// Interface for the Note States
// TODO: Logging?
class SimpleNoteState {
  enter() {}
  tap(delay) {return null;}
  lift(delay) {return null;}
  miss() {return null;}

  out() {
    // Anti Optimization
    //this.note.graphicComponent.remove();
    return null;
  }

  inside(container) {
    // Anti Optimization
    //container.addChild(this.note.sprite);
    return null;
  }

  constructor(note) {
    this.note = note;
  }
}


class SimpleNoteFreshState extends SimpleNoteState {

  enter() {
    this.note.graphicComponent.create();
  }

  tap(delay) {
    if (this.note.type === TAP_NOTE || this.note.type == MINE_NOTE) {

      //TODO: Compute the timing
      const timing = null;
      return new SimpleNoteHitState(this.note, timing);

    } 
    return null;
  }

  lift(delay) {
    if (this.note.type === LIFT_NOTE) {

      //TODO: Compute the timing
      const timing = null;
      return new SimpleNoteHitState(this.note, timing);

    } 
    return null;
  }

  out(note) {
    return new SimpleNoteMissState(this.note);
  }
}

class SimpleNoteHitState extends SimpleNoteState {

  enter() {

    let score;

    // Get the score
    Note.NoteHit(this.note, this.timing);

    //TODO: Hide or not the Note based on the score
    this.note.graphicComponent.hit(score);
  }

  constructor(note, hitTiming) {
    super(note);
    this.timing = hitTiming;
  }
}

class SimpleNoteMissState extends SimpleNoteState {

  enter() {
    Note.noteMiss(this.note);
    this.note.graphicComponent.miss();
  }
}


// Simple Note Graphics handling
class SimpleNoteGraphicComponent {

  constructor(theme) {
    this.theme = theme;
    this.sprite = null;
  }

  create() {}
  remove() {}

  // TODO: Replace with pure graphic function
  miss() {}
  hit(timing) {}

}

//-------------------------------------------------------------------

// Note that have a duration (hold, roll)
class LongNote extends Note {

  constructor(type, division, direction, graphicComponent, step, duration) {
    super(type, division, direction, graphicComponent, step);
    this.setState(new LongNoteFreshState(this));
    this.duration = duration;
  }

  expire(id) {
    const state = this.state.expires(this, id);
    if (state !== null) {
      this.setState(state);
    }
  }
}

class LongNoteState extends SimpleNoteState {
  expire(id) {return null;}
}

class LongNoteFreshState extends LongNoteState {

  enter() {
    this.note.graphicComponent.create();
  }

  out() {
    return new LongNoteDeactivatedState();
  }

  tap(delay) {

    //TODO: Get timing
    const timing = null;
    return new LongNoteActivatedState(this.note, timing);
  }
}

class LongNoteActivatedState extends LongNoteState {

  enter() {
    //TODO: Not sure if feedback
    
    if (this.timing !== null) {
      Note.NoteHit(this.note, this.timing);
    }
    //TODO: Timer for expire command at the end of hold
  }

  constructor(note, timing) {
    super(note);
    this.timing = timing;
  }

  tap(delay) {
    if (this.note.type === ROLL_NOTE) {
      //TODO: What is the effect??
    }
    return null;
  }

  lift() {
    if (this.note.type === HOLD_NOTE) {
      // TODO: Set timer to send expire command
      const tid = null;
      return new LongNoteReleasedState(this.note, tid);
    }

    return null;
  }

  out() {
    return new LongNoteFinishedState(this.note);
  }

  expire(tid) {
    //TODO: Check if tid is expiration and finish note
    return null;
  }

}

class LongNoteReleasedState extends LongNoteState {

  constructor(note, tid) {
    super(note);
    // Expiration timer ID
    this.tid = tid;
  }

  expire(tid) {
    if (tid === this.tid) {
      return new LongNoteDeactivatedState(this.note, false);

    }

    //TODO: handle when this is hold finish timer

    return null;
  }

  tap(delay) {
    return new LongNoteActivatedState(this.note, null);
  }

}

class LongNoteDeactivatedState extends LongNoteState {
  enter() {
    //TODO: Deactivated sprite
    if (this.missed) {
      Note.noteMiss(this.note);
    }
  }

  constructor(note, missed) {
    super(note);
    this.misssed = missed;
  }
}

class LongNoteFinishedState extends LongNoteState {

  enter() {
    if (this.note.type === HOLD_NOTE) {
      // TODO: Timing TM_OK 
      Note.NoteHit(this.note);
    }

    // TODO: Graphic feedback??
  }
}


class LongNoteGraphicComponent {

  constructor(theme) {
    this.theme = theme;
  }

  create() {}
  remove() {}
  deactivate() {}

  activate() {}
  finish() {}

}


//-------------------------------------------------------------------


class NoteStep {

  constructor(beat, time, engine) {
    this.notes = [];
    this.scores = [];
    this.beat = beat;
    this.time = time;
    this.engine = engine;
  }

  static StepHit(step, timing) {

    let ev = {
      step,
      timing,
      type: EVENT_STEP_HIT
    }

    // Add the note Engine as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have observers for all events
    // no matter the engine
    NoteStep.subject.notify(ev, [step.engine]);
  }

  process(cmd) {
    let delay = Math.abs(cmd.time - this.time);

    let score = null;

    for (let note of this.notes) {
      if (note.direction === cmd.direction) {
        if (cmd.action === TAP) {
           note.tap(delay);
        } else {
           note.lift(delay);
        }
      }
    }
  }

  // TODO: Replace by something more aptomized?
  applyToNotes(methodName, ...args) {
    for (let n of this.notes) {
      n[methodName](...args);
    }
  }

  noteHit(score) {

    // Add the score of the touched note to the list
    this.scores.push(score);

    // The Step is validated
    if (this.scores.length === this.notes.length) {
      NoteStep.StepHit(this, null);
    }
  }

  onNotify(ev) {

    switch(ev.type) {
      case EVENT_NOTE_HIT:
        console.log('[Step] A note is hit', ev.note, ev.timing);

        // better notify the note before the step
        this.engine.onNotify(ev);

        this.noteHit(ev.score);

        break;

    }
  }
}

// Observer Pattern for the Step hit event
NoteStep.subject = new Subject();
