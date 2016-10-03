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
const EVENT_NOTE_FINISH = Symbol.for('EVENT_NOTE_FINISH');
const EVENT_NOTE_MISS = Symbol.for('EVENT_NOTE_MISS');
const EVENT_STEP_HIT = Symbol.for('EVENT_STEP_HIT');

//Timer types
const RELEASE_TIMER = Symbol.for('RELEASE_TIMER');
const END_TIMER = Symbol.for('END_TIMER');

// Virtual Base Note Class
class Note {

  static NoteHit(note, delay) {

    let timing = judge.getTiming(delay);

    let ev = {
      note,
      delay,
      timing,
      type: EVENT_NOTE_HIT
    }

    // Add the note step as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have global observers
    // for such events
    Note.subject.notify(ev, [note.step]);

    return timing;
  }

  static NoteMiss(note) {

    let ev = {
      note,
      timing: TM_MISS,
      type: EVENT_NOTE_MISS
    }

    // Add the note step as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have global observers
    // for such events
    Note.subject.notify(ev, [note.step]);
  }

  static NoteFinish(note, success) {

    let timing = success ? S_OK : S_NG;

    let ev = {
      note,
      timing,
      type: EVENT_NOTE_FINISH
    }

    // Add the note step as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have global observers
    // for such events
    Note.subject.notify(ev, [note.step]);

  }

  static CreateNote(type, division, direction, step, schedule, duration=0) {

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
      note = new LongNote(type, division, direction, graphicComponent, step, duration, schedule);
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

  getDistance(time) {
    return Math.abs(time - this.step.time);
  }

  getDelay(time) {
    return this.getDistance(time);
  }

  process(cmd) {
    let delay = this.getDelay(cmd.time);

    if (cmd.action === TAP) {
      this.tap(delay);
    } else {
      this.lift(delay);
    }
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
      return new SimpleNoteHitState(this.note, delay);
    } 
    return null;
  }

  lift(delay) {
    if (this.note.type === LIFT_NOTE) {
      return new SimpleNoteHitState(this.note, delay);
    } 
    return null;
  }

  miss(note) {
    return new SimpleNoteMissState(this.note);
  }
}

class SimpleNoteHitState extends SimpleNoteState {

  enter() {

    let timing;

    // Get the timing
    timing = Note.NoteHit(this.note, this.delay);

    //TODO: Hide or not the Note based on the score
    this.note.graphicComponent.hit(timing);
  }

  constructor(note, delay) {
    super(note);
    this.delay = delay;
  }
}

class SimpleNoteMissState extends SimpleNoteState {

  enter() {
    Note.NoteMiss(this.note);
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
  hit(delay) {}

}

//-------------------------------------------------------------------

// Note that have a duration (hold, roll)
class LongNote extends Note {

  constructor(type, division, direction, graphicComponent, step, duration, schedule) {
    super(type, division, direction, graphicComponent, step);
    this.setState(new LongNoteFreshState(this));
    this.duration = duration;
    this.schedule = schedule;
  }

  getEnd() {
    return this.step.beat + this.duration;
  }

  expire(type, id) {
    const state = this.state.expire(type, id);
    if (state !== null) {
      this.setState(state);
    }
  }

  getDistance(time) {
    if (time > this.step.time && time < this.step.time + this.duration) {
      return 0;
    }
    return this.getDelay(time);
  }

  getDelay(time) {
    return Math.min(Math.abs(time - this.step.time), Math.abs(time - this.step.time - this.duration));
  }
}

class LongNoteState extends SimpleNoteState {
  expire(type, tid=null) {return null;}
}

class LongNoteFreshState extends LongNoteState {

  enter() {
    this.note.graphicComponent.create();
  }

  miss() {
    return new LongNoteDeactivatedState(this.note, true);
  }

  tap(delay) {
    return new LongNoteActivatedState(this.note, delay);
  }
}

class LongNoteActivatedState extends LongNoteState {

  enter() {
    if (this.delay !== null) {
      Note.NoteHit(this.note, this.delay);
    }

    this.note.schedule(this.note.getEnd(), () => {
      this.note.expire(END_TIMER);
    }, true, true);
  }

  constructor(note, delay) {
    super(note);
    this.delay = delay;
  }

  tap(delay) {
    if (this.note.type === ROLL_NOTE) {
      //TODO: What is the effect??
    }
    return null;
  }

  lift() {
    if (this.note.type === HOLD_NOTE) {
      return new LongNoteReleasedState(this.note);
    }

    return null;
  }

  expire(type) {
    if (type === END_TIMER) {
      return new LongNoteFinishedState(this.note);
    }
    return null;
  }

}

class LongNoteReleasedState extends LongNoteState {

  static GetTid() {
    return LongNoteReleasedState.tid++;
  }

  enter() {
    this.tid = LongNoteReleasedState.GetTid();

    this.note.schedule(this.note.step.holdTiming, () => {
      this.note.expire(RELEASE_TIMER, this.tid);
    },false, false);
  }

  expire(type, tid) {
    if (tid === this.tid) {
      return new LongNoteDeactivatedState(this.note, false);
    }

    if (type === END_TIMER) {
      return new LongNoteFinishedState(this.note);
    }

    return null;
  }

  tap(delay) {
    return new LongNoteActivatedState(this.note, null);
  }

}

LongNoteReleasedState.tid = 0;

class LongNoteDeactivatedState extends LongNoteState {
  enter() {

    this.note.graphicComponent.deactivate();

    // We did not hit the initial note
    if (this.missed) {
      Note.NoteMiss(this.note);

    } // We stopped in the middle
    else if (this.note.type === HOLD_NOTE) {
      Note.NoteFinish(this.note, false);
    }
  }

  constructor(note, missed) {
    super(note);
    this.missed = missed;
  }
}

class LongNoteFinishedState extends LongNoteState {

  enter() {
    if (this.note.type === HOLD_NOTE) {
      Note.NoteFinish(this.note, true);
    }
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
    this.delays = [];
    this.beat = beat;
    this.time = time;
    this.engine = engine;
  }

  static StepHit(step, delay) {

    let [timing, score] = judge.judge(step, delay);

    let ev = {
      step,
      timing,
      score,
      type: EVENT_STEP_HIT
    }

    // Add the note Engine as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have observers for all events
    // no matter the engine
    NoteStep.subject.notify(ev, [step.engine]);
  }

  // TODO: Replace by something more aptomized?
  applyToNotes(methodName, ...args) {
    for (let n of this.notes) {
      n[methodName](...args);
    }
  }

  noteHit(delay) {

    // Add the delay of the touched note to the list
    this.delays.push(delay);

    // The Step is validated
    if (this.delays.length === this.notes.length) {
      NoteStep.StepHit(this, Math.max(...this.delays));
    }
  }

  onNotify(ev) {

    switch(ev.type) {
      case EVENT_NOTE_HIT:

        // better notify the note before the step
        this.engine.onNotify(ev);
        this.noteHit(ev.delay);

        break;

      case EVENT_NOTE_MISS:
      case EVENT_NOTE_FINISH:
        this.engine.onNotify(ev);
        break;
    }
  }
}

// Observer Pattern for the Step hit event
NoteStep.subject = new Subject();
