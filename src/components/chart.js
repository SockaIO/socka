'use strict';

import {Subject} from '../helpers';
import {Theme, Judge} from '../services';

import {S_OK, S_NG, TM_MISS} from '../constants/judge';
import {TAP} from '../constants/input';
import {TAP_NOTE, LIFT_NOTE, FAKE_NOTE, ROLL_NOTE, HOLD_NOTE} from '../constants/chart';
import {EVENT_STEP_HIT, EVENT_NOTE_MISS, EVENT_NOTE_HIT, EVENT_NOTE_DODGE, EVENT_NOTE_FINISH, MINE_NOTE} from '../constants/chart';

//Timer types
const RELEASE_TIMER = Symbol.for('RELEASE_TIMER');
const ROLL_TIMER = Symbol.for('ROLL_TIMER');
const END_TIMER = Symbol.for('END_TIMER');

/**
 * Class representing one note in a Chart
 *
 * @memberof components
 *
 */
class Note {

  /**
   * Register a note hit and fire the event
   * @param {Note} note | Note that was hit
   * @param {Number} delay | duration between the tap event and the note position
   * @return {Symbol} timing symbol associated with the hit
   * @static
   */
  static NoteHit(note, delay) {

    let [timing, score] = Judge.JudgeNote(note, delay);

    let ev = {
      note,
      score,
      delay,
      timing,
      type: EVENT_NOTE_HIT
    };

    // Add the note step as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have global observers
    // for such events
    Note.subject.notify(ev, [note.step]);

    return timing;
  }

  /**
   * Register a note miss and fire the event
   * @param {Note} note | Note that was missed 
   * @static
   */
  static NoteMiss(note) {

    let ev = {
      note,
      timing: TM_MISS,
      type: EVENT_NOTE_MISS
    };

    // Add the note step as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have global observers
    // for such events
    Note.subject.notify(ev, [note.step]);
  }

  /**
   * Register a long note finish and fire the event
   * @param {Note} note | Note that was finished 
   * @param {Boolean} success | Was the note held to the end
   * @static
   */
  static NoteFinish(note, success) {

    let timing = success ? S_OK : S_NG;

    let ev = {
      note,
      timing,
      type: EVENT_NOTE_FINISH
    };

    // Add the note step as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have global observers
    // for such events
    Note.subject.notify(ev, [note.step]);
  }

  /**
   * Register a mine dodged and fire the event
   * @param {Note} note | Note that was dodged
   * @static
   */
  static NoteDodge(note) {

    let ev = {
      note,
      timing: TM_MISS,
      type: EVENT_NOTE_DODGE
    };

    // Add the note step as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have global observers
    // for such events
    Note.subject.notify(ev, [note.step]);
  }

  /**
   * Create a Note Object (long or simple)
   * @param {Object} arrow | Arrow of the Note
   * @param {Direction} direction | Direction of the Note
   * @param {NoteStep} step | Step which the note belongs to
   * @param {Function} schedule | Function to use to schedule actions
   * @static
   */
  static CreateNote(arrow, direction, step, schedule) {

    let note;
    let type = arrow.type;
    let duration = arrow.duration;
    let durationS = arrow.durationS;

    // Create the right type of Note
    if ([TAP_NOTE, MINE_NOTE, LIFT_NOTE, FAKE_NOTE].includes(type)) {
      let graphicComponent = Theme.GetTheme().createSimpleNoteGC();
      note = new SimpleNote(type, direction, graphicComponent, step);
    }

    if ([ROLL_NOTE, HOLD_NOTE].includes(type)) {
      let graphicComponent = Theme.GetTheme().createLongNoteGC();
      note = new LongNote(type, direction, graphicComponent, step, duration, durationS, schedule);
    }

    return note;
  }

  constructor(type, direction, graphicComponent, step) {

    this.type = type;
    this.direction = direction;
    this.graphicComponent = graphicComponent;
    this.step = step;

    // other side of the relation
    this.graphicComponent.note = this;

    this.state = null;
  }

  /**
   * Get the division of the Note
   * @return {Number} Division 
   */
  get division () {
    let div = Math.round(this.step.beat*10000)/10000 - Math.floor(this.step.beat);

    let mult = 1;
    let idx = 0;

    while (mult <= 256) {
      if (Number.isInteger(div*mult)) {
        return idx;
      }
      idx++;
      mult*=2;
    }

    return 0;
  }

  /**
   * Set the state of the Note and execute the enter transition
   * @param {State} state | State to transition to
   */
  setState(state) {
    this.state = state;
    this.state.enter();
  }

  /**
   * Get the duration between the Note and a given time
   * @param {Number} time | Time to get the distance from
   * @returns {Number} Duration
   */
  getDistance(time) {
    return Math.abs(time - this.step.time);
  }

  /**
   * Get the duration between the Note and a given time
   * @param {Number} time | Time to get the distance from
   * @returns {Number} Duration
   */
  getDelay(time) {
    return this.getDistance(time);
  }

  /**
   * Execute a user input on the Note
   * @param {Symbol} action | Type of the user input
   */
  process(action, time) {
    let delay = this.getDelay(time);

    if (action === TAP) {
      this.tap(delay);
    } else {
      this.lift(delay);
    }
  }

  /**
   * Execute a tap event
   * @param {Number} delay | time offset
   */
  tap(delay) {
    const state = this.state.tap(delay);
    if (state !== null) {
      this.setState(state);
    }
  }

  /**
   * Execute a lift event
   * @param {Number} delay | time offset
   */
  lift(delay) {
    const state = this.state.lift(delay);
    if (state !== null) {
      this.setState(state);
    }
  }

  /**
   * Execute event when the note goes out of the exitence window
   */
  out() {
    const state = this.state.out();
    if (state !== null) {
      this.setState(state);
    }
  }

  /**
   * Execute when the note out of the action window
   */
  miss() {
    const state = this.state.miss();
    if (state !== null) {
      this.setState(state);
    }
  }


  /**
   * Execute when the mine is dodged
   */
  dodge() {
    const state = this.state.dodge();
    if (state !== null) {
      this.setState(state);
    }
  }

  /**
   * Execute event when the note enters the exitence window
   */
  inside(stream) {
    const state = this.state.inside(stream);
    if (state !== null) {
      this.setState(state);
    }
  }

  /**
   * Execute when the user collides with a mine
   * */
  collide() {
    const state = this.state.collide();
    if (state !== null) {
      this.setState(state);
    }
  }

  /**
   * Get the Graphic Component sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }
}

// Observer Pattern for the Note hit event
Note.subject = new Subject();


//-------------------------------------------------------------------


/**
 * Child Class for the Note that have no duration (tap, lift, mine)
 * @extends Note
 * @memberof components
 */
class SimpleNote extends Note {
  constructor(type, direction, graphicComponent, step) {
    super(type, direction, graphicComponent, step);
    this.setState(new SimpleNoteFreshState(this));
  }
}

/**
 * Interface for the note State Class
 * @memberof components
 * @TODO: Logging Subclass?
 */
class SimpleNoteState {

  /**
   * Enter the action window
   * @returns {NoteState} State to transition to
   */
  enter() {return null;}

  /**
   * Tapped
   * @param {Number} delay | Time offset
   * @returns {NoteState} State to transition to
   */
  tap(delay) {return null;}

  /**
   * Lifted
   * @param {Number} delay | Time offset
   * @returns {NoteState} State to transition to
   */
  lift(delay) {return null;}

  /**
   * Exit the action window 
   * @returns {NoteState} State to transition to
   */
  miss() {return null;}

  /**
   * Collided with Mine
   * @returns {NoteState} State to transition to
   */
  collide() {return null;}

  /**
   * Dodged Mine
   * @returns {NoteState} State to transition to
   */
  dodge() {return null;}

  /**
   * Exit the existence window
   * @returns {NoteState} State to transition to
   */
  out() {
    // Anti Optimization
    //this.note.graphicComponent.remove();
    return null;
  }

  /**
   * Enter the existence window
   * @param {PIXI.Container} container | Note sprite container
   * @returns {NoteState} State to transition to
   */
  inside(container) {
    // Anti Optimization
    //container.addChild(this.note.sprite);
    return null;
  }

  constructor(note) {
    this.note = note;
  }
}


/**
 * Simple Note State when just created
 * @extends SimpleNoteState
 * @memberof components
 */
class SimpleNoteFreshState extends SimpleNoteState {

  enter() {
    this.note.graphicComponent.create();
  }

  tap(delay) {
    if (this.note.type === TAP_NOTE) {
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

  collide() {
    if (this.note.type === MINE_NOTE) {
      return new SimpleNoteHitState(this.note, 0);
    }

    return null;
  }

  miss(note) {
    return new SimpleNoteMissState(this.note);
  }

  dodge(note) {
    return new SimpleNoteDodgeState(this.note);
  }
}

/**
 * Simple Note State when hit
 * @extends SimpleNoteState
 * @memberof components
 */
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

/**
 * Simple Note State when missed
 * @extends SimpleNoteState
 * @memberof components
 */
class SimpleNoteMissState extends SimpleNoteState {

  enter() {
    Note.NoteMiss(this.note);
    this.note.graphicComponent.miss();
  }
}

/**
 * Simple Note State when dodged
 * @extends SimpleNoteState
 * @memberof components
 */
class SimpleNoteDodgeState extends SimpleNoteState {

  enter() {
    Note.NoteDodge(this.note);
    this.note.graphicComponent.dodge();
  }
}

//-------------------------------------------------------------------

/**
 * Note Child class for note with a duration (hold, roll)
 * @extends Note
 * @memberof components
 */
class LongNote extends Note {

  constructor(type, direction, graphicComponent, step, duration, durationS, schedule) {
    super(type, direction, graphicComponent, step);
    this.setState(new LongNoteFreshState(this));
    this.duration = duration;
    this.durationS = durationS;
    this.schedule = schedule;
  }

  /**
   * Get the end timecode for the Note
   * @returns {Number} End timecode
   */
  getEnd() {
    return this.step.beat + this.duration;
  }

  /**
   * Expire a Note timer and change state if required
   * @param {Symbol} type | Timer Type
   * @param {Number} id | Timer id
   */
  expire(type, id) {
    const state = this.state.expire(type, id);
    if (state !== null) {
      this.setState(state);
    }
  }

  /**
   * Get the minimum distance from the Note
   * @param {Number} Time to get the distance from
   * @returns {Number} distance
   */
  getDistance(time) {
    if (time > this.step.time && time < this.step.time + this.durationS) {
      return 0;
    }
    return this.getDelay(time);
  }

  /**
   * Get the distance from the beginning of the Note
   * @param {Number} Time to get the distance from
   * @returns {Number} distance
   */
  getDelay(time) {
    return Math.min(Math.abs(time - this.step.time), Math.abs(time - this.step.time - this.durationS));
  }
}

/**
 * Long Note State
 * @extends SimpleNoteState
 * @memberof components
 */
class LongNoteState extends SimpleNoteState {

  /**
   * Expire a timer
   * @param {Symbol} type | Timer Type
   * @param {Number} id | Timer id
   * @returns {State} State to transition to
   */
  expire(type, tid=null) {return null;}
}

/**
 * Long Note state when just created
 * @extends LongNoteState
 * @memberof components
 */
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

/**
 * Long Note state when tapped and thus activated
 * @extends LongNoteState
 * @memberof components
 */
class LongNoteActivatedState extends LongNoteState {

  enter() {
    if (this.delay !== null) {
      Note.NoteHit(this.note, this.delay);
    }

    this.note.schedule(this.note.getEnd(), () => {
      this.note.expire(END_TIMER);
    }, true, true);

    if (this.note.type === ROLL_NOTE) {
      this.roll_timeout = this.note.schedule(this.note.step.rollTiming, () => {
        this.note.expire(ROLL_TIMER);
      }, false, false);
    }
  }

  constructor(note, delay) {
    super(note);
    this.delay = delay;
  }

  tap(delay) {
    if (this.note.type === ROLL_NOTE) {
      this.note.schedule(this.note.step.rollTiming, null, false, false, this.roll_timeout);
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
    } else if (type === ROLL_TIMER) {
      return new LongNoteDeactivatedState(this.note, false);
    }
    return null;
  }

}

/**
 * Long Note state when released from activated state
 * @extends LongNoteState
 * @memberof components
 */
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

/**
 * Long Note state when deactivated
 * @extends LongNoteState
 * @memberof components
 */
class LongNoteDeactivatedState extends LongNoteState {
  enter() {

    this.note.graphicComponent.deactivate();

    // We did not hit the initial note
    if (this.missed) {
      Note.NoteMiss(this.note);

    } // We stopped in the middle
    else {
      Note.NoteFinish(this.note, false);
    }
  }

  constructor(note, missed) {
    super(note);
    this.missed = missed;
  }
}

/**
 * Long Note state when activated to the end and thus finished
 * @extends LongNoteState
 * @memberof components
 */
class LongNoteFinishedState extends LongNoteState {

  enter() {
    this.note.graphicComponent.finish();
    Note.NoteFinish(this.note, true);
  }
}


//-------------------------------------------------------------------


/**
 * Class for a Step in the Chart
 * @memberof components
 */
class NoteStep {

  constructor(beat, time, engine) {
    this.notes = [];
    this.delays = [];
    this.beat = beat;
    this.time = time;
    this.engine = engine;

    // Number of notes to hit to trigger the step
    this.toHit = 0;
  }

  /**
   * Register a step hit and fire the event
   * @param {NoteStep} step | Step that was hit
   * @param {Number} delay | duration between the tap event and the step position
   * @static
   */
  static StepHit(step, delay) {

    let [timing, score] = Judge.JudgeStep(step, delay);

    let ev = {
      step,
      timing,
      score,
      type: EVENT_STEP_HIT
    };

    // Add the note Engine as an extra observer
    // TODO: Maybe handle more gracefully
    // The idea is to have the possibility to have observers for all events
    // no matter the engine
    NoteStep.subject.notify(ev, [step.engine]);
  }

  /**
   * Call a method of all the notes in the step
   * @param {String} methodName | name of the Note method to call
   * @param {Any} ...args | Arguments
   */
  applyToNotes(methodName, ...args) {
    for (let n of this.notes) {
      n[methodName](...args);
    }
  }

  /**
   * Call a method of all the notes in the step with given directions
   * @param {Number|Array} directions | directions to select
   * @param {String} methodName | name of the Note method to call
   * @param {Any} ...args | Arguments
   */
  applyToDirections(directions, methodName, ...args) {
    for (let n of this.notes) {
      if (directions.includes(n.direction)) {
        n[methodName](...args);
      }
    }
  }

  /**
   * Add a Note to the Step
   * @param {Note} note | Note to add
   */
  addNote(note) {
    this.notes.push(note);

    if (note.type !== MINE_NOTE) {
      this.toHit++;
    }
  }

  /*
   * Called when the note is hit
   * @param {Object} ev | Note hit event
   */
  noteHit(ev) {
    if (ev.note.type === MINE_NOTE) {
      return;
    }

    let delay = ev.delay;

    // Add the delay of the touched note to the list
    this.delays.push(delay);

    // The Step is validated
    if (this.delays.length === this.notes.length) {
      NoteStep.StepHit(this, Math.max(...this.delays));
    }
  }

  /*
   * Notify method for the observer pattern
   * @param {Object} ev | Event
   */
  onNotify(ev) {

    switch(ev.type) {
    case EVENT_NOTE_HIT:

      // better notify the note before the step
      this.engine.onNotify(ev);
      this.noteHit(ev);

      break;

    case EVENT_NOTE_MISS:
    case EVENT_NOTE_DODGE:
    case EVENT_NOTE_FINISH:
      this.engine.onNotify(ev);
      break;
    }
  }
}

// Observer Pattern for the Step hit event
NoteStep.subject = new Subject();

let CreateNote = Note.CreateNote;

export {
  CreateNote,
  NoteStep
};
