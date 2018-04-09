'use strict';

import * as PIXI from 'pixi.js';
import {TweenLite} from 'gsap';

import {theme as interfaces} from '../../src/interfaces';

import {MENU_MAIN, MENU_OPTION, MENU_OPTION_MAPPING, MENU_CHART} from '../../src/constants/resources';
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
      let sprite = entry.createGraphicComponent(this.width, this.lineHeight).sprite;
      sprite.x = this.width/2 - sprite.width / 2;
      this.foreground.addChild(sprite);
      this.entries.push(sprite);
    }
  }

  createMainSprite() {
    this.sprite = new PIXI.Container();
    this.background = new PIXI.Container();

    if (this.menu.id === MENU_MAIN) {
      this.background = new PIXI.Sprite(this.theme.getTexture('bgMain'));
      this.background.width = this.width;
      this.background.height = this.height;
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

      this.background.width = modification.width;
      this.background.height = modification.height;

      this.initConstants();
    }
  }
}

/**
 * Song Menu
 */

export class SongMenu2DefaultGraphicComponent extends interfaces.MenuGraphicComponent {

  constructor (theme, width, height, view) {
    super(theme);

    this.height = height;
    this.width = width;

    this.songMenu = view.songMenu;
    this.chartMenu = view.chartMenu;

    this.sprite = new PIXI.Container();

    this.background = new PIXI.Sprite(this.theme.getTexture('bgBlank'));
    this.background.width = this.width;
    this.background.height = this.height;
    this.sprite.addChild(this.background);

    this.sprite.addChild(this.songMenu.sprite);
    this.sprite.addChild(this.chartMenu.sprite);

    this.createBanner();
    this.createLetterBox();
    this.createTitle();

    // Position the Elements
    this.chartMenu.sprite.x = width / 2;
  }

  updateChartMenu() {
    this.chartMenu.sprite.y = this.height / 3;
  }

  createTitle(text='Select Song') {
    const format = {font: '40px clementeRegular'};
    this.title = new PIXI.extras.BitmapText(text, format);

    this.topBox.addChild(this.title);
    this.title.x = 40;
    this.title.y = this.topBox.height / 2 - this.title.height / 2;
    this.title.tint = 0xfff893;
  }

  createLetterBox(height=80) {
    this.topBox = new PIXI.Graphics();
    this.topBox.beginFill(0x111111, 0.7);
    this.topBox.drawRect(0, 0, this.width, height);
    this.topBox.endFill();
    this.sprite.addChild(this.topBox);

    this.bottomBox = new PIXI.Graphics();
    this.bottomBox.beginFill(0x111111, 0.7);
    this.bottomBox.drawRect(0, 0, this.width, height);
    this.bottomBox.endFill();
    this.bottomBox.y = this.height - height;
    this.sprite.addChild(this.bottomBox);
  }

  createBanner() {
    this.bannerContainer = new PIXI.Container();
    this.sprite.addChild(this.bannerContainer);

    this.banner = new PIXI.Sprite();
    this.banner.width = this.width / 2 * 0.75;
    this.bannerContainer.x = this.width / 2 * 1.5 - this.banner.width / 2;
    this.bannerContainer.y = 100;

    this.bannerContainer.addChild(this.banner);
  }

  setBanner(banner) {
    if (this.banner !== undefined && banner !== undefined) {
      this.banner.texture = banner;

      if (this.bannerBorder !== undefined) {
        this.bannerContainer.removeChild(this.bannerBorder);
        this.bannerBorder = undefined;
      }

      this.bannerBorder = new PIXI.Graphics();
      const thick = 1;
      this.bannerBorder.lineStyle(thick, 0xffffff)
                 .moveTo(thick, thick)
                 .lineTo(thick, this.banner.height - thick)
                 .lineTo(this.banner.width - thick, this.banner.height - thick)
                 .lineTo(this.banner.width - thick, thick)
                 .lineTo(thick, thick),
      this.bannerContainer.addChild(this.bannerBorder);


    }
  }

  update() {
    this.songMenu.update();
    this.chartMenu.update();
  }

}

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

    this.lineHeight = this.height * 0.045; // Empirical
    this.margin = 10;

    this.specializePre();

    this.createMainSprite();
    this.createEntries(menu.getEntries());

    this.initConstants();
    this.theme = theme;

    this.specializePost();

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
      let sprite = entry.createGraphicComponent(this.width, this.lineHeight).sprite;
      this.foreground.addChild(sprite);
      this.entries.push(sprite);
      sprite.visible = false;
    }
  }

  updateEntries() {

    // Remove the old entries
    for (let e of this.entries) {
      this.foreground.removeChild(e);
    }

    // Create the new ones
    this.createEntries(this.menu.getEntries());
  }

  createMainSprite() {
    this.sprite = new PIXI.Container();

    this.background = new PIXI.Container();
    this.foreground = new PIXI.Container();

    if (this.menu.id === MENU_OPTION || this.menu.id === MENU_OPTION_MAPPING) {

      if (this.menu.useBackground === true) {
        this.background = new PIXI.Sprite(this.theme.getTexture('bgMain'));
        this.background.width = this.width;
        this.background.height = this.height;
      } else {
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x111111, 0.8);
        this.background.drawRect(0, 0, this.width, this.height);
        this.background.endFill();
      }
    }

    this.sprite.addChild(this.background);
    this.sprite.addChild(this.foreground);
  }

  specializePre() {
    if (this.menu.id === MENU_CHART) {
      this.lineHeight = 50;
      this.margin = 5;
    }
  }

  specializePost() {
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

      this.background.width = modification.width;
      this.background.height = modification.height;

      this.initConstants();
    }
  }
}

// TODO: Factor with the Menu Class
export class SongMenu3DefaultGraphicComponent extends interfaces.MenuGraphicComponent {

  constructor(theme, width, height, menu) {
    super(theme);

    const marginX = 50;
    const marginY = 100;

    // Engine Container
    this.height = height - marginY;
    this.width = width - marginX;
    this.menu = menu;

    this.createMainSprite();
    this.sprite.x += marginX / 2;
    this.sprite.y += marginY / 2;

    this.initConstants();

    // Parameters
    this.transitionDuration = 0.25;
    this.amplificationY = (distance) => {
      if (distance === 0) {
        return 1.5;
      }
      return 1;
    };

    this.amplificationX = (distance) => {
      return 1 - Math.abs(distance * 0.05);
    };

    this.alpha = (distance) => {
      return 1 - Math.abs(distance) * 0.1;
    };

    this.createEntries(menu.getEntries());
    this.theme = theme;
  }

  initConstants() {
    // Usefull constants
    this.lineHeight = 75;
    this.margin = 0;
    this.numLines = (this.height / 2) / (this.lineHeight + this.margin) - 1;
    this.origin = this.height / 2;
  }

  createEntries(entries) {

    this.entries = [];

    for (let entry of entries) {
      let gc = entry.createGraphicComponent(this.width, this.lineHeight);
      gc.sprite.x = this.width/2 - gc.sprite.width / 2;
      this.foreground.addChild(gc.sprite);
      this.entries.push(gc);
    }
  }

  createMainSprite() {
    this.sprite = new PIXI.Container();
    this.background = new PIXI.Container();

    if (this.menu.id === MENU_MAIN) {
      this.background = new PIXI.Sprite(this.theme.getTexture('bgMain'));
      this.background.width = this.width;
      this.background.height = this.height;
    }
    this.foreground = new PIXI.Container();

    this.sprite.addChild(this.background);
    this.sprite.addChild(this.foreground);
  }

  // Returns the Position + Scale
  getPosition(distance, sprite) {

    // Center on the origin line
    let newY = this.origin - sprite.height / 2;

    for (let x = 0; x < Math.abs(distance); x++) {
      newY += Math.sign(distance) * (this.lineHeight * (this.amplificationY(x) + this.amplificationY(x + 1)) / 2 + this.margin);
    }

    const newScaleX = this.amplificationX(distance);
    const newScaleY = this.amplificationY(distance);
    const newAlpha = this.alpha(distance);

    let newX = this.width/2 - sprite.width / 2;

    return {
      x: newX,
      y: newY,
      scale: {x: newScaleX, y: newScaleY},
      alpha: newAlpha
    };
  }

  /**
   * Barbarian Update
   */
  update() {

    const selectedIndex = this.menu.getSelectedIndex();

    for (let x = 0; x < this.entries.length; x++) {

      let gc = this.entries[x];
      let sprite = gc.sprite;
      let distance = x - selectedIndex;

      // Not displayed
      if (Math.abs(distance) > this.numLines) {
        sprite.visible = false;
      } else {
        sprite.visible = true;
      }

      if (Math.abs(distance) > this.numLines + 1) {
        continue;
      }

      let newPosition = this.getPosition(distance, sprite);

      TweenLite.to(sprite, this.transitionDuration, {y: newPosition.y});
      gc.setScale(newPosition.scale, this.transitionDuration);

      sprite.x = newPosition.x;
      sprite.alpha = newPosition.alpha;
    }
  }

  handleModification(modification) {
    switch(modification.type) {
    case RESIZE:
      this.width = modification.width;
      this.height = modification.height;

      this.background.width = modification.width;
      this.background.height = modification.height;

      this.initConstants();
    }
  }
}
