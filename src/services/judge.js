'use strict';

/**
 * @namespace services.Judge
 */

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
  S_W1,
  S_W2,
  S_W3,
  S_W4,
  S_W5,
  S_MISS,
  S_NG,
  S_OK,
  AAA,
  AA,
  A,
  B,
  C,
  D,
  E
} from '../constants/judge';

import {MINE_NOTE, TAP_NOTE, HOLD_NOTE} from '../constants/chart';

/**
 * Evaluation of the timing and score when the player tap a note/step
 * @memberof services.Judge
 */
class Judge {

  /**
   * Get the duration associated with a timing
   *
   * @param {Constant} timing | Timing Symbol
   * @returns {Number} Associated duration in seconds
   *
   */
  getTimingValue(timing) {

    if (this.timingWindow[timing] === undefined) {
      throw new Error(`Unable to find value for timing ${timing}`);
    }

    return this.timingWindow[timing];
  }

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
    };

    this.gradeScale = new Map([
      [AAA, 1],
      [AA, 0.93],
      [A, 0.8],
      [B, 0.65],
      [C, 0.45],
      [D, 0],
      [E, -1]
    ]);

    this.multiplier = {
      [TM_W1]: 10,
      [TM_W2]: 10,
      [TM_W3]: 5,
      [TM_W4]: 0,
      [TM_W5]: 0,
      [TM_MISS]: 0
    };

    this.goodTimings = [TM_W1, TM_W2, TM_W3];
  }

  /**
   * Compute timing and score informations for a chart
   *
   * @param {Step|Array} steps | list of steps
   * @param {Chart} chart | Chart for the steps
   */
  populateSteps(steps, chart) {

    let N = steps.length; // Total number of steps
    let S = N * (N + 1) / 2; // Sum of all integers from 1 to N
    let B = 100000 * chart.meter;

    let index = 1;
    let maxPoints = 0;

    for (let s of steps) {

      for (let n of s.notes) {
        if (n.type == TAP_NOTE) {
          maxPoints += 2;

        } else if (n.type == HOLD_NOTE) {
          maxPoints += 6;
        }
      }

      s.score =  Math.floor(B / S) * index++;
      s.holdTiming = this.getTimingValue(TM_HOLD);
      s.rollTiming = this.getTimingValue(TM_ROLL);
    }

    chart.maxPoints = maxPoints;
  }

  /**
   * Get the timing associated with a delay
   *
   * @param {Number} delay | Delay to compute the timing for
   * @returns {Constant} Timing Symbol
   */
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

  /**
   * Get the timing and score for a Note hit
   * 
   * @param {Note} note | Note that was hit
   * @param {Number} delay | Delay between tap and note
   * @return {Constant} Timing Symbol
   * @return {Number} Score
   */
  judgeNote(note, delay) {
    let timing = this.getTiming(delay);
    let score = this.getNoteScore(note, timing);

    if (note.type === MINE_NOTE) {
      timing = TM_MINE;
    }

    return [timing, score];
  }

  /**
   * Get the timing and score for a Step hit
   * 
   * @param {Step} step | Step that was hit
   * @param {Number} delay | Delay between tap and note
   * @return {Constant} Timing Symbol
   * @return {Number} Score
   */
  judgeStep(step, delay) {
    let timing = this.getTiming(delay);
    let score = this.getStepScore(step, timing);

    return [timing, score];
  }

  /**
   * Get the Score for a note hit with timing
   * @param {Note} note | Note hit
   * @param {Constant} timing | Timing Symbol
   * @returns {Number} Score
   */
  getNoteScore(note, timing) {
    return 0;
  }

  /**
   * Get the Score for a step hit with timing
   * @param {Step} step | Step hit
   * @param {Constant} timing | Timing Symbol
   * @returns {Number} Score
   */
  getStepScore(step, timing) {

    let p = this.multiplier[timing];
    return step.score * p;
  }

  /**
   * Return true if a note is considered hit with the given timing
   * @param {Constant} timing | Timing Symbol
   * @return {Bool} Is the timing good
   */
  isGoodTiming(timing) {
    return this.goodTimings.includes(timing);
  }

  /**
   * Get the number of points attributes for a note hit with a givent timing
   * @param {Note} note | Note hit
   * @param {Constant} timing | Timing Symbol
   * @returns {Number} Number of points given
   */
  getPoints(note, timing) {
    return this.timingPoints[timing];
  }

  /**
   * Get the Rank for a Chart
   * @param {Number} points Numbrer of points won
   * @param {Chart} chart Chart played
   * @return {Symbol} Rank
   */
  getRank(points, chart) {

    let percent = points / chart.maxPoints;

    for (let [grade, threshold] of this.gradeScale.entries()) {
      if (percent >= threshold) {
        return grade;
      }
    }

    return E;
  }
}

let judge = new Judge();

let GetTimingValue = judge.getTimingValue.bind(judge);
let PopulateSteps = judge.populateSteps.bind(judge);
let JudgeNote = judge.judgeNote.bind(judge);
let JudgeStep = judge.judgeStep.bind(judge);
let IsGoodTiming = judge.isGoodTiming.bind(judge);
let GetPoints = judge.getPoints.bind(judge);
let GetRank = judge.getRank.bind(judge);

export {
  GetTimingValue,
  PopulateSteps,
  JudgeNote,
  JudgeStep,
  IsGoodTiming,
  GetPoints,
  GetRank
};
