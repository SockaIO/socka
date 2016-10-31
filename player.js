/* jshint esnext: true */
"use strict";

/**
 * Player entity.
 * Store the configuration and controller
 */
class Player {


  /**
   * Player factory
   * @static
   */
  static CreatePlayer() {
    const p = new Player();
    Player.Players.add(p);
    return p;
  }

  /**
   * Craete a player with empty configuration
   * and no controller
   * @param {String} name - Player name
   */
  constructor() {
    this.configuration = new Map();
    this.controller = null;
    this.name = "Player " + (Player.Players.size + 1);
  }

  /**
   * Controller setter
   * @param {Controller} cotnroller - Controller used by the player
   */
  setController(controller) {
    this.controller = controller;
  }

}

Player.Players = new Set();
