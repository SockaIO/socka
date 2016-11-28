/* jshint esnext: true */
"use strict";

import View from './view'

/**
 * View Class for a simple menu
 *
 * @extends View
 */
export default class MenuView extends View {
  constructor(width, height, entries) {
    super();

    this.selectedEntry = 0;
    this.entries = entries;

    this.selectedSubEntries = [];
    for (let entry of entries) {
      if (entry.subEntries === undefined) {
        this.selectedSubEntries.push(undefined);
        continue;
      }
      let def = entry.subEntries.indexOf(entry.default);
      if (def === -1) {
        def = 0;
      }
      this.selectedSubEntries.push(def);
    }

    this.graphicComponent = game.theme.createMenuGC(width, height, entries);

    this.handleMouse();

    this.graphicComponent.hover(this.selectedEntry, this.selectedSubEntries);
  }

  handleMouse() {
    for (let sprite of this.graphicComponent.iterSprites()) {
      sprite.interactive = true;
      sprite.mouseup = sprite.tap = (m) => {
        this.mouseup(
          this.graphicComponent.spritesMapping.get(m.target)[0],
          this.graphicComponent.spritesMapping.get(m.target)[1]
        );
      };
      sprite.mouseover = (m) => {
        this.mouseover(this.graphicComponent.spritesMapping.get(m.target)[0]);
      };
    }
  }

  mouseup(entryIndex, subIndex) {
    this.selectedEntry = entryIndex;
    if (subIndex !== undefined) {
      this.selectedSubEntry = subIndex;
      this.graphicComponent.hover(entryIndex, this.selectedSubEntries);
    } else {
      this.currentEntry.action();
    }
  }

  mouseover(entryIndex) {
    this.selectedEntry = entryIndex;
    this.graphicComponent.hover(entryIndex, this.selectedSubEntries);
  }

  back() {
    game.popView();
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
    this.currentEntry.action();
  }

  update() {
    this.graphicComponent.hover(this.selectedEntry, this.selectedSubEntries);
  }

  onFocus() {

    console.log('Setting the controller factories');
    let factories = new Map();

    factories.set([KEY_UP, TAP], () => {this.up ()});
    factories.set([KEY_DOWN, TAP], () => {this.down ()});
    factories.set([KEY_BACK, TAP], () => {this.back ()});
    factories.set([KEY_ENTER, TAP], () => {this.start ()});

    for (let p of Player.Players.values()) {
      p.mapping.setCommands(factories);
    }
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

