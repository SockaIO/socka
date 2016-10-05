/* jshint esnext: true */
"use strict";

/*
 * Song (with multiple charts)
 */
class Song {
  constructor() {
    
    // Textual informations
    this.metadata = new Map();

    // Required to locate the resources
    this.path = '';

    // External resources
    this.banner = '';
    this.background = '';
    this.cdTitle = '';
    this.music = '';

    // Sample
    this.sampleStart = 0;
    this.sampleLength = 0;

    // TODO: BgChange

    // Charts
    this.charts = []; 

    // Timing
    this.offset = 0;
    this.bpms = [];


    this.timingPartition = [];
  }

  static loadFromSMFolder (url) {
    return Utils.findLinks(url).then((links) => {
      let metadata = {};

      let song;
      for (let link of links) {
        let fullname = decodeURIComponent(link.split("/").slice("-1")[0]);
        let ext = fullname.split(".").slice("-1")[0].toLowerCase();
        let filename = fullname.split(".")[0];

        let isimage = ['png', 'jpeg', 'gif'].includes(ext);

        if (ext in Song.ext_map) {
          song = Song.loadFromFile(link, ext);
        }
        else if (isimage && (filename.includes("banner") || filename.endsWith("bn"))) {
          metadata.banner = fullname;
        }
        else if (isimage && (filename.includes("background") || filename.endsWith("bg"))) {
          metadata.background = fullname;
        }
        else if (isimage && filename.includes("cdtitle")) {
          metadata.cstitle = fullname;
        }
      }

      return Promise.all([song, metadata]);

    }).then((data) => {
      let song = data[0];
      let metadata = data[1];

      if (!song.banner) {
        song.banner = metadata.banner;
      }
      if (!song.background) {
        song.background = metadata.background;
      }

      return song;

    });
  }

  static loadFromFile(url, ext) {
    return fetch(url, {credentials: 'same-origin'}).then((resp) => {

      if (!resp.ok) {
        throw resp;
      }

      return resp.text();

    }).then((data) => {
      if (!ext) {
        ext = url.split(".").slice("-1")[0].toLowerCase();
      }

      let song = Song.ext_map[ext](data);
      song.path = url.slice(0, url.lastIndexOf("/") + 1);
      return song;
    });
  }

  static loadFromDWIFile(data) {
    const fields = getFields(data);
    const fieldMap = new Map();

    while (true) {
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

    const song = new Song();

    // Resources related attributes

    song.cdTitle = fieldMap.get('CDTITLE');
    song.music = fieldMap.get('FILE');

    song.sampleStart = fieldMap.get('SAMPLESTART');
    song.sampleLength = fieldMap.get('SAMPLELENGTH');

    // Timing Data
    song.offset = fieldMap.get('OFFSET');

    song.bpms = getList("0.000=" + fieldMap.get('BPM')).concat(getList(fieldMap.get('CHANGEBPMS') || ''));
    song.stops = getList(fieldMap.get('FREEZE') || '');

    createTimingPartition(song);

    //TODO: Process the notes

    return song;
  }

  static loadFromSMFile (data) {
    const fields = getFields(data);
    const fieldMap = new Map();

    while (true) {
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

    const song = new Song();

    // Resources related attributes

    song.banner = fieldMap.get('BANNER');
    song.background = fieldMap.get('BACKGROUND');
    song.cdTitle = fieldMap.get('CDTITLE');
    song.music = fieldMap.get('MUSIC');

    song.sampleStart = fieldMap.get('SAMPLESTART');
    song.sampleLength = fieldMap.get('SAMPLELENGTH');

    // Timing Data
    song.offset = fieldMap.get('OFFSET');
    song.bpms = getList(fieldMap.get('BPMS'));
    song.stops = getList(fieldMap.get('STOPS'));

    createTimingPartition(song);

    // Process the notes

    let charts = fieldMap.get('NOTES');
    charts = Array.isArray(charts) ? charts : [charts];
    song.charts = getCharts(charts);

    // Remove the used elements and store the metadata
    for (let f of ['BANNER', 'BACKGROUND', 'CDTITLE', 'MUSIC',
               'SAMPLESTART', 'SAMPLELENGTH', 'OFFSET',
               'BPMS', 'STOPS', 'NOTES']) {

      fieldMap.delete(f);
    }

    song.metadata = fieldMap;
    song.populateStepTimes();

    return song;
  }

  /*
   * TODO: Maybe provide a functino to just laod elements for a menu
   */
  populateStepTimes () {

    for (let c of this.charts) {
      let timeIndex = 0;
      for (let s of c.steps) {
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
  }

  getResources() {

    let promises = [];

    // Get the Music
    promises.push(fetch(this.path + this.music, {credentials: 'same-origin'}).then((resp) => {
      if (!resp.ok) {
        throw resp;
      }

      this.audioData = resp.arrayBuffer();
    }));

    promises.push(new Promise((resolve, reject) => {
      // Get the images
      PIXI.loader
          .add(this.path + this.banner)
          .add(this.path + this.background)
          .load(resolve);
    }).then(() => {
      this.bannerTexture = new PIXI.Sprite(
          PIXI.loader.resources[this.path + this.banner].texture
      );
      this.backgroundTexture = new PIXI.Sprite(
          PIXI.loader.resources[this.path + this.background].texture
      );
    }));

    return Promise.all(promises);

  }

  getAudioData() {

    return new Promise((resolve, reject) => {
      if (this.audioData !== undefined) {
        resolve(this.musicBuffer);
      }

      return this.getResources().then(() => {
        resolve(this.audioData);
      });
    });
  }

  /*
   * Helper functions
   * TODO: Is this their place? Are they even used?
   */

  getBeat(time, startIndex=0) {

    let index = startIndex;

    while (index + 1 < this.timingPartition.length && this.timingPartition[index + 1].startTime <= time) {
      index++;
    }

    let timing = this.timingPartition[index];
    let beat = timing.startBeat + timing.bps * (time - timing.startTime);
    
    return [beat, index];

  }

  getTime(beat, startIndex=0) {

    let index = startIndex;

    while (index + 1 < this.timingPartition.length && this.timingPartition[index + 1].startBeat <= beat) {
      index++;
    }

    let timing = this.timingPartition[index];
    let time = timing.startTime + (beat - timing.startBeat) / timing.bps;
    
    return [time, index];

  }
}

Song.ext_map = {
  'sm': Song.loadFromSMFile,
  'dwi': Song.loadFromDWIFile
};

/*
 * List of steps for a given difficulty
 */
class Chart {

  constructor(type, description, difficulty, meter, grooveRadar) {
    this.type = type;
    this.description = description;
    this.difficulty = difficulty;
    this.meter = meter;
    this.grooveRadar = grooveRadar;


    // Notes: list of beats
    this.steps = [];
  }

}

/*
 * Step with timing data
 */
class Step {

  constructor(beat, data, index) {
    this.beat = beat;
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

/*
 * Section of constant BPS
 */
class TimingSection {

  constructor(startBeat, bpm, startTime=0, duration=-1, offset=0) {
    this.startTime = startTime;
    this.duration = duration;
    this.startBeat = startBeat;
    this.bps = bpm / 60;
    this.offset = offset;
  }
}

/*
 * Get the type symbol from the number
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


/*
 * Get the informations about the bps, duration and start time of the different sections
 */
function createTimingPartition(song) {

  // First process the bpms data;
  
  let sections = [];

  song.bpms.sort((a, b) => a < b);

  for (let change of song.bpms) {

    let section = new TimingSection(change.beat, change.value);
    sections.push(section);
  }
  
  song.stops.sort((a, b) => a < b);
  let sectionIndex = 0;


  // Add the stop sections

  for (let stop of song.stops) {
    while (sections.length > sectionIndex + 1 && sections[sectionIndex + 1].startBeat <= stop.beat) {
      sectionIndex++;
    }

    // Split it in two
    let sectionEnd = Object.assign({}, sections[sectionIndex]);
    sectionEnd.startBeat = stop.beat;

    let stopSection = new TimingSection(stop.beat, 0, 0, stop.value);

    // Avoid to add section with 0 duration
    const del = sections[sectionIndex].startBeat === stop.beat ? 1 : 0;
    sections.splice(sectionIndex + (1 - del), del, stopSection, sectionEnd);
  }

  // TODO Add the warping
  

  //
  // Compute the timing
  //

  for (let i = 0; i < sections.length; i++) {

    let section = sections[i];

    if (i === 0) {
      section.startTime = -1 * parseFloat(song.offset);
      continue;
    }

    let prevSection = sections[i - 1];

    if (prevSection.duration === -1) {
      prevSection.duration = (section.startBeat - prevSection.startBeat) / prevSection.bps;
    }

    section.startTime = prevSection.startTime + prevSection.duration;

  }

  song.timingPartition = sections;

}

/*
 * Extract the fields from the SM file
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


/*
 * Remove character at the beginning and end of a string
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

/*
 * Get the information organized as lsit in the SM file
 */
function getList(data) {

  if (!data.includes('=')) {
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


/*
 * Get the charts from the data
 */
function getCharts(data) {

  let charts = [];

  for (let c of data) {
    charts.push(getChart(c));
  }

  return charts;
}

/*
 * Get the steps and notes info from the data
 */
function getChart(data) {

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

  // Parsing the Steps
  let measures = [];
  value = '';
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

  // Create the Chart object
  const chart = new Chart(...metadata);

  let beat = 0;
  let stepData = [];
  let prevStep = null;
  let stepIndex = 1;

  //TODO: Remove the info that are gathered and not used to create the new gameplay objects

  for (let m of measures) {
    let tempo = 4 / m.length;
    let maxType = m.length / 4;

    let division = 0;

    for (let s of m) {

      // TODO Support more tracks
      if (s !== '0000') {

        let newStep = new Step(beat, s, stepIndex++);
        newStep.division = division;

        if (prevStep !== null) {
          prevStep.nextBeat = beat - prevStep.beat;
          newStep.prevBeat = beat - prevStep.beat;
        }
        
        stepData.push(newStep);
        prevStep = newStep;
      }

      division = (division + 1) % maxType;
      beat += tempo;
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

      if (s.data[d] == '3') {
        startStep[d].arrows[d].duration = s.beat - startStep[d].beat;
      }
    }
  }

  chart.steps = stepData;

  return chart;

}
