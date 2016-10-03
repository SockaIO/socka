/* jshint esnext: true */
"use strict";

// Timing Symbols
const TM_W1 = Symbol.for('TM_W1');
const TM_W2 = Symbol.for('TM_W2');
const TM_W3 = Symbol.for('TM_W3');
const TM_W4 = Symbol.for('TM_W4');
const TM_W5 = Symbol.for('TM_W5');
const TM_MISS = Symbol.for('TM_MISS');

const TM_HOLD = Symbol.for('TM_HOLD');
const TM_ROLL = Symbol.for('TM_ROLL');
const TM_MINE = Symbol.for('TM_MINE');

const S_NG = Symbol.for('S_NG');
const S_OK = Symbol.for('S_OK');

// Score Symbols
const S_W1 = Symbol.for('S_W1');
const S_W2 = Symbol.for('S_W2');
const S_W3 = Symbol.for('S_W3');
const S_W4 = Symbol.for('S_W4');
const S_W5 = Symbol.for('S_W5');
const S_MISS = Symbol.for('S_MISS');

// Grade Symbols
const AAA = Symbol.for('AAA');
const AA = Symbol.for('AA');
const A = Symbol.for('A');
const B = Symbol.for('B');
const C = Symbol.for('C');
const D = Symbol.for('D');
const E = Symbol.for('E');



class Judge {

  getMissTiming() {
    return this.timingWindow[TM_W5];
  }

  getHoldTiming() {
    return this.timingWindow[TM_HOLD];
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

    this.precisionPoints = {
      [S_W1]: 2,
      [S_W2]: 2,
      [S_W3]: 1,
      [S_W4]: 0,
      [S_W5]: -4,
      [S_MISS]: -8,
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
  }

  populateSteps(steps, chart) {

    let N = steps.length; // Total number of steps
    let S = N * (N + 1) / 2; // Sum of all integers from 1 to N
    let B = 100000 * chart.meter;

    let index = 1;


    for (let s of steps) {
      s.score =  Math.floor(B / S) * index++;
      s.holdTiming = this.getHoldTiming();
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

  judge(step, delay) {
    let timing = this.getTiming(delay);
    let score = this.getScore(step, timing);

    return [timing, score];
  }

  getScore(step, timing) {

    let p = this.multiplier[timing];

    return step.score * p;
  }


}
