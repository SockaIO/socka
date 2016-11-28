/* jshint esnext: true */
"use strict";

import {
  TM_W1,
  TM_W2,
  TM_W3,
  TM_W4,
  TM_W5,
  TM_MISS,
  TM_HOLD,
  TM_MINE,
  TM_ROLL,

} from '../constants'

// Timing Symbols

export default class Judge {

  getMissTiming() {
    return this.timingWindow[TM_W5];
  }

  getHoldTiming() {
    return this.timingWindow[TM_HOLD];
  }

  getRollTiming() {
    return this.timingWindow[TM_ROLL];
  }

  getMineTiming() {
    return this.timingWindow[TM_MINE];
  }

  // We create the judge for a particular song
  constructor () {

    this.timingWindow = {
      [TM_W1]: 0.0225,
      [TM_W2]: 0.045,
      [TM_W3]: 0.090,
      [TM_W4]: 0.135,
      [TM_W5]: 0.180,
      [TM_HOLD]: 0.250,
      [TM_MINE]: 0.090,
      [TM_ROLL]: 0.500
    };

    this.timingScore = {
      [TM_W1]: S_W1,
      [TM_W2]: S_W2,
      [TM_W3]: S_W3,
      [TM_W4]: S_W4,
      [TM_W5]: S_W5,
      [TM_MISS]: S_MISS,
    };

    this.timingPoints = {
      [TM_W1]: 2,
      [TM_W2]: 2,
      [TM_W3]: 1,
      [TM_W4]: 0,
      [TM_W5]: -4,
      [TM_MISS]: -8,
      [TM_MINE]: -8,
      [S_NG]: 0, // miss the end of a hold
      [S_OK]: 6 // catch the end of a hold
    }

    this.gradeScale = {
      [AAA]: 1,
      [AA]: 0.93,
      [A]: 0.8,
      [B]: 0.65,
      [C]: 0.45,
      [D]: 0,
      [E]: -1
    }

    this.multiplier = {
      [TM_W1]: 10,
      [TM_W2]: 10,
      [TM_W3]: 5,
      [TM_W4]: 0,
      [TM_W5]: 0,
      [TM_MISS]: 0
    }

    this.goodTimings = [TM_W1, TM_W2, TM_W3];
  }

  populateSteps(steps, chart) {

    let N = steps.length; // Total number of steps
    let S = N * (N + 1) / 2; // Sum of all integers from 1 to N
    let B = 100000 * chart.meter;

    let index = 1;


    for (let s of steps) {
      s.score =  Math.floor(B / S) * index++;
      s.holdTiming = this.getHoldTiming();
      s.rollTiming = this.getRollTiming();
    }
  }

  getTiming(delay) {

    let timing = TM_MISS;

    if (delay < 0) {
      return timing;
    }

    for (let t of [TM_W1, TM_W2, TM_W3, TM_W4, TM_W5]) {
      if (delay < this.timingWindow[t]) {
        timing = t;
        break;
      }
    }

    return timing;
  }

  judgeNote(note, delay) {
    let timing = this.getTiming(delay);
    let score = this.getNoteScore(note, timing);

    if (note.type === MINE_NOTE) {
      timing = TM_MINE;
    }

    return [timing, score];
  }

  judgeStep(step, delay) {
    let timing = this.getTiming(delay);
    let score = this.getStepScore(step, timing);

    return [timing, score];
  }

  getNoteScore(note, timing) {
    return 0;
  }

  getStepScore(step, timing) {

    let p = this.multiplier[timing];
    return step.score * p;
  }

  isGoodTiming(timing) {
    return this.goodTimings.includes(timing);
  }

  getPoints(note, timing) {
    return this.timingPoints[timing];
  }

}
