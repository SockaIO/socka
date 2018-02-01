'use strict';

import * as PIXI from 'pixi.js';

import {theme as interfaces} from '../../src/interfaces';

/**
 * Pause
 */
export class PauseDefaultGraphicComponent extends interfaces.PauseGraphicComponent {

  constructor(theme, width, height, menu) {
    super(theme);
    this.width = width;
    this.height = height;
    this.menu = menu;

    this.sprite = new PIXI.Container();

    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x111111, 0.8);
    this.overlay.drawRect(0, 0, width, height);
    this.overlay.endFill();

    this.sprite.addChild(this.overlay);
    this.sprite.addChild(this.menu.sprite);

  }

  update() {
    this.menu.update();
  }
}



