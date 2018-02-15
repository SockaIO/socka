'use strict';

import View from './view';
import {SongPlayer, Engine} from '../components';
import {Theme} from '../services';
import LoadingView from './loadingView';
import PauseView from './pauseView';
import ResultsView from './resultsView';

import {KEY_UP, KEY_LEFT, KEY_DOWN, KEY_RIGHT, TAP, LIFT, KEY_BACK} from '../constants/input';

import {RSC_BACKGROUND} from '../constants/resources';

import log from 'loglevel';

/**
 * View Class for the gameplay.
 * Can contain one or more engines
 *
 * @extends View
 * @memberof views
 */
class EngineView extends View {

  /**
   * Create an engine view
   * @param {number} width - view width
   * @param {number} height - view height
   * @param {SongIndex} song - SonIndex of the song to load
   * @param {Map[PlayerId]Number} difficulty - Index of the chart to use for each player
   * @param {Player|Iterable} players - Players
   *
   */
  constructor(song, difficulty, players, game) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    this.songPlayer = new SongPlayer();
    this.graphicComponent = Theme.GetTheme().createEngineViewGC(width, height);

    this.engines = [];
    this.started = false;

    this.song = song;

    // Create the loading View
    this.loading = new LoadingView(width, height, game);

    const engineWidth = 0.9 * (width / 2);
    const engineHeight = height;
    const offset = width/2  - engineWidth;
    let difficulties = [];

    let i = 0;
    for (let player of players) {
      let e = new Engine(engineWidth, engineHeight, Number(player.optionStore.get('.root.gameplay.fieldOfView')), player, this.songPlayer);
      e.sprite.x = i++ * engineWidth + offset;
      e.sprite.y = 0;

      this.engines.push(e);
      this.graphicComponent.addEngine(e.sprite);
      difficulties.push(difficulty.get(player.getId()));
    }

    // Feed the song to the different components
    this.promises = [];

    // Game Engines
    let x = 0;
    for (let e of this.engines) {
      this.promises.push(e.loadSong(song, difficulties[x++]).then(() =>{
        let j = this.engines.indexOf(e);
        log.debug(`Engine ${j} loaded`);
        this.loading.loadPart(`Engine ${j} loaded`);
      }));
      this.loading.addPart();
    }

    // Song Player
    this.promises.push(this.songPlayer.load(song).then((song) => {
      log.debug('Song Player Loaded');
      this.loading.loadPart('Song Player loaded');
      return song;
    }));
    this.loading.addPart();

    // Engine View GC
    this.promises.push(song.load(RSC_BACKGROUND).then((texture) => {
      this.graphicComponent.setBackground(texture);
      log.debug('Background Loaded');
      this.loading.loadPart('Background loaded');
    }));
    this.loading.addPart();
  }

  reset () {
    log.debug('Reset the Song');

    // Set as not started;
    this.started = false;

    // Reset the SongPlayer
    this.songPlayer.reset().then(() => {

      for (let e of this.engines) {
        e.reset();
      }

      // Close the Pause Menu and Start the Playback again
      this.game.popView();
      this.songPlayer.play();
      this.started = true;
    });
  }

  /**
   * Wait for the promises and start the song
   * @listens onPushed
   */
  onPushed() {

    this.game.pushView(this.loading);

    Promise.all(this.promises).then(() => {
      this.game.popView();
      this.songPlayer.play();
      this.started = true;

      // Promise resolved when song finished or cancelled
      this.songPlayer.getEndPromise().then(() => {

        // Remove the engine View
        this.game.popView();

        //Create the Results View
        let results = this.engines.map((e) => {return e.getResults();});
        let resultsView = new ResultsView(this.game, this.song, results);
        this.game.pushView(resultsView);
      });
    });
  }


  /**
   * Configure the input
   * @listens onFocus
   */
  onFocus() {

    for (let engine of this.engines) {
      let player = engine.player;
      let mapping = new Map();

      let createBinding = (keycode, action, engine) => {
        return () => engine.danceInput(keycode, action, engine);
      };

      for (let keycode of [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT]) {
        for (let action of [TAP, LIFT]) {
          mapping.set([keycode, action], createBinding(keycode, action, engine));
        }
      }

      mapping.set([KEY_BACK, TAP], () => {this.pause();});

      player.mapping.setCommands(mapping);
    }

    if (this.started) {
      this.songPlayer.resume();
    }
  }

  /**
   * Pause the game
   */
  pause() {

    const reset = () => {
      this.reset();
    };

    let pause = new PauseView(this.game, reset);
    this.game.pushView(pause);
  }

  /**
   * Blur Event
   */
  onBlur() {
    if (this.started) {
      this.songPlayer.pause();
    }
  }

  /**
   * Get the view sprite
   * @returns {PIXI.DisplayObject}
   */
  getView() {
    return this.graphicComponent.sprite;
  }

  /**
   * Update
   */
  update() {

    if (!this.started) {
      return;
    }

    for (let e of this.engines) {
      e.update();
    }
  }

  /**
   * The game is closed
   */
  onPoped() {
    if (this.started) {
      this.songPlayer.close();
    }
  }

}
export default EngineView;
