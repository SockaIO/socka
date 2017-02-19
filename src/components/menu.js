'use strict';

/**
 * Class representing a menu. Each entry has a name attribute that get displayed
 * and can have other attributes used to implement custom logic.
 *
 * Optionnaly each entry can have a key that can be use for sorting and identification.
 *
 * @memberof components
 *
 */
class Menu {

  /**
   * Constructor of the Menu
   * @param {Object|Array} entries Menu entries
   * @param {Number} width Menu Width 
   * @param {Number} height Menu Height
   * @param {Function} graphicComponentFactory Factoru for the menu graphic Component 
   * @param {String} key Key used for sorting and identification (default is name)
   * @param {Boolean} sort Set to true to sort the entries (default is false)
   */
  constructor(entries, width, height, graphicComponentFactory, sort=false, key='name') {
    this.entries = entries;
    this.key = key;

    this.compareFunction = (a, b) => {return a[key] > b[key];};

    if (sort === true) {
      this.entries.sort(this.compareFunction);
    }

    this.selected = 0;
    this.graphicComponent = graphicComponentFactory (width, height, this);
  }

  /**
   * Get the Key of an entry
   * @returns {String} Key of the entry
   */
  getKey(entry) {
    return entry[this.key];
  }

  /**
   * Get the entries
   * @returns {Object|Array} The entries
   */
  getEntries() {
    return this.entries;
  }

  /**
   * Get the Selected Entry
   * @returns {Object} Selected Entry
   */
  getSelected() {
    return this.entries[this.selected];
  }

  /**
   * Get the Selected Index
   * @returns {Number} The selected index
   */
  getSelectedIndex() {
    return this.selected;
  }

  /**
   * Move the selector
   * @param {Number} change Change in the selected entry
   */
  move(change) {
    this.selected = (this.entries.length + this.selected + change) % this.entries.length;
  }

  /**
   * Jump after a specific key (unspecified behavior in non sorted entries)
   * @param {String} value The key value to jump after
   */
  jumpAfterKey(value) {

    for (let i = 0; i < this.entries.length; i++) {

      let e = this.entries[i];

      if (this.getKey(e) > value) {
        this.selected = i;
        break;
      }
    }
  }

  update () {
    this.graphicComponent.update ();
  }

  /**
   * Get the GC Sprite
   * @returns {PIXI.Container} GC Sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }




}

export default Menu;