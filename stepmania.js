'use strict';

//import PIXI from 'pixi.js';
//import { TweenLite } from 'gsap';

//import * as components from './components';
//import * as views from './views';
//import {theme} from './src/services';

// Internal dependencies
import {Game} from './src/components';
import {FileManager, Player} from './src/services';
import {MenuView, EngineView} from './src/views';

import {HttpEndpoint} from './src/services/endpoint';

// External dependencies
import log from 'loglevel';

window.addEventListener('load', init, false);

/**
 * Create a menu entry for a Song
 * @param {Song} song song to consider
 * @returns {Object} Menu Entry
 */
function songMenuEntry(song, game) {

  let name = song.name;

  let action = () => {

    // Start Loading the Song data
    song.loadResources();

    let gView = new EngineView(800, 600, song, 2, Player.GetPlayers(), game);
    game.pushView(gView);
  };

  return {name, action};
}

/**
 * Create a menu entry for a Pack
 * @param {Pack} pack pack to consider
 * @returns {Object} Menu Entry
 */
function packMenuEntry(pack, game) {

  let name = pack.name;
  let action = () => {

    let entries = [];
    pack.getSongs().then((songs) => {

      for (let s of songs) {
        entries.push(songMenuEntry(s, game));
      }

      let menu = new MenuView(800, 600, entries, game);
      game.pushView(menu);

    });
  };

  return {name, action};
}

/**
 * Initialize the game.
 */
function init() {

  log.setLevel('debug');
  log.info('Starting Game Initialization');

  FileManager.AddEndpoint(HttpEndpoint.CreateHttpEndpoint('http://localhost:8000'));
  let packs = FileManager.ListPacks();

  let game = new Game(800, 600, true);

  game.init().then(() => {

    let entries = [];

    packs.then((packsGen) => {
      for (let p of packsGen) {
        entries.push(packMenuEntry(p, game));
      }

      let menu = new MenuView(800, 600, entries, game);
      game.pushView(menu);
      game.main();

    });
  });
}
