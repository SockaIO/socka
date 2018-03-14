'use strict';

/**
 * @namespace services.SongParser
 */

import { TAP_NOTE, HOLD_NOTE, ROLL_NOTE, MINE_NOTE, LIFT_NOTE, FAKE_NOTE, TIMING_STOP, TIMING_DELAY} from '../constants/chart';

/*
 * Song Interface
 * @memberof services.SongParser
 *
 */
export class Song {
  /**
   * Get one chart
   * @param {Number} chartId ID of the chart to retrieve
   */
  getChart(chartId) {
    let chart = this.charts[chartId];

    chart.parseSteps();
    chart.populateStepTimes();

    return chart;
  }
}



/**
 * Create a song from a file
 * @param {String} data Song Data
 * @param {String} extension Song Extension (to detect format)
 */
Song.CreateSong = function (data, extension) {

  let constructor = Song.extMap[extension];

  if (constructor === undefined) {
    throw new Error(`Format not supported: ${extension}`);
  }

  return new constructor(data);
};

/*
 * SM Song
 * @memberof services.SongParser
 *
 */

class SongSM extends Song {

  constructor(data) {
    super();

    const fields = getFields(data);
    const fieldMap = new Map();

    for (;;) {
      let v = fields.next().value;

      if (v === undefined) {
        break;
      }

      if (!fieldMap.has(v.tag)) {
        fieldMap.set(v.tag, v.value);
      } else {
        let actual = fieldMap.get(v.tag);
        let tmp = Array.isArray(actual) ? actual : [actual];
        tmp.push(v.value);
        fieldMap.set(v.tag, tmp);
      }
    }

    // We process the fields that are mandatory
    // The rest will just be passed as metadata

    // Resources related attributes

    this.banner = fieldMap.get('BANNER');
    this.background = fieldMap.get('BACKGROUND');
    this.cdTitle = fieldMap.get('CDTITLE');
    this.music = fieldMap.get('MUSIC');

    this.sampleStart = fieldMap.get('SAMPLESTART');
    this.sampleLength = fieldMap.get('SAMPLELENGTH');

    // Timing Data
    this.offset = fieldMap.get('OFFSET');
    this.bpms = getList(fieldMap.get('BPMS'));
    this.stops = getList(fieldMap.get('STOPS'));

    this.timingPartition = createTimingPartition2(parseFloat(this.offset), this.bpms, this.stops, this.delays, this.warps);

    // Read the chart metadata

    const notes = fieldMap.get('NOTES');
    this.chartData = Array.isArray(notes) ? notes : [notes];
    this.loadCharts(false);

    // Remove the used elements and store the metadata
    for (let f of ['BANNER', 'BACKGROUND', 'CDTITLE', 'MUSIC',
      'SAMPLESTART', 'SAMPLELENGTH', 'OFFSET',
      'BPMS', 'STOPS', 'NOTES']) {

      fieldMap.delete(f);
    }

    this.metadata = fieldMap;
  }

  loadCharts(parseSteps=false) {
    this.charts = [];

    for (let c of this.chartData) {
      this.charts.push(this.loadChart(c, parseSteps));
    }
  }

  loadChart(data, parseSteps=false) {
    // Parse the metadata

    let value = '';
    let metadata = [];
    let count = 0;
    let position = 0;

    for (let c of data) {
      position++;
      if (c === ' ' || c === '\n' || c ==='\r') {
        continue;
      }

      if (c === ':') {
        metadata.push(value);
        value = '';
        if (++count === 5) {
          break;
        }
        continue;
      }

      value += c;
    }

    metadata[4] = metadata[4].split(',');

    // Remove the parsed data
    data = data.slice(position);

    // Create the Chart object
    const chart = new Chart(...metadata, parseNotes, data);
    chart.setTimingPartition(this.timingPartition);

    if (parseSteps === true) {
      chart.parseSteps();
    }

    return chart;
  }
}

/*
 * SSC Song
 * @memberof services.SongParser
 *
 */

class SongSSC extends Song {

  constructor(data) {
    super();

    const fields = getFields(data);

    // Map for global fiels
    const fieldMap = new Map();

    // Stack of chart attributes
    const chartData = [];

    const ChartAttributes = [
      'NOTEDATA',
      'CHARTNAME',
      'STEPSTYPE',
      'CHARTSTYLE',
      'DIFFICULTY',
      'METER',
      'RADARVALUES',
      'NOTES'
    ];

    let GLOBAL = Symbol.for('GLOBAL');
    let CHART = Symbol.for('CHART');

    let mode = GLOBAL;

    for (;;) {
      let v = fields.next().value;

      if (v === undefined) {
        break;
      }

      if (mode === GLOBAL && ChartAttributes.includes(v.tag)) {
        mode = CHART;
      }

      if (mode === GLOBAL) {
        if (!fieldMap.has(v.tag)) {
          fieldMap.set(v.tag, v.value);
        } else {
          let actual = fieldMap.get(v.tag);
          let tmp = Array.isArray(actual) ? actual : [actual];
          tmp.push(v.value);
          fieldMap.set(v.tag, tmp);
        }
      } else if (mode === CHART) {
        chartData.push(v);
      }
    }

    // We process the fields that are mandatory
    // The rest will just be passed as metadata

    // Resources related attributes

    this.banner = fieldMap.get('BANNER');
    this.background = fieldMap.get('BACKGROUND');
    this.cdTitle = fieldMap.get('CDTITLE');
    this.music = fieldMap.get('MUSIC');

    this.sampleStart = fieldMap.get('SAMPLESTART');
    this.sampleLength = fieldMap.get('SAMPLELENGTH');

    // Timing Data
    this.offset = fieldMap.get('OFFSET');
    this.bpms = getList(fieldMap.get('BPMS'));
    this.stops = getList(fieldMap.get('STOPS'));
    this.delays = getList(fieldMap.get('DELAYS'));
    this.warps = getList(fieldMap.get('WARPS'));

    // Fake segments
    this.fakes = getList(fieldMap.get('FAKES'));

    // Not handled SCC Attributes
    // TIMESIGNATURES
    // TICKCOUNTS
    // COMBOS
    // SPEEDS
    // SCROLLS
    // LABELS

    // Process the charts
    this.chartData = chartData;
    this.loadCharts(false);

    // Remove the used elements and store the metadata
    for (let f of ['BANNER', 'BACKGROUND', 'CDTITLE', 'MUSIC',
      'SAMPLESTART', 'SAMPLELENGTH', 'OFFSET',
      'BPMS', 'STOPS', 'NOTES']) {

      fieldMap.delete(f);
    }

    this.metadata = fieldMap;
  }

  loadCharts(parseSteps=false) {

    this.charts = [];

    let timingInfo = {
      offset: this.offset,
      bpms: this.bpms,
      stops: this.stops,
      delays: this.delays,
      warps: this.warps
    };

    let chartInfo = {};

    for (let {tag, value} of this.chartData) {
      switch(tag) {
      case 'STEPSTYPE':
        chartInfo.type = value;
        break;
      case 'DESCRIPTION':
        chartInfo.description = value;
        break;
      case 'DIFFICULTY':
        chartInfo.difficulty = value;
        break;
      case 'RADARVALUES':
        chartInfo.radar = value;
        break;
      case 'METER':
        chartInfo.meter = value;
        break;
      case 'OFFSET':
        timingInfo.offset = value;
        break;
      case 'BPMS':
        timingInfo.bpms = getList(value);
        break;
      case 'STOPS':
        timingInfo.stops = getList(value);
        break;
      case 'DELAYS':
        timingInfo.delays = getList(value);
        break;
      case 'WARPS':
        timingInfo.warps = getList(value);
        break;
      case 'NOTES': {
        chartInfo.stepData = value;

        // This is the last field
        // Create the chart

        const chart = new ChartSSC(
          chartInfo.type,
          chartInfo.description,
          chartInfo.difficulty,
          chartInfo.meter,
          chartInfo.radar,
          parseNotes,
          chartInfo.stepData,
          timingInfo);

        if (parseSteps === true) {
          chart.parseSteps();
        }

        this.charts.push(chart);

        // Reset the state for next chart
        timingInfo = {
          offset: this.offset,
          bpms: this.bpms,
          stops: this.stops,
          delays: this.delays,
          warps: this.warps
        };

        chartInfo = {};

        break;
      }
      }
    }
  }
}

/*
 * DWI Song
 * @memberof services.SongParser
 *
 */

class SongDWI extends Song {

  constructor(data) {
    super();

    const fields = getFields(data);
    const fieldMap = new Map();

    for (;;) {
      let v = fields.next().value;

      if (v === undefined) {
        break;
      }

      if (!fieldMap.has(v.tag)) {
        fieldMap.set(v.tag, v.value);
      } else {
        let actual = fieldMap.get(v.tag);
        let tmp = Array.isArray(actual) ? actual : [actual];
        tmp.push(v.value);
        fieldMap.set(v.tag, tmp);
      }
    }

    // We process the fields that are mandatory
    // The rest will just be passed as metadata

    // Resources related attributes

    this.cdTitle = fieldMap.get('CDTITLE');
    this.music = fieldMap.get('FILE');

    this.sampleStart = fieldMap.get('SAMPLESTART');
    this.sampleLength = fieldMap.get('SAMPLELENGTH');

    // Timing Data
    this.offset = -fieldMap.get('GAP')/1000;

    this.bpms = getList('0.000=' + fieldMap.get('BPM')).concat(getList(fieldMap.get('CHANGEBPMS') || ''));
    this.stops = getList(fieldMap.get('FREEZE') || []);

    this.timingPartition = createTimingPartition2(parseFloat(this.offset), this.bpms, this.stops, this.delays, this.warps);

    //TODO: Process the notes
    this.charts = [];

    for (let chartType of ['SINGLE', 'DOUBLE', 'COUPLE', 'SOLO']) {
      let rawCharts = fieldMap.get(chartType);
      if (!rawCharts) {
        continue;
      }

      rawCharts = Array.isArray(rawCharts) ? rawCharts : [rawCharts];

      for (let rawChart of rawCharts) {
        let difficulty, meter, steps;
        [difficulty, meter, steps] = rawChart.split(':');

        let chart = new Chart(chartType, undefined, difficulty, meter, undefined, computeDWISteps, steps);
        chart.setTimingPartition(this.timingPartition);
        this.charts.push(chart);
      }
    }

    // Remove the used elements and store the metadata
    for (let f of ['CDTITLE', 'FILE', 'SAMPLESTART', 'SAMPLELENGTH',
      'GAP', 'BPM', 'CHANGEBPMS', 'FREEZE',
      'SINGLE', 'DOUBLE', 'COUPLE', 'SOLO']) {

      fieldMap.delete(f);
    }
    this.metadata = fieldMap;
  }

}

Song.extMap = {
  'sm': SongSM,
  'ssc': SongSSC,
  'dwi': SongDWI
};

/**
 * List of steps for a given difficulty
 * @memberof services.SongParser
 */
class Chart {

  constructor(type, description, difficulty, meter, grooveRadar, stepParser, stepData='') {
    this.type = type;
    this.description = description;
    this.difficulty = difficulty;
    this.meter = meter;
    this.grooveRadar = grooveRadar;

    this.stepParser = stepParser;
    this.stepData = stepData;

    // Notes: list of beats
    this.steps = [];
  }

  parseSteps(data=null) {
    if (data === null) {
      data = this.stepData;
    }

    this.steps = this.stepParser(data);
  }

  setTimingPartition(timingPartition) {
    this.timingPartition = timingPartition;
  }

  /**
   * Populate the Times for the steps of the charts
   */
  populateStepTimes () {

    let timeIndex = 0;
    for (let s of this.steps) {
      [s.time, timeIndex] = this.getTime(s.beat, timeIndex);

      // We need to get the duration in seconds as well
      for (let direction in s.arrows) {
        let a = s.arrows[direction];
        if (a.duration > 0) {
          let [endTime, ] = this.getTime(s.beat + a.duration, timeIndex);
          s.arrows[direction].durationS = endTime - s.time;
        }
      }
    }
  }

  /**
   * Get the beat corresponding to a given time
   * @param {Number} time | time to covnert to beat
   * @param {Number} startIndex | index to start looking from
   * @returns {Number} Beat
   * @returns {Number} index of the timing partition
   */
  getBeat(time, startIndex=0) {

    let index = startIndex;

    while (index + 1 < this.timingPartition.length && this.timingPartition[index + 1].startTime <= time) {
      index++;
    }

    let timing = this.timingPartition[index];
    let localTime = time - timing.startTime;

    if (timing.offset > 0) {
      localTime = Math.max(0, localTime - timing.offset);
    }

    let beat = timing.startBeat + timing.bps * localTime;

    return [beat, index];

  }

  /**
   * Get the time corresponding to a given beat
   * @param {Number} beat | beat to covnert to time
   * @param {Number} startIndex | index to start looking from
   * @returns {Number} Time
   * @returns {Number} index of the timing partition
   */
  getTime(beat, startIndex=0) {

    let index = startIndex;

    while (index + 1 < this.timingPartition.length && this.timingPartition[index + 1].startBeat <= beat) {
      index++;
    }

    let timing = this.timingPartition[index];
    let time = timing.startTime + timing.offset + (beat - timing.startBeat) / timing.bps;

    if (timing.offsetType === TIMING_STOP && beat === timing.startBeat) {
      time -= timing.offset;
    }

    return [time, index];

  }
}

class ChartSSC extends Chart {

  constructor(type, description, difficulty, meter, grooveRadar, stepParser, stepData='', timingInfo) {
    // Normal Chart Data
    super(type, description, difficulty, meter, grooveRadar, stepParser, stepData);

    // Create the Timing Partition for this Chart
    this.timingPartition = createTimingPartition2(parseFloat(timingInfo.offset),
                                                  timingInfo.bpms,
                                                  timingInfo.stops,
                                                  timingInfo.delays,
                                                  timingInfo.warps);
  }
}

/**
 * Step with timing data
 * @memberof services.SongParser
 */
class Step {

  constructor(beat, data, index, division) {
    this.beat = beat;
    this.division = division;
    this.data = data;

    this.nextBeat = 0;
    this.prevBeat = 0;

    this.arrows = {};

    this.index = index;

    for (let x = 0; x < data.length; x++) {
      if (data[x] !== '0' && data[x] !== '3') {

        // TODO: Remove element that were specific to the old gameplay
        let arrow = {
          step: this,
          type: getTypeSymbol(data[x]),
          duration: 0,
        };

        this.arrows[x] = arrow;
      }
    }
  }
}

/**
 * Section of constant BPS
 * @memberof services.SongParser
 */
class TimingSection {

  constructor(startBeat, bpm, startTime=0, duration=null, offset=0, offsetType=null) {
    this.startTime = startTime;
    this.duration = duration;
    this.startBeat = startBeat;
    this.bps = bpm / 60;
    this.offset = offset;
    this.offsetType = offsetType;
  }
}

/**
 * Get the type symbol from the number
 * @memberof services.SongParser
 */
function getTypeSymbol(x) {
  const s = getTypeSymbol.map[x];

  if (s === undefined) {
    //console.log('Undefined Note Type', x);
    return TAP_NOTE;
  }

  return s;

}

getTypeSymbol.map = {
  '1': TAP_NOTE,
  '2': HOLD_NOTE,
  '4': ROLL_NOTE,
  'M': MINE_NOTE,
  'L': LIFT_NOTE,
  'F': FAKE_NOTE
};


/**
 * Get the informations about the bps, duration and start time of the different sections
 *
 * @memberof services.SongParser
 */
function createTimingPartition2(startOffset=0, bpms=[], stops=[], delays=[], warps=[]) {

  let sections = [];

  //
  // 1. Create a list of timing sections populating startbeat and BPM
  // We just take each bpm entry and create a section for it
  //

  bpms.sort((a, b) => a.beat -b.beat);

  for (let change of bpms) {
    let section = new TimingSection(change.beat, change.value);
    sections.push(section);
  }

  //
  // 2. Add the stop sections
  // We look for the section containing the stop, split it in 2
  // and add a delay to the second section
  //

  // Stops
  addPauses(sections, stops, TIMING_STOP);

  // Delays
  addPauses(sections, delays, TIMING_DELAY);

  //
  // 3. Add the Warps
  // We set to 0 the duration of the timing segments in the warp
  //
  addWarps(sections, warps);

  //
  // 4. Compute the timing
  // Fill the following TimingSegments info
  // - duration
  // - startTime
  //

  for (let i = 0; i < sections.length; i++) {

    let section = sections[i];

    if (i === 0) {
      section.startTime = -1 * startOffset;
      continue;
    }

    let prevSection = sections[i - 1];

    if (prevSection.duration === null) {
      prevSection.duration = (section.startBeat - prevSection.startBeat) / prevSection.bps;

      // Add the offset if there is a pause
      if (prevSection.offset > 0) {
        prevSection.duration += prevSection.offset;
      }
    }

    section.startTime = prevSection.startTime + prevSection.duration;

  }

  return sections;
}

/**
 * Add a pause (either STOP or DELAY)
 * @param {TimingSection|Array} sections Timing Sections of the song
 * @param {object|Array} pauses Array of pauses (beat + duration)
 * @param {enum} type Type of Pause
 */
function addPauses(sections, pauses, type) {

  let sectionIndex = 0;

  pauses.sort((a, b) => a.beat - b.beat);

  for (let pause of pauses) {
    // Search the segment directly after the pause
    while (sections.length > sectionIndex + 1 && sections[sectionIndex + 1].startBeat <= pause.beat) {
      sectionIndex++;
    }

    // Split it in two
    let sectionEnd = Object.assign({}, sections[sectionIndex]);
    sectionEnd.startBeat = pause.beat;

    // Set the offset for the end section
    sectionEnd.offset = pause.value;
    sectionEnd.offsetType = type;

    // Avoid to add section with 0 duration
    // Would happen if a pause was starting at the same time as a bpm section
    const del = sections[sectionIndex].startBeat === pause.beat ? 1 : 0;
    sections.splice(sectionIndex + (1 - del), del, sectionEnd);
  }
}

/**
 * Add the warps
 * @param {TimingSection|Array} sections Timing Sections of the song
 * @param {object|Array} warps Array of warps (beat + duration)
 */
function addWarps(sections, warps) {

  warps.sort((a, b) => a.beat - b.beat);
  let sectionIndex = 0;

  for (let warp of warps) {
    // Search the segment directly after the warp
    while (sections.length > sectionIndex + 1 && sections[sectionIndex + 1].startBeat <= warp.beat) {
      sectionIndex++;
    }

    // Split it in two
    let sectionEnd = Object.assign({}, sections[sectionIndex]);
    sectionEnd.startBeat = warp.beat;

    // Avoid to add section with 0 duration
    // Would happen if a pause was starting at the same time as a bpm section
    let del = sections[sectionIndex].startBeat === warp.beat ? 1 : 0;
    sections.splice(sectionIndex + (1 - del), del, sectionEnd);

    // We go to the first warped segment
    sectionIndex = sectionIndex + (1 - del);
    const warpEnd = warp.beat + warp.value;

    // Search the segment directly after the warp
    while (sections.length > sectionIndex + 1 && sections[sectionIndex + 1].startBeat <= warpEnd) {
      sections[sectionIndex].duration = 0;
      sectionIndex++;
    }

    // Split it in two
    let sectionEnd2 = Object.assign({}, sections[sectionIndex]);
    sectionEnd2.startBeat = warpEnd;

    // Set duration of the first segment to 0
    sections[sectionIndex].duration = 0;

    // Avoid to add section with 0 duration
    // Would happen if a pause was starting at the same time as a bpm section
    del = sections[sectionIndex].startBeat === warpEnd ? 1 : 0;
    sections.splice(sectionIndex + (1 - del), del, sectionEnd2);
  }

}

/**
 * Extract the fields from the SM file
 * @param {String} data | Text data to extract the field from
 * @memberof services.SongParser
 */
function * getFields(data) {

  // TODO: Use symbols
  let state = 0;
  let tag = '';
  let value = '';
  let lastChar = '';
  let lastState = 0;

  for (let c of data) {

    if (lastChar == '/' && c == '/') {
      lastState = state;
      state = 3;

      if (lastState === 1) {
        tag = tag.slice(0, -1);
      }

      if (lastState === 2) {
        value = value.slice(0, -1);
      }

      continue;
    }
    switch (state) {
    // Looking for the field name
    case 0:
      if (c === '\n' || c === '\r') {
        continue;
      }
      if (c !== '#') {
        continue;
      }
      state++;
      break;

    // Looking for the field value
    case 1:
      if (c === '\n' || c === '\r') {
        continue;
      }
      if (c == ':') {
        state++;
        continue;
      }
      tag += c;
      break;

    // Filling the field value
    case 2:
      if (tag !== 'NOTES' && (c === '\n' || c === '\r')) {
        continue;
      }
      if (c === ';') {
        state = 0;
        yield {tag, value};
        tag = '';
        value = '';
        continue;
      }
      value += c;
      break;
    case 3:
      if (c === '\n') {
        state = lastState;
        continue;
      }
    }
    lastChar = c;
  }
}


/**
 * Remove character at the beginning and end of a string
 * @param {String} string | string to trim
 * @param {String} character | Character to trim (default is space)
 * @returns {String} trimmed string
 * @memberof services.SongParser
 */
function trim(string, character=' ') {

  let startIndex = 0;
  let stopIndex = string.length;

  while (string[startIndex] == character && startIndex < stopIndex) {
    startIndex++;
  }

  while (string[stopIndex - 1] == character && stopIndex > startIndex) {
    stopIndex--;
  }

  return string.slice(startIndex, stopIndex);
}

/**
 * Get the information organized as list in the SM file
 * @param {String} data | Text data to get the info from
 * @returns {String|Array} List of information
 * @memberof services.SongParser
 */
function getList(data) {

  if (data === undefined || !data.includes('=')) {
    return [];
  }

  let values = [];
  data = data.split('\n').join('');
  data = data.split('\r').join('');
  let changes = data.split(',');

  for (let c of changes) {
    let info = c.split('=');
    values.push({
      beat: parseFloat(trim(info[0])),
      value: parseFloat(trim(info[1]))
    });
  }

  return values;
}

/**
 * Iterate of the steps of DWI type data
 * @param {String} data | Text data to get the info from
 * @return {Object} Step
 * @memberof services.SongParser
 */
function * iterDWISteps(data) {
  const grouping = {'<': '>'};
  const speed = {'(': 1/4, '[': 1/8, '{': 1/16, '`': 1/32};
  const decreaseSpeed = [')', ']', '}', '\''];

  let tempoStack = [1/2];
  let beat = 0;
  let subbeat = 0;
  let idx = -1;
  let step = '';

  let groupNote = null;

  for (let c of data) {
    idx++;
    step += c;

    // Handle note group (eg. (572))
    if (c in grouping) {
      groupNote = c;
      continue;
    }

    if (groupNote !== null) {
      if (c !== grouping[groupNote]) {
        continue;
      } else {
        groupNote = null;
      }
    }

    // Handle long note (eg. 8!8)
    if (data[idx+1] === '!' || c === '!') {
      continue;
    }

    // Handle tempo change
    if (step in speed) {
      tempoStack.push(speed[step]);
      step = '';
      continue;
    }
    if (decreaseSpeed.includes(step)) {
      tempoStack.pop();
      step = '';
      continue;
    }

    // Ignore none beat
    if (step !== '0') {
      yield {'step': step, 'beat': beat, 'subbeat': subbeat};
    }

    let tempo = tempoStack.slice(-1)[0];
    beat += tempo;
    subbeat += tempo*48;
    step = '';
  }
}

/**
 * Combine 0011 + 0030 in 0031
 * @param {Object|Array} steps | Steps to Combine
 * @returns {Object} Combined step
 * @memberof services.SongParser
 */
function _combine_step (steps) {
  let newStep = steps[0];

  for (let step of steps) {
    let idx = 0;
    for (let note of step) {
      if (note !== '0') {
        newStep = newStep.substr(0, idx) + note + newStep.substr(idx+1, newStep.length);
      }
      idx++;
    }
  }
  return newStep;
}

/**
 * Convert DWI Step to SM Step
 * @param {Object} step | DWI Step
 * @param {String} default_note | Default SM note type to use
 * @returns {Object} SM Step
 * @memberof services.SongParser
 */
function DWIToSMStep(step, default_note='1') {
  if (step.length === 1 && step in DWIToSMStep.map) {
    return DWIToSMStep.map[step].split('1').join(default_note);
  }

  if (step.includes('!')) {
    let [long_note, note] = step.split('!');
    return _combine_step([DWIToSMStep(long_note), DWIToSMStep(note, 2)]);
  }

  if (step.startsWith('<') && step.endsWith('>')) {
    return _combine_step(step.slice(1, -1).split('').map(function(obj) {
      return DWIToSMStep(obj);
    }));
  }

  return step;
}

DWIToSMStep.map = {
  '1': '1100',
  '2': '0100',
  '3': '0101',
  '4': '1000',
  '6': '0001',
  '7': '1100',
  '8': '0100',
  '9': '0101',
  'A': '0110',
  'B': '1001',
};

/**
 * Extract the DWI Steps from the text Data
 * @param {String} data | Text Data
 * @returns {Object|Array} Array of steps
 * @memberof services.SongParser
 */
function computeDWISteps(data) {
  let stepData = [];
  let prevStep = null;
  let stepIndex = 1;

  let startStep = {
    '0': 0,
    '1': 0,
    '2': 0,
    '3': 0
  };

  for (let note of iterDWISteps(data)) {
    let data = DWIToSMStep(note.step);

    // in DWI a tap note mark the end of a hold
    let tmp = '';
    for (let d in data) {
      if (data[d] === '1' && startStep[d] !== 0) {
        tmp += '3';
      } else {
        tmp += data[d];
      }
    }
    data = tmp;

    let division = getDivision (note.subbeat);

    let newStep = new Step(note.beat, data, stepIndex++, division);

    if (prevStep !== null) {
      prevStep.nextBeat = note.beat - prevStep.beat;
      newStep.prevBeat = note.beat - prevStep.beat;
    }

    // Compute helpers for the hold and roll
    for (let d in data) {
      if (data[d] === '2') {
        startStep[d] = newStep;
      }

      if (data[d] === '3' && startStep[d] !== 0) {
        startStep[d].arrows[d].duration = newStep.beat - startStep[d].beat;
        startStep[d] = 0;
      }
    }

    stepData.push(newStep);
    prevStep = newStep;
  }

  return stepData;
}

/**
 * Parse the Notes Data
 * @param {String} notes Notes Data
 * @return {Step|Array} Song Steps
 */
function parseNotes(data) {

  // Parsing the Steps
  let measures = [];
  let value = '';
  let steps = [];


  // Add to parse correctly the last measure
  data += ',';

  for (let c of data) {
    if (c === ' ' || c ==='\r') {
      continue;
    }

    if (c === '\n') {
      if (value !== '') {
        steps.push(value);
        value = '';
      }
      continue;
    }

    if (c === ',') {
      measures.push(steps);
      steps = [];
      continue;
    }

    value += c;
  }


  let beat = 0;
  let stepData = [];
  let prevStep = null;
  let stepIndex = 1;

  //TODO: Remove the info that are gathered and not used to create the new gameplay objects

  for (let m of measures) {
    let tempo = 4 / m.length;

    let increment = 192 / m.length;

    // Decimal part of the beat express as 192th of beat
    // Allow to compute the division in an integer fashion
    let subBeat = 0;

    for (let s of m) {

      // TODO Support more tracks
      if (s !== '0000') {

        let division = getDivision (subBeat);
        let newStep = new Step(beat, s, stepIndex++, division);

        if (prevStep !== null) {
          prevStep.nextBeat = beat - prevStep.beat;
          newStep.prevBeat = beat - prevStep.beat;
        }

        stepData.push(newStep);
        prevStep = newStep;
      }

      beat += tempo;
      subBeat += increment;
    }
  }

  // Compute helpers for the hold and roll
  // TODO: handle more tracks
  let startStep = {
    left: 0,
    down: 0,
    up: 0,
    right: 0
  };

  for (let s of stepData) {

    for (let d in s.data) {
      if (s.data[d] === '2' || s.data[d] === '4') {
        startStep[d] = s;
      }

      if (s.data[d] == '3' && startStep[d] !== undefined) {
        startStep[d].arrows[d].duration = s.beat - startStep[d].beat;
      }
    }
  }

  return stepData;
}

const divs = [(192 / 4), (192 / 8), (192 / 12), (192 / 16), (192 / 24), (192 / 32), (192 / 48)];

function getDivision (subBeat) {

  let x = 0;

  for (x = 0; x < divs.length; ++x) {
    if (subBeat % divs[x] === 0) {
      break;
    }
  }

  return x;
}
