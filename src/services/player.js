'use strict';

import {OptionStore} from '../components';
import * as Input from './input';

import {KEY_UP, KEY_LEFT, KEY_RIGHT, KEY_DOWN, KEY_ENTER, KEY_BACK} from '../constants/input';

/**
 * @namespace services.Player
 */

let players = new Set();

export {
  CreatePlayer,
  GetPlayers,
  LoadPlayers,
  SavePlayers,
  InitPlayers
};

/**
 * Player entity.
 * Store the configuration and controller
 * @memberof services.Player
 */
class Player {

  /**
   * Craete a player with empty configuration
   * and no controller
   * @param {String} name - Player name
   */
  constructor() {
    this.name = 'Player ' + (players.size + 1);
    this.optionStore = new OptionStore();
  }

  /**
   * Controller setter
   * @param {Mapping} mapping - Mapping used by the player
   */
  setMapping(mapping) {
    this.mapping = mapping;
  }

  /**
   * Return the Identifier of the player
   * returns {String} Player ID
   */
  getId() {
    return this.name;
  }


  /**
   * Serialize to JSON
   * @returns {String} JSON Representation
   */
  toJson() {
    let output = {
      name: this.name,
      optionStore: this.optionStore.toJson()
    };

    return JSON.stringify(output);
  }

  /**
   * JSON Deserialize
   * @param {String} data JSON Serialization of a Player
   */
  static CreateFromJson(data) {
    let plainData = JSON.parse(data);

    let player = new Player();
    player.optionStore = OptionStore.CreateFromJson(plainData.optionStore);
    player.name = plainData.name;

    return player;
  }
}

/**
 * Create a new Player
 * @return {Player} New Player
 * @memberof servicse.Player
 */
function CreatePlayer() {
  const p = new Player();
  players.add(p);
  return p;
}

/**
 * Get the Players
 * @returns {Player|Iterator} Iterator over the players
 * @memberof servicse.Player
 */
function GetPlayers() {
  return players.values();
}

/**
 * Load from local Storage
 */
function LoadPlayers() {
  let playerListData = localStorage.getItem('players');
  let playerList = JSON.parse(playerListData);

  for (let p of playerList) {
    players.add(Player.CreateFromJson(p));
  }

}

/**
 * Save the players to local Storage
 */
function SavePlayers() {
  localStorage.setItem('players', JSON.stringify(Array.from(players).map((x) => {return x.toJson();})));
}

/**
 * Initialize the players. If possible load from local Storage. Otherwise create 2 new players
 */
function InitPlayers()
{
  if (!localStorage.getItem('players')) {

    // Create the first player
    let p = CreatePlayer();
    p.setMapping(Input.GetDefaultKeyboardMapping());

    // Create a second plauer for test purpose
    let q = CreatePlayer();
    let m = new Input.Mapping();
    let c = Input.GetDefaultKeyboardController();

    m.setKey(KEY_UP, 87, c);
    m.setKey(KEY_DOWN, 83, c);
    m.setKey(KEY_LEFT, 65, c);
    m.setKey(KEY_RIGHT, 68, c);

    m.setKey(KEY_ENTER, 32, c);
    m.setKey(KEY_BACK, 27, c);

    q.setMapping(m);


  } else {
    LoadPlayers();
  }
}

