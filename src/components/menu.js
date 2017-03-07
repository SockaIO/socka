'use strict';

const NULL_PLAYER = {};
NULL_PLAYER.getId = () => {return 'totolepipo';};
NULL_PLAYER.getColor = () => {return 0xff0000;};

import {Theme} from '../services';

/**
 * Class representing a menu. Each entry has a name attribute that get displayed
 * and can have other attributes used to implement custom logic.
 *
 * Optionnaly each entry can have a key that can be use for sorting and identification.
 *
 * @memberof components
 *
 */
export class Menu {

  /**
   * Constructor of the Menu
   * @param {Object|Array} entries Menu entries
   * @param {Number} width Menu Width 
   * @param {Number} height Menu Height
   * @param {Function} graphicComponentFactory Factoru for the menu graphic Component 
   * @param {String} key Key used for sorting and identification (default is name)
   * @param {Boolean} sort Set to true to sort the entries (default is false)
   */
  constructor(entries, width, height, graphicComponentFactory, sort=false, highlighterFactory=null, players=[NULL_PLAYER], key='name') {
    this.entries = entries;
    this.key = key;

    this.compareFunction = (a, b) => {return a[key] > b[key];};

    if (sort === true) {
      this.entries.sort(this.compareFunction);
    }

    this.graphicComponent = graphicComponentFactory (width, height, this);

    this.selecteds = new Map();
    this.players = players;

    this.highlighters = new Map();

    if (highlighterFactory !== null) {
      for (let p of players) {
        let h = new highlighterFactory (entries, p);
        this.highlighters.set(p.getId(), h);
        this.sprite.addChild(h.sprite);
      }
    }

    for (let p of players) {
      this.selecteds.set(p.getId(), 0);
      this.setSelected(0, p);
    }
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
  getSelected(player=NULL_PLAYER) {
    return this.entries[this.selecteds.get(player.getId())];
  }

  /**
   * Get the Selected Index
   * @returns {Number} The selected index
   */
  getSelectedIndex(player=NULL_PLAYER) {
    return this.selecteds.get(player.getId());
  }

  /**
   * Set the Seleted Entry
   * @param {Number} index Entry index
   */
  setSelected(index, player=NULL_PLAYER) {
    this.getSelected(player).onDeselected(player);
    this.selecteds.set(player.getId(), index);
    this.getSelected(player).onSelected(player);
  }

  /**
   * Move the selector
   * @param {Number} change Change in the selected entry
   */
  move(change, player=NULL_PLAYER) {
    this.setSelected((this.entries.length + this.getSelectedIndex(player) + change) % this.entries.length, player);
  }

  /**
   * Jump after a specific key (unspecified behavior in non sorted entries)
   * @param {String} value The key value to jump after
   */
  jumpAfterKey(value) {

    for (let i = 0; i < this.entries.length; i++) {

      let e = this.entries[i];

      if (this.getKey(e) > value) {
        this.setSelected(i);
        break;
      }
    }
  }

  update () {
    this.graphicComponent.update ();
    for (let e of this.entries) {
      e.update();
    }

    for (let h of this.highlighters.values())
    {
      h.update();
    }
  }

  /**
   * Get the GC Sprite
   * @returns {PIXI.Container} GC Sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }
}


/**
 * Menu Item Interface
 * @interface
 */
export class MenuItem {

  /**
   * Left Action
   */
  left(player) {}

  /**
   * Right Action
   */
  right(player) {}

  /**
   * Enter Action
   */
  enter(player) {}

  /**
   * Action when selected
   */
  onSelected(player) {}

  /**
   * Action when  deselected
   */
  onDeselected(player) {}

  /**
   * Get the GC Sprite
   * @returns {PIXI.Container} GC Sprite
   */
  get sprite() {
    return this.graphicComponent.sprite;
  }

  update() {}
}


/**
 * Simple Text Menu Item
 * @extends MenuItem
 */
export class TextMenuItem extends MenuItem {

  constructor(text, action) {
    super();
    this.text = text;
    this.action = action;
  }

  createGraphicComponent (width, height) {
    this.graphicComponent = Theme.GetTheme().createTextMenuItemGC(width, height, this.text);
    return this.graphicComponent.sprite;
  }

  onSelected(player=NULL_PLAYER) {
    if (this.graphicComponent) {
      this.graphicComponent.onSelected(player.getId());
    }
  }

  onDeselected(player=NULL_PLAYER) {
    if (this.graphicComponent) {
      this.graphicComponent.onDeselected(player.getId());
    }
  }

  enter() {
    this.action();
  }
}
