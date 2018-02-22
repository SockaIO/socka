'use strict';

import * as PIXI from 'pixi.js';
import {theme as interfaces} from '../../src/interfaces';

export class WaitViewDefaultGraphicComponent extends interfaces.PauseGraphicComponent{

  /**
   * Create a Wiat View
   * @param {Number} width - View width
   * @param {Number} height - View height
   */
  constructor(theme, width, height) {

    super(theme);
    this.width = width;
    this.height = height;

    this.sprite = new PIXI.Container();

    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x111111, 0.3);
    this.overlay.drawRect(0, 0, width, height);
    this.overlay.endFill();

    this.sprite.addChild(this.overlay);
  }
}


