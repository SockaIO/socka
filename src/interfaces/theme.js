/*eslint no-unused-vars: "off"*/
'use strict';

import * as PIXI from 'pixi.js';

/**
 * Mother class for the Graphic Components
 * @memberof interfaces
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
 * @memberof interfaces
 * @interface
 * @extends GraphicComponent
 */
class SimpleNoteGraphicComponent extends GraphicComponent{

  miss() {}
  hit(delay) {}

}

/**
 * Long Note GC
 *
 * @memberof interfaces
 * @interface
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
 * @memberof interfaces
 * @interface
 * @extends GraphicComponent
 */
class ReceptorGraphicComponent extends GraphicComponent{
}

/**
 * Menu GC
 * @memberof interfaces
 * @interface
 * @extends GraphicComponent
 */
class MenuGraphicComponent extends GraphicComponent{

  update() {}
}

/**
 * Base Theme class
 *
 * @memberof interfaces
 */
class Theme {

  constructor() {

    // Will be filled after loading
    this.textures = {};
  }
}


export {
  SimpleNoteGraphicComponent,
  LongNoteGraphicComponent,
  ReceptorGraphicComponent,
  MenuGraphicComponent,
  Theme 
};


