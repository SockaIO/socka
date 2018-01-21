'use strict';

import {Theme, Player} from '../services';
import {NUM_PLAYERS} from '../constants/signaling';

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
   * @param {Symbol} id Menu Identifier for differenciation in the theme
   * @param {Object|Array} entries Menu entries
   * @param {Number} width Menu Width 
   * @param {Number} height Menu Height
   * @param {Function} graphicComponentFactory Factoru for the menu graphic Component 
   * @param {String} key Key used for sorting and identification (default is name)
   * @param {Boolean} sort Set to true to sort the entries (default is false)
   * @param {Boolean} keepIndex Keep the index when changing component default is false)
   */
  constructor(id, entries, width, height, graphicComponentFactory, sort=false, highlighterFactory=null, players=[Player.GamePlayer], key='name', keepIndex=false) {
    this.entries = entries;
    this.key = key;
    this.id = id;
    this.keepIndex = keepIndex;

    this.compareFunction = (a, b) => {return a[key] > b[key];};

    if (sort === true) {
      this.entries.sort(this.compareFunction);
    }

    this.selecteds = new Map();
    this.players = players;

    this.graphicComponent = graphicComponentFactory (width, height, this);

    this.highlighters = new Map();
    this.highlighterFactory = highlighterFactory;

    for (let p of players) {
      this.addPlayer(p);
    }
  }

  /**
   * Add a player to the menu
   */
  addPlayer(player) {
    if (this.highlighterFactory !== null) {
      let h = new this.highlighterFactory (this.entries, player);
      this.highlighters.set(player.getId(), h);
      this.sprite.addChild(h.sprite);
    }

    this.selecteds.set(player.getId(), 0);
    this.setSelected(0, player);
  }

  /**
   * Remove a players
   */
  removePlayer(player) {
    // Remove the highlighter
    let h = this.highlighters.get(player.getId());
    h.sprite.destroy();
    this.highlighters.delete(player.getId());

    // Remove the selected Memory
    this.selecteds.delete(player.getId());
  }

  /**
   * Update the Players connected
   */
  updatePlayers() {

    // We do not update if the menu is controlled by the game player
    if (this.players.length > 0 && this.players[0] === Player.GamePlayer) {
      return;
    }

    let newPlayers = [...Player.GetPlayers()]; // Convert iterator to array

    if (newPlayers.length > this.players.length) {
      for (let p of newPlayers) {
        // The player is not new
        if (this.selecteds.has(p.getId())) {
          continue;
        }
        this.addPlayer(p);
      }
    } else {
      for (let p of this.players) {
        if (newPlayers.includes(p)) {
          continue;
        }
        this.removePlayer(p);
      }
    }
    this.players = newPlayers;
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
  getSelected(player=Player.GamePlayer) {
    return this.entries[this.selecteds.get(player.getId())];
  }

  /**
   * Get the Selected Index
   * @returns {Number} The selected index
   */
  getSelectedIndex(player=Player.GamePlayer) {
    return this.selecteds.get(player.getId());
  }

  /**
   * Set the Seleted Entry
   * @param {Number} index Entry index
   */
  setSelected(index, player=Player.GamePlayer) {
    this.getSelected(player).onDeselected(player);
    this.selecteds.set(player.getId(), index);
    this.getSelected(player).onSelected(player);
  }

  /**
   * Move the selector
   * @param {Number} change Change in the selected entry
   */
  move(change, player=Player.GamePlayer) {
    let idx = null;
    let selected = this.getSelected(player);

    if (this.keepIndex === true && selected.getIndexes !== undefined) {
      idx = selected.getIndexes().get(player.getId());
    }

    this.setSelected((this.entries.length + this.getSelectedIndex(player) + change) % this.entries.length, player);
    selected = this.getSelected(player);
    if (idx !== null && selected.setIndex !== undefined) {
      selected.setIndex(player.getId(), idx);
    }
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

  upgrade(modifications) {
    this.graphicComponent.upgrade(modifications);

    if (!Array.isArray(modifications)) {
      modifications = [modifications];
    }

    for (let m of modifications) {
      this.handleModification(m);
    }
  }

  handleModification(modification) {
    switch(modification.type) {
    case NUM_PLAYERS:
      this.updatePlayers();
      break;
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

  onSelected(player=Player.GamePlayer) {
    if (this.graphicComponent) {
      this.graphicComponent.onSelected(player.getId());
    }
  }

  onDeselected(player=Player.GamePlayer) {
    if (this.graphicComponent) {
      this.graphicComponent.onDeselected(player.getId());
    }
  }

  enter() {
    this.action();
  }
}
