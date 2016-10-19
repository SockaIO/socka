/* jshint esnext: true */
"use strict";

class Menu {
  constructor(width, height, entries) {
    this.mainview = mainview;

    this.controller = null;

    this.controllerActions = {
      1: 'down',
      2: 'up',
      80: 'start'
    };

    this.selectedEntry = 0;
    this.entries = entries;

    this.graphicComponent = theme.createMenuGC(width, height, entries);

    let menu = this;

    this._lastKeyPressed = [];

    for (let sprite of this.graphicComponent.PIXIEntries) {
      sprite.interactive = true;
      sprite.mouseup = function(mouseData){
        menu.mouseup(menu.graphicComponent.PIXIEntries.indexOf(this));
      };
      sprite.mouseover = function(mouseData){
        menu.mouseover(menu.graphicComponent.PIXIEntries.indexOf(this));
      };
    }
  }

  mouseup(entryIndex) {
    this.entries[entryIndex].action();
  }

  mouseover(entryIndex) {
    this.selectrdEntry = entryIndex;
    this.graphicComponent.hover(entryIndex);
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

  start() {
    this.entries[this.selectedEntry].action();
  }

  update() {
    let pressed = this.controller.getPressed();
    for (let d of pressed) {
      if (!this._lastKeyPressed.includes(d)) {
        if (d in this.controllerActions) {
          this[this.controllerActions[d]]();
          this.graphicComponent.hover(this.selectedEntry);
        }
      }
    }
    this._lastKeyPressed = pressed;
  }

  get sprite() {
    return this.graphicComponent.sprite;
  }
}

