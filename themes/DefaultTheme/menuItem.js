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

export class ChartMenuItemDefaultGraphicComponent extends TextMenuItemDefaultGraphicComponent {

  constructor(theme, width, height, chart) {
    super(theme, width, height, '');

    this.chart = chart;
    this.createSprite();
    this.colorize();
  }

  createSprite() {
    this.sprite = new PIXI.Container();

    this.border = new PIXI.Graphics();
    const thick = 1;
    this.border.beginFill(0x111111, 0.8)
               .drawRect(thick, thick, this.width - thick, this.height - thick)
               .endFill()
               .lineStyle(thick, 0xffffff)
               .moveTo(thick, thick)
               .lineTo(thick, this.height - thick)
               .lineTo(this.width - thick, this.height - thick)
               .lineTo(this.width - thick, thick)
               .lineTo(thick, thick),
    this.sprite.addChild(this.border);

    const format = {font: `${0.6 * this.height}px clementeRegular`};
    this.text = new PIXI.extras.BitmapText(`${this.chart.difficulty} (${this.chart.meter})`, format);
    this.text.x = this.width / 2 - this.text.width / 2;
    this.text.y = this.height / 2 - this.text.height / 2;
    this.sprite.addChild(this.text);
  }

  colorize() {
    let color;
    switch(this.chart.difficulty.toLowerCase()) {
    case 'beginner':
      color = 0xb43578;
      break;
    case 'easy':
    case 'basic':
      color = 0x35c379;
      break;
    case 'medium':
    case 'another':
      color = 0xdbd71c;
      break;
    case 'hard':
    case 'maniac':
      color = 0x2469aa;
      break;
    case 'challenge':
    case 'smaniac':
      color = 0xdd4119;
      break;
    }

    this.text.tint = color;
    this.border.tint = color;
  }

}

export class SongMenuItemDefaultGraphicComponent extends interfaces.MenuItemGraphicComponent {

  constructor(theme, width, height, song) {
    super(theme);

    this.width = width;
    this.height = height;
    this.txtHeight = 20;
    this.shift = 50;
    this.transitionDuration = 0.25;

    this.song = song;

    this.createSprites();

    this.players = new Set();
    this.highlighters = new Map();
  }

  createSprites() {
    this.sprite = new PIXI.Container();

    this.background = new PIXI.Graphics();
    this.background.beginFill(0x111111, 0.8);
    this.background.drawRect(0, 0, this.width, this.height);
    this.background.endFill();
    this.sprite.addChild(this.background);

    this.border = new PIXI.Graphics();
    const thick = 1;
    this.border.lineStyle(thick, 0xffffff)
               .moveTo(thick, thick)
               .lineTo(thick, this.height - thick)
               .lineTo(this.width - thick, this.height - thick)
               .lineTo(this.width - thick, thick)
               .lineTo(thick, thick),
    this.border.alpha = 0;
    this.sprite.addChild(this.border);


    // Set the Txt
    this.setTxt({x: 1, y: 1});
  }

  setTxt (scale) {


    if (this.txt == undefined) {
      const height = this.txtHeight * scale.y;
      this.txt = new PIXI.extras.BitmapText(this.song.name, {font: height + 'px clementeRegular'});

      // Ugly Hack not to overflow from the container
      const proportion = 0.6;

      if (this.txt.width > this.width * proportion) {
        const len = this.song.name.length;
        let target = Math.floor(proportion * this.width * len / this.txt.width);
        this.txt = new PIXI.extras.BitmapText(this.song.name.substring(0, target), {font: height + 'px clementeRegular'});
      }
      this.sprite.addChild(this.txt);
    }

    const txtScale = scale.y === 1 ? 1 : 1.3;
    this.txt.scale = {x: txtScale, y: txtScale};

    this.txt.y = this.height * scale.y / 2 - this.txt.height / 2;
    this.txt.x = this.shift * scale.x;
  }

  setHighlighter (h, playerId) {
    this.highlighters.set(playerId, h);
  }

  setScale(value, duration) {
    TweenLite.to(this.background.scale, duration, value);
    TweenLite.to(this.border.scale, duration, value);
    this.setTxt (value);
  }

  onSelected() {
    TweenLite.to(this.border, this.transitionDuration, {alpha: 1});
  }

  onDeselected() {
    TweenLite.to(this.border, this.transitionDuration, {alpha: 0});
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
    this.entryWidth = 250;

    this.values = [];
    this.highlighters = new Map();

    let x = 0;
    const txtOptions = {font: this.height + 'px clementeRegular', align: 'center'};

    for (let [, value] of menuItem.getValues()) {

      // Primary Key
      let primary = new PIXI.extras.BitmapText(this.getText(value['PRIMARY']), txtOptions);
      let secondary = new PIXI.extras.BitmapText(this.getText(value['SECONDARY']), txtOptions);

      this.values.push(primary);
      this.values.push(secondary);

      primary.x = this.offset + x++ * (this.entryWidth);
      secondary.x = this.offset + x++ * (this.entryWidth);

      this.sprite.addChild(primary);
      this.sprite.addChild(secondary);
    }

  }

  setHighlighter (h, playerId) {
    this.highlighters.set(playerId, h);
  }

  // TODO: Improve with better pad name (extracted using the Input service?)
  getPrettyPadName(value) {
    if (value.controller === -1) {
      return 'Kbd';
    } else {
      return `Pad: ${value.controller}`;
    }
  }

  getText(value) {
    if (value === undefined) {
      return '      --      ';
    }

    return `${value.key} [${this.getPrettyPadName(value)}]`;
  }

  onChange(playerId, newIndex) {
    let sprite = this.values[newIndex]; // account that the name is sprite 0;

    if (this.highlighters.has(playerId)) {
      this.highlighters.get(playerId).setHighlighted(sprite);
    }
  }

  onSelected(playerId) {
    let sprite = this.values[this.menuItem.getIndexes().get(playerId)];

    if (this.highlighters.get(playerId)) {
      this.highlighters.get(playerId).setHighlighted(sprite);
    } else {
      sprite.tint = 0x00ff00;
    }
  }

  onDeselected(playerId) {
    let sprite = this.values[this.menuItem.getIndexes().get(playerId)];
    if (this.highlighters.get(playerId)) {
      // Empty
    } else {
      sprite.tint = 0xffffff;
    }
  }

  update() {
    let x = 0;
    for (let [, value] of this.menuItem.getValues()) {
      this.values[x++].text = this.getText(value['PRIMARY']);
      this.values[x++].text = this.getText(value['SECONDARY']);
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

