'use strict';

import View from './view';
import {Theme, Player} from '../services';

import {KEY_UP, KEY_DOWN, TAP, KEY_BACK, KEY_ENTER} from '../constants/input';

/**
 * View Class for a simple menu
 *
 * @extends View
 * @memberof views
 */
class MenuView extends View {
  constructor(entries, game) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    this.selectedEntry = 0; 
    this.entries = entries;

    this.graphicComponent = Theme.GetTheme().createMenuGC(width, height, this);
    this.update();
  }

  back() {
    this.game.popView();
  }

  up() {
    if (this.selectedEntry === 0) {
      this.selectedEntry = this.entries.length - 1;
    } else {
      this.selectedEntry--;
    }
  }

  down() {
    if (this.selectedEntry >= this.entries.length - 1) {
      this.selectedEntry = 0;
    } else {
      this.selectedEntry++;
    }
  }

  left() {
    if (this.selectedSubEntry === undefined) {
      return;
    }
    if (this.selectedSubEntry === 0) {
      this.selectedSubEntry = this.currentEntry.subEntries.length - 1;
    } else {
      this.selectedSubEntry--;
    }
  }

  right() {
    if (this.selectedSubEntry === undefined) {
      return;
    }
    if (this.selectedSubEntry >= this.currentEntry.subEntries.length - 1) {
      this.selectedSubEntry = 0;
    } else {
      this.selectedSubEntry++;
    }
  }

  start() {
    this.entries[this.selectedEntry].action();
  }

  update() {
    this.graphicComponent.update();
  }

  onFocus() {

    let factories = new Map();

    factories.set([KEY_UP, TAP], () => {this.up ();});
    factories.set([KEY_DOWN, TAP], () => {this.down ();});
    factories.set([KEY_BACK, TAP], () => {this.back ();});
    factories.set([KEY_ENTER, TAP], () => {this.start ();});

    for (let p of Player.GetPlayers()) {
      p.mapping.setCommands(factories);
    }

    this.graphicComponent.sprite.visible = true;
  }

  onBlur() {
    this.graphicComponent.sprite.visible = false;
  }


  get selectedSubEntry() {
    return this.selectedSubEntries[this.selectedEntry];
  }

  set selectedSubEntry(val) {
    this.selectedSubEntries[this.selectedEntry] = val;
  }

  get currentEntry() {
    return this.entries[this.selectedEntry];
  }

  getView() {
    return this.graphicComponent.sprite;
  }

  get selections() {
    let res = {};
    let i = 0;
    for (let entry of this.entries) {
      if (entry.subEntries) {
        res[entry.name] = entry.subEntries[this.selectedSubEntries[i]];
      }
      i++;
    }
    return res;
  }
}
export default MenuView;
