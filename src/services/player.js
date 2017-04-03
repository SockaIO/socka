'use strict';

import {OptionStore} from '../components';
import * as Input from './input';

import {KEY_UP, KEY_LEFT, KEY_RIGHT, KEY_DOWN, KEY_ENTER, KEY_BACK, KEYS} from '../constants/input';

/**
 * @namespace services.Player
 */

let players = new Map();
let activePlayers = new Map();
let colors = [0xff0000, 0x0000ff, 0x00ff00];

let GamePlayer;

export {
  CreatePlayer,
  GetPlayers,
  GetPlayer,
  LoadPlayers,
  SavePlayers,
  InitPlayers,
  GamePlayer,
  SetNumPlayers
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

    // The name will be overwritten when the game player is loaded
    this.name = '';

    this.id = players.size + 1;
    this.optionStore = new OptionStore();
    this.color = colors[players.size];
    this.mapping = new Input.Mapping();
  }

  /**
   * Return the player Color
   * @returns {Number} Hex code for the color
   */
  getColor () {
    return this.color;
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
    return this.id;
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
   * Save the current mapping to the optionStore
   */
  saveMapping () {

    let keyTexts = {
      [KEY_LEFT]: 'left',
      [KEY_RIGHT]: 'right',
      [KEY_UP]: 'up',
      [KEY_DOWN]: 'down',
      [KEY_ENTER]: 'enter',
      [KEY_BACK]: 'back',
    };

    for (let key of KEYS) {
      let controller, keyCode;

      // Get returns a set of one element so we need to extract the value
      [controller, keyCode] = [...this.mapping.mapping.get(key)][0];

      this.optionStore.set(`.root.mapping.${keyTexts[key]}`, {
        key: keyCode,
        controller: controller.id
      });
    }
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
  players.set(p.getId(), p);
  return p;
}

/**
 * Get the Players
 * @returns {Player|Iterator} Iterator over the players
 * @memberof servicse.Player
 */
function GetPlayers() {
  return activePlayers.values();
}

/**
 * Get a Player By Id
 * @param {String} id Player Id
 * @return {Player} Corresponding Player
 */
function GetPlayer(id) {
  if (id === 0) {
    return GamePlayer;
  }

  return players.get(id);
}

/**
 * Load from local Storage
 * @param {Game} game The Game Object
 */
function LoadPlayers(game) {
  let playerListData = localStorage.getItem('players');
  let playerList = JSON.parse(playerListData);

  for (let p of playerList) {
    const pl = Player.CreateFromJson(p);
    players.set(pl.getId(), pl);
    pl.setMapping(new Input.Mapping());
    pl.optionStore.updateWorld(pl, game);
  }
}

/**
 * Save the players to local Storage
 */
function SavePlayers() {
  localStorage.setItem('players', JSON.stringify(Array.from(players.values()).map((x) => {return x.toJson();})));
  localStorage.setItem('GamePlayer', GamePlayer.toJson());
}

/**
 * Initialize the players. If possible load from local Storage. Otherwise create 2 new players
 * @param {Game} game The Game Object
 */
function InitPlayers(game)
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

    // Save the mapping into the preference
    q.saveMapping();
    p.saveMapping();

  } else {
    LoadPlayers(game);
  }

  InitGamePlayer(game);

  // Initialize the active players
  let numPlayers = GamePlayer.optionStore.get('.root.players.numPlayers');
  SetNumPlayers(numPlayers);
}


/**
 * Set the number of active players
 * @param {Number} num Number of Active Players
 */
function SetNumPlayers(num) {

  let count = 0;
  activePlayers.clear();

  for (let p of players.values()) {
    activePlayers.set(p.getId(), p);

    if (++count >= num) {
      break;
    }
  }
}

/**
 * Initialize the game player
 * @param {Game} game The Game Object
 */
function InitGamePlayer(game) {

  if (!localStorage.getItem('GamePlayer')) {
    GamePlayer = new Player ();
    GamePlayer.name = 'GamePlayer';
    GamePlayer.id = 0;
  } else {
    let data = localStorage.getItem('GamePlayer');
    GamePlayer = Player.CreateFromJson(data);
    GamePlayer.id = 0;
    GamePlayer.optionStore.updateWorld(GamePlayer, game);
  }

  // Give the Game player the same mapping as the 1st player
  for (let p of players.values())
  {
    GamePlayer.setMapping(p.mapping);
    break;
  }
}
