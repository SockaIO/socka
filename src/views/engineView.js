'use strict';

import View from './view';
import {SongPlayer, Engine} from '../components';
import {Theme} from '../services';

import {KEY_UP, KEY_LEFT, KEY_DOWN, KEY_RIGHT, TAP, LIFT} from '../constants/input';

import {RSC_BACKGROUND} from '../constants/resources';
/**
 * View Class for the gameplay.
 * Can contain one or more engines
 *
 * @extends View
 */
export default class EngineView extends View {

  /**
   * Create an engine view
   * @param {number} width - view width
   * @param {number} height - view height
   * @param {SongIndex} song - SonIndex of the song to load
   * @param {Number} difficulty - Index of the chart to use
   * @param {Player|Iterable} players - Players
   *
   */
  constructor(width, height, song, difficulty, players, game) {
    super(game);

    this.songPlayer = new SongPlayer();
    this.graphicComponent = Theme.GetTheme().createEngineViewGC(width, height);

    this.engines = [];
    this.started = false;

    const engineWidth = width / 2;
    const engineHeight = height;

    let i = 0;
    for (let player of players) {
      let e = new Engine(engineWidth, engineHeight, 6, player, this.songPlayer);
      e.sprite.x = i++ * engineWidth;
      e.sprite.y = 0;

      this.engines.push(e);
      this.graphicComponent.addEngine(e.sprite);
    }
    
    // Feed the song to the different components
    this.promises = [];

    // Game Engines
    for (let e of this.engines) {
      this.promises.push(e.loadSong(song, difficulty));
    }

    // Song Player
    this.promises.push(this.songPlayer.load(song));

    // Engine View GC
    this.promises.push(song.load(RSC_BACKGROUND).then((texture) => {
      this.graphicComponent.setBackground(texture);
    }));
  }

  /**
   * Wait for the promises and start the song
   * @listens onPushed
   */
  onPushed() {
    Promise.all(this.promises).then(() => {
      this.songPlayer.play();
      this.started = true;
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

      player.mapping.setCommands(mapping);
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

}


