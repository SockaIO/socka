'use strict';

import {RSC_AUDIO} from '../constants/resources';

/**
 * Song Player, plays the audio from a song
 * and allow for retrieval of the current song timestamp
 *
 * @memberof components
 */
class SongPlayer {

  constructor() {
    this.song = null;
    this.ctx = new AudioContext();
    this.source = this.ctx.createBufferSource();
    this.source.connect(this.ctx.destination);

    this.startPauseTime = 0;
  }

  /**
   * Load the audio data from a Song
   * @param {SongIndex} song | SongIndex for the song to load
   */
  load(song) {
    return song.load(RSC_AUDIO)
      .then((data) => {
        return this.ctx.decodeAudioData(data);
      }).then((buf) => {
        this.buf = buf;
        this.source.buffer = buf;
      });
  }

  /**
   * Planify the start of song playback
   */
  play() {
    this.audioStart = this.ctx.currentTime + 1;
    this.source.start(this.audioStart);
  }

  /**
   * Pause the playback of the song
   */
  pause() {
    this.startPauseTime = this.ctx.currentTime - this.audioStart;
    this.source.stop();
  }

  /**
   * Resume the playback of the song
   */
  resume() {
    this.source = this.ctx.createBufferSource();
    this.source.connect(this.ctx.destination);
    this.source.buffer = this.buf;

    const startDelay = 0;
    this.audioStart = this.ctx.currentTime - this.startPauseTime + startDelay;
    this.source.start(this.ctx.currentTime + startDelay, this.startPauseTime);
  }

  /**
   * Returns the current timestamp within the song
   * @return {Number} Timwstamp within the song
   */
  getTime() {
    return this.ctx.currentTime - this.audioStart;
  }

}
export default SongPlayer;
