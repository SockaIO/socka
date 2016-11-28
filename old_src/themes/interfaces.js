/* jshint esnext: true */
"use strict";

// Simple Note Graphics handling
class SimpleNoteGraphicComponent {

  constructor(theme) {
    this.theme = theme;
    this.sprite = null;
  }

  create() {}
  remove() {}

  // TODO: Replace with pure graphic function
  miss() {}
  hit(delay) {}

}

class LongNoteGraphicComponent {

  constructor(theme) {
    this.theme = theme;
  }

  create() {}
  remove() {}
  deactivate() {}

  activate() {}
  finish() {}

}


// The Receptor only function is the graphic component
// TODO: Complete the interface
class ReceptorGraphicComponent {

  constructor(theme) {
    this.theme = theme;
  }

  create() {}
  remove() {}

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


export {
  SimpleNoteGraphicComponent,
  LongNoteGraphicComponent,
  ReceptorGraphicComponent,
  MenuGraphicComponent
}

