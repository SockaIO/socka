'use strict';

import * as PIXI from 'pixi.js';
import {TweenLite} from 'gsap';

import {theme as interfaces} from '../../src/interfaces';

import {MENU_MAIN, MENU_OPTION, MENU_OPTION_MAPPING} from '../../src/constants/resources';
import {RESIZE} from '../../src/constants/signaling';

export class MenuDefaultGraphicComponent extends interfaces.MenuGraphicComponent {

  constructor(theme, width, height, menu) {
    super(theme);

    // Engine Container
    this.height = height;
    this.width = width;
    this.menu = menu;

    this.createMainSprite();

    this.initConstants();

    // Parameters
    this.transitionDuration = 0.25;
    this.amplification = 2;

    this.createEntries(menu.getEntries());
    this.theme = theme;
  }

  initConstants() {
    // Usefull constants
    this.lineHeight = 30;
    this.margin = 5;
    this.numLines = (this.height / 2) / (this.lineHeight + this.margin) - 1;
    this.origin = this.height / 2;
  }

  createEntries(entries) {

    this.entries = [];

    for (let entry of entries) {
      let sprite = entry.createGraphicComponent(this.width, this.lineHeight);
      sprite.x = this.width/2 - sprite.width / 2;
      this.foreground.addChild(sprite);
      this.entries.push(sprite);
    }
  }

  createMainSprite() {
    this.sprite = new PIXI.Container();

    if (this.menu.id === MENU_MAIN) {
      this.background = new PIXI.Sprite(this.theme.getTexture('bgMain'));
    }
    this.foreground = new PIXI.Container();

    this.sprite.addChild(this.background);
    this.sprite.addChild(this.foreground);
  }

  // Returns the Position + Scale
  getPosition(distance, sprite) {
    let newScale = 1;

    // Center on the origin line
    let newY = this.origin - sprite.height / 2;
    // Shift from the amplified middle to first place;
    newY += Math.sign(distance) * (this.lineHeight * (this.amplification + 1) / 2 + this.margin);
    // Shift the remaining of the way
    newY += Math.sign(distance) * (Math.abs(distance) - 1) * (this.lineHeight + this.margin);

    if (distance === 0) {
      newScale = this.amplification;
      newY = this.origin - sprite.height / 2;
    }

    let newX = this.width/2 - sprite.width / 2;

    return {
      x: newX,
      y: newY,
      scale: {x: newScale, y: newScale}
    };
  }

  /**
   * Barbarian Update
   */
  update() {

    const selectedIndex = this.menu.getSelectedIndex();

    for (let x = 0; x < this.entries.length; x++) {

      let sprite = this.entries[x];
      let distance = x - selectedIndex;

      // Not displayed
      if (Math.abs(distance) > this.numLines) {
        sprite.visible = false;
      } else {
        sprite.visible = true;
      }

      let newPosition = this.getPosition(distance, sprite);

      TweenLite.to(sprite, this.transitionDuration, {y: newPosition.y});
      TweenLite.to(sprite.scale, this.transitionDuration, newPosition.scale);
      sprite.x = newPosition.x;
    }
  }

  handleModification(modification) {
    switch(modification.type) {
    case RESIZE:
      this.width = modification.width;
      this.height = modification.height;

      this.initConstants();
    }
  }
}

/**
 * Song Menu
 */

export class SongMenuDefaultGraphicComponent extends interfaces.MenuGraphicComponent {

  constructor(theme, width, height, menu) {
    super(theme);

    // Engine Container
    this.height = height;
    this.width = width;
    this.menu = menu;

    this.createMainSprite();
    this.createSongSprites();

    // Usefull constants
    this.lineHeight = 30;
    this.margin = 5;
    this.numLines = (this.height / 2) / (this.lineHeight + this.margin) - 1;
    this.origin = this.height / 2;

    this.createEntries(menu.entries);
    this.theme = theme;

  }

  createEntries(entries) {

    this.entries = [];

    for (let entry of entries) {
      let sprite = new PIXI.extras.BitmapText(entry.name, {font: this.lineHeight + 'px clementeRegular', align: 'center'});
      sprite.x = 50;
      //sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
      this.foreground.addChild(sprite);
      this.entries.push(sprite);
    }
  }

  createSongSprites() {

    this.songInfo = new PIXI.Container();
    this.songInfo.x = this.width / 1.75;
    this.songInfo.y = 20;

    this.banner = new PIXI.Sprite();
    this.banner.anchor.x = 0;

    this.banner.width = this.width * 0.75 / 1.75;

    this.chartMenu = new PIXI.Container();
    this.chartEntries = [];

    this.songInfo.addChild(this.banner);
    this.songInfo.addChild(this.chartMenu);
    this.foreground.addChild(this.songInfo);
  }

  createMainSprite() {
    this.sprite = new PIXI.Container();

    this.background = new PIXI.Container();
    this.foreground = new PIXI.Container();

    this.sprite.addChild(this.background);
    this.sprite.addChild(this.foreground);
  }

  /**
   * Barbarian Update
   */
  update() {

    for (let x = 0; x < this.entries.length; x++) {

      let sprite = this.entries[x];
      let distance = x - this.menu.selectedEntry;

      // Not displayed
      if (Math.abs(distance) > this.numLines) {
        sprite.visible = false;
      } else {
        sprite.visible = true;
      }

      sprite.y = this.origin + distance * (this.lineHeight + this.margin) + Math.sign(distance) * this.lineHeight / 2;
      sprite.scale = {x:1, y:1};
      sprite.x = 50;
    }

    let selected = this.entries[this.menu.selectedEntry];
    selected.scale = {x:2, y:2};
    selected.x = 50;
    selected.y = this.origin;

    // Update the chart menu
    for (let x = 0; x < this.chartEntries.length; x++) {

      let c = this.chartEntries[x];

      if (x === this.menu.selectedChart) {
        c.tint = 0xaa2200;
      } else {
        c.tint = 0xffffff;
      }
    }
  }

  updateSongDisplay() {
    if (!this.menu.selectedSong) {
      return;
    }

    if (this.menu.selectedSong.banner !== undefined) {
      if (this.menu.selectedSong.banner === null) {
        this.banner.visible = false ;
      } else {
        this.banner.visible = true;
        this.banner.texture = this.menu.selectedSong.banner;
      }
    }

    this.chartMenu.removeChildren();
    this.chartEntries = [];
    if (this.menu.selectedSong.charts !== undefined && this.menu.selectedSong.charts !== null) {

      let index = 0;

      for (let c of this.menu.selectedSong.charts) {

        let sprite = new PIXI.extras.BitmapText(` ${c.difficulty} [${c.meter}]`  , {font: 30 + 'px clementeRegular', align: 'center'});
        sprite.y = this.banner.height + index++ * 30;
        sprite.x = this.banner.width / 2 - sprite.width / 2;

        this.chartEntries.push(sprite);
        this.chartMenu.addChild(sprite);
      }
    } else {
      this.charts = [];
      this.chartEntries = [];
    }
  }

}


export class OptionMenuDefaultGraphicComponent extends interfaces.MenuGraphicComponent {

  constructor(theme, width, height, menu) {
    super(theme);

    // Engine Container
    this.height = height;
    this.width = width;
    this.menu = menu;

    this.lineHeight = 50;
    this.margin = 10;

    this.createMainSprite();
    this.createEntries(menu.getEntries());

    this.initConstants();
    this.theme = theme;

    this.specialize();

    this.minView = 0;
    this.maxView = this.numLines;
  }

  initConstants() {
    // Usefull constants
    this.numLines = Math.floor((this.height) / (this.lineHeight + this.margin));
    this.origin = this.height / 2;

    this.offsetY = this.origin - ((this.lineHeight + this.margin) * this.entries.length) / 2;
    this.offsetX = this.width / 2 - Math.max(...this.entries.map((x) => x.width)) / 2;
  }

  createEntries(entries) {

    this.entries = [];

    for (let entry of entries) {
      let sprite = entry.createGraphicComponent(this.width, this.lineHeight);
      this.foreground.addChild(sprite);
      this.entries.push(sprite);
      sprite.visible = false;
    }
  }

  createMainSprite() {
    this.sprite = new PIXI.Container();

    this.background = new PIXI.Container();
    this.foreground = new PIXI.Container();

    if (this.menu.id === MENU_OPTION || this.menu.id === MENU_OPTION_MAPPING) {
      this.background = new PIXI.Sprite(this.theme.getTexture('bgMain'));
    }

    this.sprite.addChild(this.background);
    this.sprite.addChild(this.foreground);
  }

  specialize() {
    if (this.menu.id === MENU_OPTION_MAPPING) {
      this.createMappingSpecialization();
    }
  }

  createMappingSpecialization() {
    // Create the Players Table head

    const txtOption = {font: '50px clementeRegular', align: 'center'};
    const tint = 0x009900;
    const offset = 200; // name offset from the menu item
    let width = Math.max(...this.entries.map((x) => x.width)) - offset; // menu width - offset
    const numPlayers = this.menu.players.length;

    for (let x=0; x < numPlayers; x++) {
      let p = new PIXI.extras.BitmapText(`Player ${x+1}`, txtOption);
      p.x = this.offsetX + offset + x * (width / 2) + (width / (2 * numPlayers)) - (p.width / 2);
      p.y = this.offsetY - 100;
      p.tint = tint;
      this.sprite.addChild(p);
    }


    let txt = ['Primary', 'Secondary'];
    const txtOption2 = {font: '30px clementeRegular', align: 'center'};

    for (let x = 0; x < numPlayers * 2; x++) {
      let subtitle = new PIXI.extras.BitmapText(txt[x % 2], txtOption2);

      subtitle.x = this.offsetX + offset + x * (width / (2 * numPlayers)) + (width / (4 * numPlayers)) - (subtitle.width / 2);
      subtitle.y = this.offsetY - 50;
      subtitle.tint = tint;
      this.sprite.addChild(subtitle);
    }

  }

  /**
   * Barbarian Update
   */
  update() {

    const selectedIndex = this.menu.getSelectedIndex();
    if (selectedIndex < this.minView)
    {
      this.minView = selectedIndex;
      this.maxView = this.minView + this.numLines;

    } else if (selectedIndex > this.maxView) {

      this.maxView = selectedIndex;
      this.minView = this.maxView - this.numLines;
    }



    for (let x = 0; x < this.entries.length; x++) {

      let sprite = this.entries[x];

      if (x < this.minView || x > this.maxView)
      {
        sprite.visible = false;
        continue;
      }
      sprite.visible = true;

      const index = x - this.minView;

      sprite.y = this.offsetY + index * (this.lineHeight + this.margin);
      sprite.x = this.offsetX;
    }
  }

  handleModification(modification) {
    switch(modification.type) {
    case RESIZE:
      this.width = modification.width;
      this.height = modification.height;

      this.initConstants();
    }
  }
}

