'use strict';

import * as PIXI from 'pixi.js';
import {TweenLite} from 'gsap';

import {theme as interfaces} from '../../src/interfaces';

export class TextMenuItemDefaultGraphicComponent extends interfaces.MenuItemGraphicComponent {

  constructor(theme, width, height, text) {
    super(theme);

    this.width = width;
    this.height = height;
    this.sprite = new PIXI.extras.BitmapText(text, {font: this.height + 'px clementeRegular', align: 'center'});

    this.players = new Set();
    this.highlighters = new Map();
  }

  setHighlighter (h, playerId) {
    this.highlighters.set(playerId, h);
  }

  onSelected(playerId='GamePlayer') {
    if (this.highlighters.has(playerId)) {
      this.highlighters.get(playerId).setHighlighted(this.sprite);
    } else {
      this.players.add(playerId);
      this.sprite.tint = 0x009900;
    }

  }

  onDeselected(playerId='GamePlayer') {
    if (this.highlighters.has(playerId)) {
      // Empty
    } else {
      this.players.delete(playerId);
      if (this.players.size === 0) {
        this.sprite.tint = 0xffffff;
      }
    }
  }
}

export class MappingMenuItemDefaultGraphicComponent extends interfaces.MenuItemGraphicComponent {

  constructor(theme, width, height, menuItem) {
    super(theme);

    this.menuItem = menuItem;

    this.width = width;
    this.height = height;

    this.sprite = new PIXI.Container();

    this.name = new PIXI.extras.BitmapText(`${menuItem.name}: `, {font: this.height + 'px clementeRegular', align: 'center'});
    this.sprite.addChild(this.name);

    this.offset = 200;
    this.entryWidth = 300;

    this.values = new Map();
    this.highlighters = new Map();

    let x = 0;
    for (let [playerId, value] of menuItem.getValues()) {
      let v = new PIXI.extras.BitmapText(this.getText(value), {font: this.height + 'px clementeRegular', align: 'center'});
      this.values.set(playerId, v);
      v.x = this.offset + x++ * (this.entryWidth);
      this.sprite.addChild(v);
    }

  }

  setHighlighter (h, playerId) {
    this.highlighters.set(playerId, h);
  }

  getText(value) {
    return `${value.key} [Pad: ${value.controller}]`;
  }

  onSelected(playerId) {
    let sprite = this.values.get(playerId);

    if (this.highlighters.get(playerId)) {
      this.highlighters.get(playerId).setHighlighted(sprite);
    } else {
      sprite.tint = 0x00ff00;
    }
  }

  onDeselected(playerId) {
    let sprite = this.values.get(playerId);
    if (this.highlighters.get(playerId)) {
      // Empty
    } else {
      sprite.tint = 0xffffff;
    }
  }

  update() {
    for (let [playerId ,v] of this.values) {
      v.text = this.getText(this.menuItem.getValues().get(playerId));
    }
  }
}

export class InputMenuItemDefaultGraphicComponent extends interfaces.MenuItemGraphicComponent {

  constructor(theme, width, height, menuItem) {
    super(theme);

    this.menuItem = menuItem;

    this.width = width;
    this.height = height;
    this.transitionDuration = 0.2;

    this.sprite = new PIXI.Container();

    this.name = new PIXI.extras.BitmapText(`${menuItem.name}: `, {font: this.height + 'px clementeRegular', align: 'center'});
    this.sprite.addChild(this.name);

    this.offset = this.name.width + 30;
    this.value = new PIXI.extras.BitmapText(`${menuItem.getValue()}: `, {font: this.height + 'px clementeRegular', align: 'center'});
    this.value.x = this.offset;
    this.sprite.addChild(this.value);

    this.highlighters = new Map();

    this.cursor = new PIXI.Graphics();
    this.cursor.beginFill(0xffffff, 0.5);
    this.cursor.drawRect(0, 0, 10, this.height);
    this.cursor.endFill();
    this.cursor.visible = false;

    this.sprite.addChild(this.cursor);
  }

  setHighlighter (h, playerId) {
    this.highlighters.set(playerId, h);
  }

  onSelected(playerId) {
    let sprite = this.name;

    if (this.highlighters.get(playerId)) {
      this.highlighters.get(playerId).setHighlighted(sprite);
    } else {
      sprite.tint = 0x00ff00;
    }
  }

  onDeselected(playerId) {
    let sprite = this.name;
    if (this.highlighters.get(playerId)) {
      // Empty
    } else {
      sprite.tint = 0xffffff;
    }
  }

  onFocus() {
    this.cursor.visible = true;
  }

  onBlur() {
    this.cursor.visible = false;
  }

  textWidth () {
    let width = this.value.width;

    // Add margin if the final char is a space
    if (this.value.text.slice(-1) === ' ') {
      width += 10;
    }

    // Add a little margin
    width += 2;

    return width;
  }

  update() {
    this.value.text = this.menuItem.getValue();
    TweenLite.to(this.cursor, this.transitionDuration, {x: this.offset + this.textWidth()});
  }
}


export class EnumMenuItemDefaultGraphicComponent extends interfaces.MenuItemGraphicComponent {

  constructor(theme, width, height, menuItem) {
    super(theme);

    this.menuItem = menuItem;

    this.width = width;
    this.height = height;

    this.sprite = new PIXI.Container();

    this.name = new PIXI.extras.BitmapText(`${menuItem.name}: `, {font: this.height + 'px clementeRegular', align: 'center'});
    this.sprite.addChild(this.name);

    this.margin = 20;
    this.offset = this.name.width + this.margin;

    // Create the list
    let x = this.offset;

    this.values = [];

    for (let v of menuItem.getEnum ()) {
      let t = new PIXI.extras.BitmapText(v, {font: this.height + 'px clementeRegular', align: 'center'});
      t.x = x;
      x += this.margin + t.width;
      this.sprite.addChild (t);
      this.values.push(t);
    }

    this.selectors = new Map();

    for (let [playerId, index] of menuItem.getIndexes()) {
      let selector = this.theme.createMenuItemSelectorGC(this.menuItem.getColor(playerId));
      selector.setSelected(this.values[index]);
      this.selectors.set(playerId, selector);
      this.sprite.addChild(selector.sprite);
    }

    this.highlighters = new Map();
  }

  setHighlighter(highlighter, playerId) {
    this.highlighters.set(playerId, highlighter);
  }

  getText(value) {
    return `${value.key} [Pad: ${value.controller}]`;
  }

  onSelected(playerId) {
    let sprite = this.values[this.menuItem.getIndexes().get(playerId)];
    if (this.highlighters.has(playerId)) {
      this.highlighters.get(playerId).setHighlighted (sprite);
    }
  }

  onDeselected() {}

  onChange(playerId, newIndex) {
    let sprite = this.values[newIndex];
    if (this.highlighters.has(playerId)) {
      this.highlighters.get(playerId).setHighlighted(sprite);
    }
    this.selectors.get(playerId).setSelected(sprite);
  }

  update() {}
}

export class MenuItemSelectorDefaultGraphicComponent extends interfaces.MenuItemSelectorGraphicComponent {

  /**
   * constructor
   */
  constructor(theme, color) {
    super(theme);

    this.sprite = new PIXI.Container();

    this.bar = new PIXI.Graphics();
    this.sprite.addChild(this.bar);
    this.color = color;
  }


  setSelected(sprite) {

    this.bar.destroy();

    let width = sprite.width + 5;
    let height = 5;

    let x = sprite.x;
    let y = sprite.y + sprite.height;

    this.bar = new PIXI.Graphics();
    this.bar.beginFill(this.color, 0.5);
    this.bar.drawRect(x, y, width, height);
    this.bar.endFill();

    this.sprite.addChild(this.bar);
  }
}

export class MenuItemHighlighterDefaultGraphicComponent extends interfaces.MenuItemHighlighterGraphicComponent {

  /**
   * constructor
   */
  constructor(theme, menuItems, playerId, playerColor) {
    super(theme, menuItems, playerId);

    this.sprite = new PIXI.Container();

    this.bar = new PIXI.Graphics();
    this.color = playerColor;

    this.bar.beginFill(this.color, 0.2);
    this.bar.drawRect(0, 0, 10, 10);
    this.bar.endFill();

    this.sprite.addChild(this.bar);

    // Parameters
    this.transitionDuration = 0.2;

    this.object = null;
  }

  setHighlighted(sprite) {

    //this.bar.destroy();
    this.object = sprite;

    let width = sprite.width + 5;
    let height = sprite.height + 5;

    let x = sprite.worldTransform.tx;
    let y = sprite.worldTransform.ty;

    TweenLite.to(this.bar.position, this.transitionDuration, {x, y});
    TweenLite.to(this.bar, this.transitionDuration, {width, height});

    this.sprite.addChild(this.bar);
  }

  update() {
    if (this.object !== null) {
      this.setHighlighted(this.object);
    }
  }
}

