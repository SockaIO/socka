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
 * Pause GC
 * @memberof interfaces
 * @interface
 * @extends GraphicComponent
 */
class PauseGraphicComponent extends GraphicComponent{

  update() {}
}


/**
 * Results GC
 * @memberof interfaces
 * @interface
 * @extends GraphicComponent
 */
class ResultsGraphicComponent extends GraphicComponent{

  update() {}
}

/**
 * Loading GC
 * @memberof interfaces
 * @interface
 * @extends GraphicComponent
 *
 */
class LoadingViewGraphicComponent extends GraphicComponent{

  get text () {}
  set text (text) {}
  get percentage () {}
  set percentage (percentage) {}
}

/**
 * Text Menu Item GC
 * @memberof interfaces
 * @interface
 * @extends GraphicComponent
 */
class MenuItemGraphicComponent extends GraphicComponent {

  update() {}
  onSelected() {}
  onDeselected() {}
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

    this.loaded = new Promise((resolve) => {
      this.resolveLoaded = resolve;
    });
  }

  init() {
    this.doInit().then(() => {
      this.resolveLoaded();
    });
  }

  doInit() {}
}

/**
 * Highlight the menu item value selected by a player
 *
 * @memberof interfaces
 */
class MenuItemHighlighterGraphicComponent extends GraphicComponent {

  constructor(theme, menuItems) {

    console.log(menuItems);
    super(theme);

    for (let m of menuItems) {
      if (m.setHighlighter !== undefined) {
        m.setHighlighter(this);
      }
    }
  }

  /**
   * Change the highlighted sprite
   */
  setHighlighted(sprite) {}

}

/**
 * Emphasize the value of the option chosen by the player
 *
 * @memberof interfaces
 */
class MenuItemSelectorGraphicComponent extends GraphicComponent {

  /**
   * Set the selected Sprite
   */
  setSelected(sprite) {}

}

export {
  SimpleNoteGraphicComponent,
  LongNoteGraphicComponent,
  ReceptorGraphicComponent,
  MenuGraphicComponent,
  MenuItemGraphicComponent,
  PauseGraphicComponent,
  LoadingViewGraphicComponent,
  ResultsGraphicComponent,
  Theme,
  MenuItemHighlighterGraphicComponent,
  MenuItemSelectorGraphicComponent
};


