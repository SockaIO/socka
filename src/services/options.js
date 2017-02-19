'use strict';

/**
 * @namespace services.Options
 */

let options;
let optionMap;

/**
 * Set the options
 * @param {OptionFolder} newOptions The Options tree
 */
export function SetOptions (newOptions) {
  options = newOptions;
  optionMap = options.getStoreEntry();
}

/**
 * Get the dewfault value for all the options
 * @returns {Map} Amp of all the defaults
 */
export function GetOptionDefaults () {

  let def = new Map();

  for (let [key, option] of optionMap.entries ()) {
    def.set(key, option.getDefault());
  }

  return def;
}

/**
 * Get one options
 * @param {String} id The option Full ID
 * @returns {Option} The Option
 */
export function GetOption(id) {
  return optionMap.get(id);
}

/**
* Option Folder. Contains OptionGroup objects
 */
export class OptionFolder {

  /**
   * Constructor.
   * @param {String} name Folder name
   * @param {String} id Folder ID
   * @param {OptionGroup|Array} groups OptionGroups contained in the folder
   */
  constructor(name, id,  groups) {
    this.name = name;
    this.id = id;
    this.groups = new Map();

    for (let g of groups) {
      this.groups.set (g.getName (), g);
    }
  }

  /**
   * Get the Name
   * @returns {String} Folder name
   */
  getName () {
    return this.name;
  }

  /**
   * Get the groups
   * @returns {OptionGroup|Array} Options groups
   */
  getGroups() {
    return this.groups.values ();
  }


  /**
   * Get a Store entry
   * @param {String} prefix Prefix for the key
   */
  getStoreEntry(prefix='') {

    let maps = [];

    for (let g of this.getGroups()) {
      maps = maps.concat(Array.from(g.getStoreEntry(`${prefix}.${this.id}`).entries ()));
    }

    return new Map(maps);
  }
}

/**
 * Option Group. Contain Options to modify
 */
export class OptionGroup {

  /**
   * Constructor.
   * @param {String} name Group name
   * @param {String} id Group ID
   * @param {Option|Array} options Options contained in the group
   */
  constructor (name, id, options) {
    this.name = name;
    this.id = id;
    this.options = new Map();

    for (let o of options) {
      this.options.set (o.getName (), o);
    }
  }

  /**
   * Get the Options
   * @return {Option|Array} Options
   */
  getOptions () {
    return this.options.values ();
  }

  /**
   * Get the name
   * @returns {String} name
   */
  getName () {
    return this.name;
  }

  /**
   * Get a Store entry
   * @param {String} prefix Prefix for the key
   */
  getStoreEntry(prefix) {

    let maps = [];

    for (let o of this.getOptions()) {
      maps = maps.concat(Array.from(o.getStoreEntry(`${prefix}.${this.id}`).entries ()));
    }

    return new Map(maps);
  }
}

/**
 * Option. Option that can be set
 * @interface
 */
class Option {

  /**
   * Get the name
   * @returns {String} Option Name
   */
  getName () {
    return this.name;
  }

  /**
   * Check if the value is correct
   * @param {*} value
   * @returns {Boolean} True if the value is connect
   */
  check(value) {}

  /**
   * Get the default value
   * @returns {*} Default value
   */
  getDefault() {
    return this.default;
  }

  /**
   * Get a Store entry
   * @param {String} prefix Prefix for the key
   */
  getStoreEntry(prefix) {
    return new Map([[`${prefix}.${this.id}`, this]]);
  }
}

/**
 * Numeric Options
 * @extends Option
 */
export class NumericOption extends Option {

  /**
   * Constructor. Allow to specify the allowed range and the default value
   * @param {String} name Option name
   * @param {String} id Option ID
   * @param {Number} min Min value allowed
   * @param {Number} max Max value allowed
   * @param {Number} def Default value
   */
  constructor(name, id,  min, max, def) {
    super ();
    this.name = name;
    this.id = id;
    this.min = min;
    this.max = max;
    this.default = def;
  }

  check(value) {
    return (value > this.min && value < this.max);
  }

}

/**
 * Text Options
 * @extends Option
 */
export class TextOption extends Option {

  /**
   * Constructor. Specify the min and max length, the default value and an optional check regex
   * @param {String} name Option name
   * @param {String} id Option ID
   * @param {Number} minLen Min length
   * @param {Number} maxLen Max length
   * @param {String} def Default Value
   * @param {Object} checkRegex A Regex that must be matched
   */
  constructor(name, id, minLen, maxLen, def, checkRegex=null) {
    super();
    this.name = name;
    this.id = id;
    this.minLen = minLen;
    this.maxLen = maxLen;
    this.default = def;
    this.checkRegex = checkRegex;
  }

  check(value) {
    return value.length > this.minLen &&
           value.length < this.maxLen &&
           (this.checkRegex === null ||this.checkRegex.test(value));
  }

}

/**
 * Enum Options. Option that can take a a value from an enum
 * @extends Option
 */
export class EnumOption extends Option {

  /**
   * Constructor. Specify the default an the accepted values
   * @param {String} name Option name
   * @param {String} id Option ID
   * @param {*|Array} values Accepted values
   * @param {*} def Default Value
   */
  constructor(name, id, values, def) {
    super();
    this.name = name;
    this.id = id;
    this.acceptedValues = values;
    this.default = def;
  }

  check(value) {
    return this.acceptedValues.includes(value);
  }
}
