/**
 * @namespace services.Library
 */
import {Player, FileManager} from '../services';
import {PauseView, MenuView, EngineView, SongMenuView2, WaitView} from '../views';
import {HttpEndpoint} from './endpoint';

import log from 'loglevel';

'use strict';

let packs;
let customEndpoint;

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

    let waitView = new WaitView(game);
    game.pushView(waitView, false);

    let entries = [];
    pack.getSongs().then((songs) => {

      // Pop The Wait View
      game.popView();

      for (let s of songs) {
        entries.push(songMenuEntry(s, game));
      }

      let menu = new SongMenuView2(entries, game);
      game.pushView(menu);

    }, (err) => {
      // Just make sure to pop the wait view not to get stuck
      game.popView();

      // Keep the error
      throw err;
    });
  };

  return {name, action};
}

/**
 * Generate the Pack Menu Entries
 */
export function GeneratePackMenu(game) {

  if (packs === undefined) {
    log.error('No pack initialized');
    return;
  }

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
 * Init the Library
 * - Load the Packs
 */
export function Init() {

  // TODO: Proper pack management

  // Hard Code the System packs into the FileManager
  FileManager.AddEndpoint(HttpEndpoint.CreateHttpEndpoint('http://localhost:8000'));
  FileManager.AddEndpoint(HttpEndpoint.CreateHttpEndpoint('/songs'));

  loadPacks();
}

function loadPacks() {
  packs = FileManager.ListPacks();
}

export function SetCustomEndpoint(endpoint) {

  // Remove the previous custom endpoint
  this.RemoveCustomEndpoint(false);

  customEndpoint = endpoint;
  FileManager.AddEndpoint(endpoint);

  loadPacks();
}

export function RemoveCustomEndpoint(reload=true) {
  if (customEndpoint !== undefined) {
    FileManager.RemoveEndpoint(customEndpoint);
  }

  if (reload === true) {
    loadPacks();
  }
}
