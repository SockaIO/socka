'use strict';

/**
 * @namespace services.Player
 */

let players = new Set();

export {
  CreatePlayer,
  GetPlayers
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
    this.configuration = new Map();
    this.controller = null;
    this.name = 'Player ' + (players.size + 1);
  }

  /**
   * Controller setter
   * @param {Mapping} mapping - Mapping used by the player
   */
  setMapping(mapping) {
    this.mapping = mapping;
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

