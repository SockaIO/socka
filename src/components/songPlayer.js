'use strict';

import {RSC_AUDIO} from '../constants/resources';

/**
 * Song Player, plays the audio from a song
 * and allow for retrieval of the current song timestamp
 *
 * @memberof components
 */
class SongPlayer {

  constructor(volume=100) {
    this.song = null;
    this.volume = volume / 100;

    this.initAudio();

    this.startPauseTime = 0;

    this.endPromise = new Promise((resolve, reject) => {
      this.endPlayback = resolve;
      this.cancelPlayback = reject;
    });
  }

  /**
   * Init the Audio API
   */
  initAudio() {
    this.ctx = new AudioContext();
    this.gain = this.ctx.createGain();
    this.source = this.ctx.createBufferSource();

    this.gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    this.source.connect(this.gain);
    this.gain.connect(this.ctx.destination);
  }

  /**
   * Set the Volume
   * @param {Number} volume New Volume (int between 0 and 100)
   */
  setVolume(volume) {
    if (this.gain === undefined) {
      return;
    }

    this.volume = volume / 100;
    this.gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
  }

  /**
   * Load the audio data from a Song
   * @param {SongIndex} song | SongIndex for the song to load
   */
  load(song) {
    this.song = song;

    return song.load(RSC_AUDIO)
      .then((data) => {
        return this.ctx.decodeAudioData(data);
      }).then((buf) => {
        this.buf = buf;
        this.source.buffer = buf;
      });
  }

  /**
   * Reset the player to the beginning of the song;
   */
  reset() {
    this.initAudio();
    return this.load(this.song);
  }

  /**
   * Planify the start of song playback
   */
  play() {
    this.audioStart = this.ctx.currentTime + 1;
    this.source.start(this.audioStart);
    this.source.onended = () => this.endPlayback();
  }

  /**
   * Pause the playback of the song
   */
  pause() {
    this.startPauseTime = this.ctx.currentTime - this.audioStart;
    this.startPauseTime = Math.max(this.startPauseTime, 0);

    this.source.onended = () => {};
    this.source.stop();
  }

  /**
   * Resume the playback of the song
   */
  resume() {
    this.source = this.ctx.createBufferSource();
    this.source.connect(this.gain);
    this.source.buffer = this.buf;

    const startDelay = 0;
    this.audioStart = this.ctx.currentTime - this.startPauseTime + startDelay;

    this.source.start(this.ctx.currentTime + startDelay, this.startPauseTime);
    this.source.onended = () => this.endPlayback();
  }

  /**
   * Close the song
   */
  close() {
    this.ctx.close();
  }

  /**
   * Get the End Promise
   * @returns {Promise} Promise resolved when playback finished or cancelled
   */
  getEndPromise() {
    return this.endPromise;
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
