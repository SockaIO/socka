/*eslint no-unused-vars: "off"*/
'use strict';

import * as PIXI from 'pixi.js';

/**
 * Mother class for the Graphic Components
 */
class GraphicComponent {

  constructor(theme) {
    this.theme = theme;
    this.sprite = null;
  }

  /**
   * Destroy the GC and its children
   */
  destructor() {
    if (this.sprite) {
      this.sprite.destroy({children: true});
    }
  }
}

/**
 * Simple Note GC
 *
 * @extends GraphicComponent
 */
class SimpleNoteGraphicComponent extends GraphicComponent{

  miss() {}
  hit(delay) {}

}

/**
 * Long Note GC
 *
 * @extends GraphicComponent
 */
class LongNoteGraphicComponent extends GraphicComponent{

  deactivate() {}
  activate() {}
  finish() {}

}


/**
 * Receptor GC
 *
 * @extends GraphicComponent
 */
class ReceptorGraphicComponent extends GraphicComponent{
}

/**
 * Menu GC
 */
class MenuGraphicComponent extends GraphicComponent{

  update() {}
}

/**
 * Base Theme class
 */
class Theme {

  constructor() {

    // Will be filled after loading
    this.textures = {};
  }

  /**
   * Load the textures associated with a song
   */
  loadSongTextures(song) {

    // Remove the old Textures

    if (this.textures['songBanner']) {
      this.textures['songBanner'].destroy(true);
    }

    if (this.textures['songBackground']) {
      this.textures['songBackground'].destroy(true);
    }

    // Download the new textures

    return new Promise((resolve) => {
      PIXI.loader
          .add(song.path + song.banner)
          .add(song.path + song.background)
          .load(resolve);
    }).then(() => {
      this.textures['songBanner'] = PIXI.loader.resources[this.path + this.banner].texture;
      this.textures['songBackground'] = PIXI.loader.resources[this.path + this.background].texture;
    });
  }
}


export {
  SimpleNoteGraphicComponent,
  LongNoteGraphicComponent,
  ReceptorGraphicComponent,
  MenuGraphicComponent,
  Theme 
};


