'use strict';

import * as PIXI from 'pixi.js';

/*
 * Engine view simple graphic Component
 */
export class EngineViewDefaultGraphicComponent {

  /**
   * Create a Engien View
   * @param {Number} width - View width
   * @param {Number} height - View height
   */
  constructor(theme, width, height) {

    this.sprite = new PIXI.Container();
    this.theme = theme;

    this.background = new PIXI.Sprite();
    this.background.width = width;
    this.background.height = height;
    this.sprite.addChild(this.background);
  }

  /**
   * Set background texture
   * @param {PIXI.BaseTexture} texture - background Texture
   */
  setBackground(texture) {
    this.background.texture = texture;
  }

  /**
   * Add an engine to the view
   * @param {PIXI.DisplayObject} engine - Engine sprite
   */
  addEngine(engine) {
    this.sprite.addChild(engine);
  }
}


