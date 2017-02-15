'use strict';

import {Judge, Theme} from '../services';
import {KEY_UP, KEY_LEFT, KEY_DOWN, KEY_RIGHT, TAP, LIFT, EVENT_PAD_CONNECTED} from '../constants/input';
import {EVENT_STEP_HIT, EVENT_NOTE_MISS, EVENT_NOTE_HIT, EVENT_NOTE_DODGE, EVENT_NOTE_FINISH, MINE_NOTE} from '../constants/chart';
import {TM_W5, TM_MINE, TIMINGS, S_OK} from '../constants/judge';
import {RSC_SONG} from '../constants/resources';

import {CreateNote, NoteStep} from './chart';

import log from 'loglevel';

/**
 * Game Engine for one player
 * @class
 * @memberof components
 */
class Engine {

  constructor(width, height, fieldView, player, songPlayer) {

    // Player
    this.player = player;

    // Song related info
    this.chart = null;

    // Keypressed
    this.keyPressed = new Set();

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
    this.graphicComponent = Theme.GetTheme().createEngineGC(width, height, fieldView);

    // Score
    this.score = new Score();
    this.graphicComponent.placeScore(this.score.sprite);

    // Combo
    this.combo = new Combo();
    this.graphicComponent.placeCombo(this.combo.sprite);

    // Stats Tracker
    this.statsTracker = new StatsTracker();

    // Life
    this.lifemeter = new Lifemeter();
    this.graphicComponent.placeLifemeter(this.lifemeter.sprite);

    // Timing
    this.missTiming = Judge.GetTimingValue(TM_W5);
    this.mineTiming = Judge.GetTimingValue(TM_MINE);

    // Song Player
    this.songPlayer = songPlayer;

    this.progressionBar = new ProgressionBar(songPlayer);
    this.graphicComponent.placeProgressionBar(this.progressionBar.sprite);
  }

  /**
   * Load the chart from the songIndex
   * @param {SongIndex} songIndex | Song to load
   * @param {Number} chartIndex | Index of the chart to use (difficulty)
   */
  loadSong(songIndex, chartIndex) {

    return songIndex.load(RSC_SONG).then((song) => {
      this.chart = song.charts[chartIndex];
      this.song = song;

      this.loadSongInternal();
    });
  }

  /**
   * Finish loading song Data
   */
  loadSongInternal() {

    this.steps = [];

    for (let step of this.chart.steps) {

      let noteStep = new NoteStep(step.beat, step.time, this);

      for (let directionS in step.arrows) {
        let direction = parseInt(directionS, 10);
        let arrow = step.arrows[direction];

        let schedule = (time, action, absolute, beat, ev=null) => {
          return this.schedule(time, action, absolute, beat, ev);
        };

        let note = CreateNote(arrow, direction, noteStep, schedule);

        noteStep.addNote(note);
      }
      this.steps.push(noteStep);
    }

    // Populate the step scores
    Judge.PopulateSteps(this.steps, this.chart);

    this.graphicComponent.createStream(this.steps);
  }

  /*
   * Get the GC Sprite
   * @returns {PIXI.Container} Sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }

  /**
   * Update the engine for next tick
   */
  update() {

    // Get the time information
    this.time = this.songPlayer.getTime();

    //TODO: index?
    let [beat, ] = this.song.getBeat(this.time);
    this.beat = beat;


    // Update the note stream
    //this.updateWindow(beat);
    this.updateAction();
    this.graphicComponent.update(beat);

    this.progressionBar.update();

    // update the missed notes
    this.updateEvents();

    // Do the scheduled Actions
    this.handleScheduled();
  }

  /**
   * Called on dance inputs
   * @param {Symbol} keycode | Code of the key for the action
   * @param {Symbol} action | Action performed
   */
  danceInput(keycode, action) {

    let convert = {
      [KEY_UP]:2,
      [KEY_LEFT]:0,
      [KEY_DOWN]:1,
      [KEY_RIGHT]:3
    };

    let direction = convert[keycode];


    // TODO: More accuracy for the time ?
    let time = this.songPlayer.getTime();

    // Visual Effect
    if (action === TAP) {
      this.keyPressed.add(direction);
      this.graphicComponent.receptor.tap(direction);
    }

    // Visual Effect
    if (action === LIFT) {
      this.keyPressed.delete(direction);
      this.graphicComponent.receptor.lift(direction);
    }

    // Action on the step
    let note = this.getActionNote(direction, time);

    if (note === null) {
      return;
    }

    note.process(action, time);
  }

  /**
   * Update the action window
   */
  updateAction() {

    if (this.actionIndex >= this.steps.length - 2) {
      return;
    }

    let step = this.steps[this.actionIndex + 1];

    while (step.time - this.time < this.missTiming) {

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
  /**
   * Update the Existance Window
   */
  updateWindow(beat) {

    if (this.firstStepIndex >= this.steps.length) {
      return;
    }

    let x = this.firstStepIndex;
    let step = this.steps[x];
    this.actionStep = null;

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

  /**
   * Compute the events for the steps inside the action window
   */
  updateEvents() {

    let startStep = Math.min(this.missedStepIndex, this.collisionStepIndex);

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
        let pressed = [...this.keyPressed];

        if (pressed.length > 0) {
          step.applyToDirections(pressed, 'collide');
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

  /**
   * Notify function for the observer pattern
   * @param {Object} ev | Event
   *  TODO: Refactor function call instead of switch?
   */
  onNotify(ev) {

    // Common processing
    this.graphicComponent.feedback(ev);

    // Track the stats
    this.statsTracker.process(ev);

    // Type dependent processing
    switch(ev.type) {
    case EVENT_NOTE_MISS:
      log.debug('[Engine] A note is it missed', ev.note);
      this.combo.reset();
      this.lifemeter.updateLife(Judge.GetPoints(ev.note, ev.timing));
      break;

    case EVENT_NOTE_DODGE:
      log.debug('[Engine] A note is it dodged', ev.note);
      break;

    case EVENT_NOTE_FINISH:
      log.debug('[Engine] A note is it finished', ev.note, ev.timing);
      this.lifemeter.updateLife(Judge.GetPoints(ev.note, ev.timing));
      break;

    case EVENT_NOTE_HIT:
      log.debug('[Engine] A note is it hit', ev.note, ev.timing);

      if (Judge.IsGoodTiming(ev.timing)) {
        this.combo.add();
      } else {
        this.combo.reset();
      }

      this.lifemeter.updateLife(Judge.GetPoints(ev.note, ev.timing));

      break;
    case EVENT_STEP_HIT:
      log.debug('[Engine] A step is it hit', ev.step, ev.timing);
      this.score.add(ev.score);
      break;
    case EVENT_PAD_CONNECTED:
      log.debug('[Engine] Pad Connected');
      this.controller = ev.pad;
      this.controller.setSongPlayer(this.songPlayer);
      break;
    }

  }

  /**
   * Get the note that is affected by the user input for the given time and direction
   * @param {Number} direction | Direction to look for
   * @param {Number} time | Timecode of the input
   * @returns {Note} Target Note
   */
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

  /**
   * Schedule an action to be executed
   * @param {Number} at | Timecode
   * @param {Function} action | Action to execute
   * @param {Boolean} absolute | Use absolute time (default is true)
   * @param {Boolean} beat | If true count in beat otherwise in seconds (default is true)
   * @param {Object} base_ev | If provided modify this event
   * @retuns {Object} Scheduled event
   */
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

  /**
   * Execute the scheduled actions
   */
  handleScheduled() {

    for (let ev of this.scheduledEvents) {
      if ((ev.beat !== undefined && ev.beat <= this.beat) ||
          (ev.time !== undefined && ev.time <= this.time)) {
        ev.action();
        this.scheduledEvents.delete(ev);
      }
    }
  }


  /**
   * Gather and present the results for this Engine
   * @returns {Object} Result summary
   */
  getResults() {

    let r = {
      stats: this.statsTracker.getResults(),
      combo: this.combo.getMaxi(),
      score: this.score.getScore(),
      chart: this.chart,
      player: this.player,
      rank: Judge.GetRank (this.lifemeter.getTotalPoints(), this.chart)
    };

    return r;

  }

}
export default Engine;

/**
 * Class keeping track of the Score
 * @memberof components
 */
class Score {

  constructor() {
    this.score = 0;
    this.graphicComponent = Theme.GetTheme().createScoreGC();
  }

  /**
   * Increase the score
   * @param {Number} amount | Amount of points to add
   */
  add(amount) {
    this.score += amount;
    this.graphicComponent.update(this.score);
  }

  /**
   * Get the GC Sprite
   * @returns {PIXI.Container} GC Sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }

  /**
   * Get the score
   * @returns {Number} Current Score
   */
  getScore() {
    return this.score;
  }
}

/**
 * Class keeping track of the Combo
 * @memberof components
 */
class Combo {

  constructor() {
    this.combo = 0;
    this.graphicComponent = Theme.GetTheme().createComboGC();
    this.maxi = 0;
  }

  /**
   * Increase the combo
   */
  add() {
    this.combo++;
    this.maxi = this.maxi > this.combo ? this.maxi : this.combo;
    this.graphicComponent.update(this.combo);
  }

  /**
   * Reset the combo
   */
  reset() {
    this.combo = 0;
    this.graphicComponent.update(this.combo);
  }

  /**
   * Get the maximum Combo
   * @returns {Number} Maximum Combo
   */
  getMaxi() {
    return this.maxi;
  }

  /**
   * Get the GC Sprite
   * @returns {PIXI.Container} GC Sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }
}

/**
 * Class keeping track of the player lifr
 * @memberof components
 */
class Lifemeter {

  constructor() {
    this.maximum = 100;
    this.life = 50;
    this.totalPoints = 0;

    this.graphicComponent = Theme.GetTheme().createLifemeterGC();
    this.updateLife(0);
  }

  /**
   * Modify the player life of a certain amount
   * @param {Number} amount | Amount of points to add/remove
   */
  updateLife(amount) {

    this.life += amount;
    this.totalPoints += amount;
    this.life = Math.max(Math.min(this.life, this.maximum), 0);

    this.graphicComponent.update(this.life / this.maximum);
  }

  /**
   * Get the total number of points won by the player
   * @returns {Number} Point count
   */
  getTotalPoints() {
    return this.totalPoints;
  }

  /**
   * Get the GC Sprite
   * @returns {PIXI.Container} GC Sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }
}

/**
 * Class keeping track of the progression in the song
 * @memberof components
 */
class ProgressionBar {
  constructor(songPlayer) {
    this.songDuration = null;
    this.secondPassed = 0;
    this.songPlayer = null;
    this.percentage = 0;
    this.songPlayer = songPlayer;

    this.graphicComponent = Theme.GetTheme().createProgressionBarGC();
  }

  /**
   * Update the current progression
   */
  update() {
    if (!this.songDuration) {
      if (this.songPlayer.source.buffer) {
        this.songDuration = this.songPlayer.source.buffer.duration;
      } else {
        return;
      }
    }

    let time = this.songPlayer.getTime();

    if (time < 0 || time > this.songDuration) {
      return;
    }

    this.secondPassed = time;
    this.percentage = 1 - (this.songDuration - this.secondPassed)/this.songDuration;
    this.graphicComponent.update(this.percentage);
  }

  /**
   * Get the GC Sprite
   * @returns {PIXI.Container} GC Sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }
}

/**
 * Class keeping track on various statistics
 * @memberof components
 */
class StatsTracker {

  constructor() {

    this.timingTracker = new Map();

    // Initialize the Map with the possible timings
    for (let timing of TIMINGS) {
      this.timingTracker.set(timing, 0);
    }

    // Counter for succesfully held notes
    this.held = 0;
  }

  /**
   * Get the results
   * @returns {Object} Result summary
   */
  getResults() {
    return {
      held: this.held,
      timings: this.timingTracker
    };
  }

  /**
   * Process an event
   * @param {Object} ev Event to process
   */
  process(ev) {

    switch (ev.type) {

    case EVENT_NOTE_HIT:
    case EVENT_NOTE_MISS:
      this.timingTracker.set(ev.timing, this.timingTracker.get(ev.timing) + 1);
      break;

    case EVENT_NOTE_FINISH:
      if (ev.timing == S_OK) {
        this.held++;
      }
      break;
    }
  }
}

