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
    this._songName = '';

    this.width = width;
    this.height = height;

    this.sprite = new PIXI.Container();

    this.background = new PIXI.Sprite(theme.getTexture('bgMain'));
    this.background.width = width;
    this.background.height = height;
    this.sprite.addChild(this.background);

    const barY =  2.5 * height / 4;
    const barWidth = this.width / 2;

    this.receptor = this.createReceptor(barWidth);
    this.receptor.x = width/2 - this.receptor.width/2;
    this.receptor.y = barY - this.receptor.height / 2;
    this.sprite.addChild(this.receptor);

    this.bar = this.createBar(barWidth);
    this.bar.x = width/2 - this.receptor.width/2;
    this.bar.y = barY - this.bar.height / 2;
    this.sprite.addChild(this.bar);

    this.mask = this.addMask(this.bar);
    this.mask.width = 0;

    this.textSprite = new PIXI.extras.BitmapText(this._text, {font : '24px clementeRegular', align : 'center'});
    this.sprite.addChild(this.textSprite);
    this.textSprite.anchor = 0.5;
    this.textSprite.x = width / 2;
    this.textSprite.y = barY;

    const titleHeight = 80;
    this.createSongTitle(titleHeight);

    this.createBanner((barY - this.receptor.height / 2 + titleHeight) / 2);
  }

  createSongTitle(height=80) {
    this.topBox = new PIXI.Graphics();
    this.topBox.beginFill(0x111111, 0.7);
    this.topBox.drawRect(0, 0, this.width, height);
    this.topBox.endFill();
    this.sprite.addChild(this.topBox);

    const fontHeight = 60;

    this.songSprite = new PIXI.extras.BitmapText(this._text, {font : `${fontHeight}px clementeRegular`});
    this.sprite.addChild(this.songSprite);

    this.songSprite.anchor = 0.5;
    this.songSprite.x = this.width / 2;
    this.songSprite.y = height / 2;
    this.songSprite.tint = 0xfff893;
  }

  createBanner(y) {
    this.bannerContainer = new PIXI.Container();
    this.sprite.addChild(this.bannerContainer);

    this._banner = new PIXI.Sprite();
    this._banner.width = this.width / 2 * 0.75;
    this.bannerContainer.x = this.width / 2 - this._banner.width / 2;
    this.bannerContainer.y = y;

    this.bannerContainer.addChild(this._banner);
  }


  createReceptor(width = 500) {
    let receptor = new PIXI.Container();
    receptor.width = width;

    let left = new PIXI.Sprite(this.theme.getTexture('progressBarUnderLeft'));
    left.scale = {x: 0.5, y: 0.5};
    receptor.addChild(left);

    let right = new PIXI.Sprite(this.theme.getTexture('progressBarUnderRight'));
    right.scale = {x: 0.5, y: 0.5};
    receptor.addChild(right);
    right.x = width - right.width;

    let middle = new PIXI.extras.TilingSprite(this.theme.getTexture('progressBarUnderMiddle'));
    middle.tileScale = {x: 0.5, y: 0.5};
    receptor.addChild(middle);
    middle.x = left.width;
    middle.width = width - left.width - right.width;
    middle.height = left.height;

    return receptor;
  }

  createBar(width = 500) {
    let receptor = new PIXI.Container();
    receptor.width = width;

    let left = new PIXI.Sprite(this.theme.getTexture('progressBarLeft'));
    left.scale = {x: 0.5, y: 0.5};
    receptor.addChild(left);

    let right = new PIXI.Sprite(this.theme.getTexture('progressBarRight'));
    right.scale = {x: 0.5, y: 0.5};
    receptor.addChild(right);
    right.x = width - right.width;

    let middle = new PIXI.extras.TilingSprite(this.theme.getTexture('progressBarMiddle'));
    receptor.addChild(middle);
    middle.tileScale = {x: 0.5, y: 0.5};
    middle.x = left.width - 2;
    middle.width = width - left.width - right.width + 4;
    middle.height = left.height;
    return receptor;
  }

  addMask(target) {

    let mask = new PIXI.Graphics();
    target.addChild(mask);

    mask.beginFill(0x8bc5ff, 0.5)
        .drawRect(0, 0, target.width, target.height)
        .endFill();

    target.mask = mask;

    return mask;
  }

  get text () {
    return this._text;
  }

  set text (text) {
    this._text = text;
    this.textSprite.text = text;
  }

  set songName (text) {
    this._songName = text;
    this.songSprite.text = text;
  }

  set banner(banner) {
    this._banner.texture = banner;

    this.bannerBorder = new PIXI.Graphics();
    const thick = 1;
    this.bannerBorder.lineStyle(thick, 0xffffff)
               .moveTo(thick, thick)
               .lineTo(thick, this._banner.height - thick)
               .lineTo(this._banner.width - thick, this._banner.height - thick)
               .lineTo(this._banner.width - thick, thick)
               .lineTo(thick, thick),
    this.bannerContainer.addChild(this.bannerBorder);

    this.bannerContainer.y -= this._banner.height / 2;

  }

  get percentage () {
    return this._percentage;
  }

  set percentage (percentage) {
    this._percentage = percentage;
    TweenLite.to(this.mask, 1, {width: (this.receptor.width) * percentage, ease: 'bounce'});
  }
}


