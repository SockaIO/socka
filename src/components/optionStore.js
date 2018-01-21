'use stric';

import {Options} from '../services';
import log from 'loglevel';

/**
 * @namespace components.OptionStore
 */

/**
 * Store keeping value for the options
 */
export default class OptionStore {

  /**
   * The constructor fetches the default from the options service
   * and override them with the values passed as aprameter
   * @param {Map} overrideValues Values to override the defaults
   */
  constructor (overrideValues=null) {

    // Get the defaults
    this.options = Options.GetOptionDefaults ();

    if (overrideValues === null) {
      return;
    }

    // Override
    for (let [key, value] of overrideValues.entries()) {
      this.set (key, value);
    }
  }

  /**
   * Set an option
   * @param {String} id ID of the Option
   * @param {*} value Value of the option
   * @returns {Boolean} True if success
   */
  set(id, value) {

    if (Options.GetOption(id).check(value)) {
      this.options.set (id, value);
      log.debug(`[OS Set] ${id}: ${JSON.stringify(value)}`);
      return true;
    }

    return false;
  }

  /**
   * Get an Option
   * @param {String} id ID of the Option
   * @returns {*} value Value of the option
   */
  get(id) {
    return this.options.get(id);
  }

  /**
   * Update the World based on the player options
   * @param {Player} The player
   */
  updateWorld(player, game) {
    for (let [id, value] of this.options) {
      let option = Options.GetOption(id);
      option.updateWorld(value, player, game);
    }
  }

  /**
   * Serialize to JSON
   * @returns {String} JSON Representation
   */
  toJson() {
    let output = {
      options: Array.from(this.options)
    };

    return JSON.stringify(output);
  }

  /**
   * JSON Deserialize
   * @param {String} data JSON Serialization of an OptionStore
   *
   */
  static CreateFromJson(data) {
    let plainData = JSON.parse(data);
    let store = new OptionStore(new Map(plainData.options));

    return store;
  }
}
