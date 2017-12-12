'use strict';

import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';

import {theme as interfaces} from '../../src/interfaces';

export class LoadingViewDefaultGraphicComponent extends interfaces.LoadingViewGraphicComponent{

  /**
   * Create a Engien View
   * @param {Number} width - View width
   * @param {Number} height - View height
   */
  constructor(theme, width, height) {

    super(theme);
    this._percentage = 0;
    this._text = '';

    this.sprite = new PIXI.Container();

    this.background = new PIXI.Sprite(theme.getTexture('blank'));
    this.background.width = width;
    this.background.height = height;
    this.background.tint = 0x0e333d;

    this.textSprite = new PIXI.extras.BitmapText(this._text, {font : '24px clementeRegular', align : 'center'});
    this.textSprite.y = height - 90;
    this.textSprite.x = width/2;
    this.textSprite.anchor.x = 0.5;

    this.receptor = new PIXI.Sprite(theme.getTexture('progressBarUnder'));
    this.receptor.width = 500;
    this.receptor.height = 30;
    this.receptor.x = width/2 - this.receptor.width/2;
    this.receptor.y = height - 60;

    this.bar = new PIXI.Sprite(theme.getTexture('progressBarMiddle'));
    this.bar.x = this.receptor.x + 2;
    this.bar.y = this.receptor.y + 1;
    this.bar.width = 0;
    this.bar.height = this.receptor.height - 2;

    this.sprite.addChild(this.background);
    this.sprite.addChild(this.receptor);
    this.sprite.addChild(this.bar);
    this.sprite.addChild(this.textSprite);
  }

  get text () {
    return this._text;
  }

  set text (text) {
    this._text = text;
    this.textSprite.text = text;
  }

  get percentage () {
    return this._percentage;
  }

  set percentage (percentage) {
    this._percentage = percentage;
    TweenLite.to(this.bar, 0.5, {width: (this.receptor.width - 2) * percentage, ease: 'bounce'});
  }
}


