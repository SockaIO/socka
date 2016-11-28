/* jshint esnext: true */
"use strict";

class SongPlayer {

  constructor() {
    this.song = null;
    this.ctx = new AudioContext();
    this.source = this.ctx.createBufferSource();
    this.source.connect(this.ctx.destination);
  }

  load(song) {
    return song.getAudioData()
      .then((data) => {
          return this.ctx.decodeAudioData(data);
      }).then((buf) => {
        this.source.buffer = buf;
      });
  }

  play() {
    this.audioStart = this.ctx.currentTime + 1;
    this.source.start(this.audioStart);
  }

  getTime() {
    return this.ctx.currentTime - this.audioStart;
  }

}
