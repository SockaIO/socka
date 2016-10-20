/* jshint esnext: true */
"use strict";

class Menu {
  constructor(width, height, entries) {
    this.mainview = mainview;

    this.controller = null;

    this.controllerActions = {
      0: 'left',
      1: 'down',
      2: 'up',
      3: 'right',
      80: 'start',
      81: 'back'
    };

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

    this.graphicComponent = theme.createMenuGC(width, height, entries);

    this.handleMouse();

    this.graphicComponent.hover(this.selectedEntry, this.selectedSubEntries);
  }

  handleMouse() {
    for (let sprite of this.graphicComponent.iterSprites()) {
      sprite.interactive = true;
      sprite.mouseup = (m) => {
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
    let cmds = this.controller.handleInput();
    for (let cmd of cmds) {
      if (cmd.action === TAP) {
        this[this.controllerActions[cmd.direction]]();
        this.graphicComponent.hover(this.selectedEntry, this.selectedSubEntries);
      }
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

  get sprite() {
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

class MenuGraphicComponent {

  constructor(theme, width, height, entries) {
    this.spritesMapping = new WeakMap();

    this.PIXIEntries = [];
    let i = 0;
    for (let entry of entries) {
      let sprite = new PIXI.Text(entry.name);
      this.spritesMapping.set(sprite, [i]);

      let subsprites = [];
      if (entry.subEntries) {
        let j = 0;
        for (let e of entry.subEntries) {
          let s = new PIXI.Text(e);
          subsprites.push(s);
          this.spritesMapping.set(s, [i, j]);
          j++;
        }
      }

      this.PIXIEntries.push({
        'mainsprite': sprite,
        'entry': entry,
        'subsprites': subsprites,
        'index': i
      });
      i++;
    }
  }

  * iterSprites() {
    for (let sprite of this.PIXIEntries) {
      yield sprite.mainsprite;

      for (let s of sprite.subsprites) {
        yield s;
      }
    }
  }

  hover(entryIndex, subEntries) {
  }
}

