'use strict';

// Internal dependencies
import {Game} from './src/components';
import {FileManager, Player, Options} from './src/services';
import {MenuView, EngineView, SongMenuView, OptionsView} from './src/views';

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

  let action = (chartIndex) => {

    // Start Loading the Song data
    song.loadResources();

    let gView = new EngineView(song, chartIndex, Player.GetPlayers(), game);
    game.pushView(gView);
  };

  return {name, action, song};
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

      let menu = new SongMenuView(entries, game);
      game.pushView(menu);

    });
  };

  return {name, action};
}

/**
 * Generate the Pack Menu Entries
 */
function generatePackMenu(packs, game) {

  log.debug('Generating the Pack List');

  packs.then((packsGen) => {

    let entries = [];

    for (let p of packsGen) {
      log.debug(`Handling Pack ${JSON.stringify(p)}`);
      entries.push(packMenuEntry(p, game));
    }

    let menu = new MenuView(entries, game);
    game.pushView(menu);
  });
}

/**
 * Initialize the game.
 */
function init() {

  log.setLevel('debug');
  log.info('Starting Game Initialization');

  FileManager.AddEndpoint(HttpEndpoint.CreateHttpEndpoint('http://localhost:8000'));
  FileManager.AddEndpoint(HttpEndpoint.CreateHttpEndpoint('/songs'));
  let packs = FileManager.ListPacks();

  let game = new Game(1280, 720, true);

  game.init().then(() => {

    let entries = [
      {
        name: 'Play',
        action: () => {
          generatePackMenu(packs, game);
        }
      },
      {
        name: 'Options',
        action: () => {
          let o = new OptionsView(Options.GetRoot(), '', game);
          game.pushView(o);
        }
      }];

    let menu = new MenuView(entries, game, true);
    game.pushView(menu);

    game.main();
  });
}
