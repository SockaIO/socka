/* global require */
'use strict';

import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';
import log from 'loglevel';

import {theme as interfaces} from '../../src/interfaces';
import {TM_W1, TM_W2, TM_W3, TM_W4, TM_W5, TM_MISS, TM_MINE, S_OK, S_NG, TIMING_TEXTS, RANK_TEXTS} from '../../src/constants/judge';
import {TAP_NOTE, FAKE_NOTE, ROLL_NOTE, MINE_NOTE, HOLD_NOTE, LIFT_NOTE, EVENT_NOTE_HIT, EVENT_NOTE_MISS, EVENT_NOTE_FINISH} from '../../src/constants/chart';

/*
 * The Theme class is responsible for laoding 
 * the assets that will be used by the different graphic components
 */

/**
 * Default Theme provided with the game
 *
 * @extends Theme
 */
export default class DefaultTheme extends interfaces.Theme {

  constructor() {

    super();

    // Must be modified manually
    this.resources = {
      arrows: require('./img/arrows.png'),
      mines: require('./img/mines.png'),
      hitMineExplosion: require('./img/hit_mine_explosion.png'),
      receptor: require('./img/receptor.png'),
      receptorFlash: require('./img/receptor_flash.png'),
      receptorGlow: require('./img/receptor_glow.png'),
      holdCap: require('./img/holdCap.png'),
      holdBody: require('./img/holdBody.png'),
      rollCap: require('./img/rollCap.png'),
      rollBody: require('./img/rollBody.png'),
      judgments: require('./img/judgments.png'),
      holdJudgments: require('./img/holdJudgments.png'),
      lifemeterOver: require('./img/lifemeterOver.png'),
      lifemeterMiddle: require('./img/lifemeterMiddle.png'),
      lifemeterUnder: require('./img/lifemeterUnder.png'),
      progressBarMiddle: require('./img/progressBarMiddle.png'),
      progressBarUnder: require('./img/progressBarUnder.png'),
      font: require('./img/font.xml'),
      fontImg: require('./img/font.png'),
      blank: require('./img/blank.png'),
    };

  }

  /**
   * Initialization of the theme
   * - Loas textures
   */
  doInit() {
    return this.loadTextures();
  }

  /**
   * Load the textures using PIXI
   *
   */
  loadTextures() {

    for (let r of Object.keys(this.resources)) {
      PIXI.loader.add(this.resources[r]);
    }

    return new Promise((resolve) => {
      PIXI.loader.load(resolve);
    }).then(() => {

      // Simple textures
      for (let r of Object.keys(this.resources)) {
        this.textures[r] = PIXI.loader.resources[this.resources[r]].texture;
      }

      // Arrows
      let arrowTextures = [];
      for (let x=0; x < 8; x++) {
        let texture = PIXI.loader.resources[this.resources['arrows']].texture.clone();
        texture.frame = new PIXI.Rectangle(0, x * 127, 128, 128);
        arrowTextures.push(texture);
      }
      this.textures['arrows'] = arrowTextures;

      // Mines 
      let mineTextures = [];
      for (let y = 0; y < 2; y++) {
        for (let x=0; x < 4; x++) {
          let texture = PIXI.loader.resources[this.resources['mines']].texture.clone();
          texture.frame = new PIXI.Rectangle(x * 127, y * 127, 128, 128);
          mineTextures.push(texture);
        }
      }
      this.textures['mines'] = mineTextures;

      // Judgments
      let judgmentTextures = {};
      let timings = [TM_W1, TM_W2, TM_W3, TM_W4, TM_W5, TM_MISS];
      for (let x=0; x < 6; x++) {
        let texture = PIXI.loader.resources[this.resources['judgments']].texture.clone();
        texture.frame = new PIXI.Rectangle(0, x * 32, 192, 32);
        judgmentTextures[timings.shift()] = texture;
      }
      this.textures['judgments'] = judgmentTextures;


      // Hold Judgments
      let holdJudgmentTextures = [];
      timings = [S_OK, S_NG];
      for (let x=0; x < 2; x++) {
        let texture = PIXI.loader.resources[this.resources['holdJudgments']].texture.clone();
        texture.frame = new PIXI.Rectangle(0, x * 32, 62, 32);
        holdJudgmentTextures[timings.shift()] = texture;
      }
      this.textures['holdJudgments'] = holdJudgmentTextures;

    });
  }

  /**
   * Get a texture by Name
   */
  getTexture(name) {
    // TODO: Catch error?
    return this.textures[name];
  }

  /**
   * Get the right texture for a judgment based on timing
   */
  getJudgmentTexture(timing) {
    return this.getTexture('judgments')[timing];
  }

  /**
   * Get the right texture for an hold note judgment based on timing
   */
  getHoldJudgmentTexture(timing) {
    return this.getTexture('holdJudgments')[timing];
  }

  /**
   * Get the texture for a type of note
   */
  getNoteTexture(note) {

    switch(note.type) {
    case TAP_NOTE:
    case FAKE_NOTE:
    case HOLD_NOTE:
    case ROLL_NOTE:
      return this.getTexture('arrows')[note.division];
    case MINE_NOTE:
      return this.getTexture('mines')[0];
    case LIFT_NOTE:
      // TODO
      break;
    }

  }

  /**
   * Create Simple Note Graphic Component
   */
  createSimpleNoteGC() {
    return new SimpleNoteDefaultGraphicComponent(this);
  }

  /**
   * Create Long Note Graphic Component
   */
  createLongNoteGC() {
    return new LongNoteDefaultGraphicComponent(this);
  }

  /**
   * Create Receptor Note Graphic Component
   */
  createReceptorGC() {
    return new ReceptorDefaultGraphicComponent(this);
  }

  /**
   * Create Pause Graphic Component
   */
  createPauseGC(...args) {
    return new PauseDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Results Graphic Component
   */
  createResultsGC(...args) {
    return new ResultsDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Menu Graphic Component
   */
  createMenuGC(...args) {
    return new MenuFancyGraphicComponent(this, ...args);
  }

  /**
   * Create Song Menu Graphic Component
   */
  createSongMenuGC(...args) {
    return new SongMenuDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Engine Graphic Component
   */
  createEngineGC(...args) {
    return new EngineDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Judgment Graphic Component
   */
  createJudgmentGC() {
    return new JudgmentDefaultGraphicComponent(this);
  }

  /**
   * Create Score Graphic Component
   */
  createScoreGC() {
    return new ScoreDefaultGraphicComponent(this);
  }

  /**
   * Create Combo Graphic Component
   */
  createComboGC() {
    return new ComboDefaultGraphicComponent(this);
  }

  /**
   * Create Lifemeter Graphic Component
   */
  createLifemeterGC() {
    return new LifemeterDefaultGraphicComponent(this);
  }

  /**
   * Create Progression Bar Graphic Component
   */
  createProgressionBarGC() {
    return new ProgressionBarDefaultGraphicComponent(this);
  }

  /**
   * Create Envine View Graphic Component
   */
  createEngineViewGC(...args) {
    return new EngineViewGraphicComponent(this, ...args);
  }


  /**
   * Create Loasing View Graphic Component
   */
  createLoadingViewGC(...args) {
    return new LoadingViewDefaultGraphicComponent(this, ...args);
  }

}

DefaultTheme.angleMap = [1, 0, 2, 3].map((x) => 2 * x * Math.PI / 4);


/**
 * Simple Note GC
 */
class SimpleNoteDefaultGraphicComponent extends interfaces.SimpleNoteGraphicComponent {

  constructor(theme) {
    super(theme);
    this.fadeout = 0.2;
  }

  /**
   * Scale the note
   */
  resize(scale) {
    this.sprite.scale.x = scale;
    this.sprite.scale.y = scale;
  }

  create() {
    let c = new PIXI.Container();

    // Create the sprite
    let arrow = new PIXI.Sprite(this.theme.getNoteTexture(this.note));

    arrow.anchor.x = 0.5;
    arrow.anchor.y = 0.5;

    c.addChild(arrow);

    if (this.note.type === MINE_NOTE) {
      arrow._startRotation = new Date();
      Object.defineProperty(arrow, 'rotation', {
        get: function () {
          return (new Date() - arrow._startRotation)/500;
        }
      });
    } else {
      arrow.rotation = DefaultTheme.angleMap[this.note.direction];
    }

    this.sprite = c;
  }

  remove() {
    if (this.sprite.parent !== null) {
      this.sprite.parent.removeChild(this.note.sprite);
    }
    this.sprite.destroy(); 
  }

  dodge() {
    TweenLite.to(this.sprite, this.fadeout, {alpha: 0});
  }

  miss() {
    // No feedback
  }

  hit(timing) {
    if (this.note.type === MINE_NOTE) {

      let explosion = new PIXI.Sprite(this.theme.getTexture('hitMineExplosion'));
      explosion.anchor.x = 0.5;
      explosion.anchor.y = 0.5;
      this.sprite.removeChildAt(0);
      this.sprite.addChild(explosion);

      TweenLite.to(this.sprite, this.fadeout, {alpha: 0});
    }

    // We hide the note only in the best 3 timings
    if ([TM_W1, TM_W2, TM_W3].includes(timing)) {
      TweenLite.to(this.sprite, this.fadeout, {alpha: 0});
    }
  }
}

class ReceptorDefaultGraphicComponent extends interfaces.ReceptorGraphicComponent {

  constructor(theme) {
    super(theme);
    this.flashDuration = 0.2;
    this.judgmentDuration = 0.8;
    this.glowDuration = 0.4;
  }

  create(width) {

    let c = new PIXI.Container();
    let d = new PIXI.Container();
    this.notes = [];
    this.glows = [];

    this.judgments = [];
    this.judgmentTweens = {};

    let offset = width / 5;
    let texture = this.theme.getTexture('receptor');
    let textureFlash = this.theme.getTexture('receptorFlash');
    let scale = offset / texture.frame.width;

    this.flashMinScale = scale;
    this.flashMaxScale = scale * 1.3;
    this.noteMinScale = scale * 0.8;
    this.noteScale = scale;

    for (let x=0; x < 4; x++) {

      let noteC = new PIXI.Container();
      let note = new PIXI.Sprite(texture);

      let flash = new PIXI.Sprite(textureFlash);
      flash.alpha = 0;

      noteC.addChild(flash);
      noteC.addChild(note);

      for (let n of noteC.children) {
        n.anchor.x = 0.5;
        n.anchor.y = 0.5;
        n.rotation = DefaultTheme.angleMap[x];
        n.scale.x = scale;
        n.scale.y = scale;
      }

      noteC.x = (x + 1) * offset;
      c.addChild(noteC);
      this.notes.push(noteC);

      // Glow
      let glow = new PIXI.Sprite(this.theme.getTexture('receptorGlow'));
      glow.anchor.x = 0.5;
      glow.anchor.y = 0.5;
      glow.rotation = DefaultTheme.angleMap[x];
      glow.scale.x = scale;
      glow.scale.y = scale;
      glow.x = (x + 1) * offset;
      glow.alpha = 0;

      d.addChild(glow);
      this.glows.push(glow);

      // Create the judgment
      let j = new PIXI.Sprite(this.theme.getHoldJudgmentTexture(S_OK));
      j.anchor.x = 0.5;
      j.anchor.y = 0.5;
      j.y = note.height;
      j.x = (x + 1) * offset;
      j.alpha = 0;

      d.addChild(j);

      this.judgments.push(j);
      this.judgmentTweens[x] = null;

    }

    this.background = c;
    this.foreground = d;
  }

  tap(direction) {

    let arrow = this.notes[direction];
    let flash = arrow.children[0];
    let note = arrow.children[1];

    TweenLite.killTweensOf(flash);
    TweenLite.killTweensOf(flash.scale);
    flash.scale = {x: this.flashMinScale, y: this.flashMinScale};
    flash.alpha = 1;

    note.scale = {x: this.noteMinScale, y: this.noteMinScale};
    TweenLite.to(note.scale, this.flashDuration, {x: this.noteScale, y: this.noteScale});
  }

  lift(direction) {

    let arrow = this.notes[direction];
    let flash = arrow.children[0];

    TweenLite.to(flash.scale, this.flashDuration, {x: this.flashMaxScale, y: this.flashMaxScale});
    TweenLite.to(flash, this.flashDuration, {alpha: 0});
  }


  remove() {
    if (this.sprite.parent !== null) {
      this.sprite.parent.removeChild(this.note.sprite);
    }
    this.sprite.destroy(); 
  }

  holdJudge(note, timing) {

    let sprite = this.judgments[note.direction];
    sprite.texture = this.theme.getHoldJudgmentTexture(timing);
    sprite.alpha = 1;

    if (this.judgmentTweens[note.direction] !== null) {
      this.judgmentTweens[note.direction].kill();
    }

    this.judgmentTweens[note.direction] = TweenLite.to(sprite, this.judgmentDuration, {alpha: 0, ease: 'bounce'});
  }

  glow(note, timing) {

    // TODO: Different color based on timing
    let tint = 0x8800ff;
    timing;

    let glow = this.glows[note.direction];
    glow.alpha = 0.7;
    glow.tint = tint;

    TweenLite.to(glow, this.glowDuration, {alpha: 0});

  }
}

class LongNoteDefaultGraphicComponent extends interfaces.LongNoteGraphicComponent {

  constructor(theme) {
    super(theme);
  }

  getTextures() {

    switch(this.note.type) {
    case ROLL_NOTE:
      return [this.theme.getTexture('rollBody'), this.theme.getTexture('rollCap')];
    case HOLD_NOTE:
      return [this.theme.getTexture('holdBody'), this.theme.getTexture('holdCap')];
    }

    return;
  }

  // The note sticks in the receptor and the length decreases
  stick(beat, multiplier) {

    let duration = this.note.duration - beat + this.note.step.beat;

    this.sprite.y = beat * multiplier;

    this.sprite.children[1].y = duration * multiplier;
    this.sprite.children[0].height = duration * multiplier;
  }

  resize(scale, multiplier) {

    this.sprite.children[2].scale.x = scale;
    this.sprite.children[2].scale.y = scale;
    this.sprite.children[1].scale.x = scale;
    this.sprite.children[1].scale.y = scale;
    this.sprite.children[0].scale.x = scale;

    this.sprite.children[1].y = this.note.duration * multiplier;
    this.sprite.children[0].height = this.note.duration * multiplier;
  }

  create() {

    // legngth is taken care of later when  resize is called
    let length = 0;

    let c = new PIXI.Container();

    let arrow = new PIXI.Sprite(this.theme.getNoteTexture(this.note));
    let bodyTexture, capTexture;

    [bodyTexture, capTexture] = this.getTextures();

    // Tiling sprites are just too fucking slow to create
    let body = new PIXI.Sprite(bodyTexture);
    let cap = new PIXI.Sprite(capTexture);

    arrow.anchor.x = 0.5;
    arrow.anchor.y = 0.5;

    arrow.rotation = DefaultTheme.angleMap[this.note.direction];

    cap.anchor.x = 0.5;
    cap.anchor.y = 0;

    cap.y = length;

    body.anchor.x = 0.5;
    body.anchor.y = 0;

    body.height = length;

    c.addChild(body); 
    c.addChild(cap); 
    c.addChild(arrow); 

    this.sprite = c;

  }

  setLength(length) {
    this.sprite.children[0].height = length;
    this.sprite.children[1].y = length;
  }

  remove() {
    if (this.sprite.parent !== null) {
      this.sprite.parent.removeChild(this.note.sprite);
    }
    this.sprite.destroy({children: true}); 
  }

  deactivate() {
    for (let child of this.sprite.children) {
      child.tint = 0xaaaaaa;
    }
  }

  finish() {
    TweenLite.to(this.sprite, this.fadeout, {alpha: 0});
  }

}

class MenuDefaultGraphicComponent extends interfaces.MenuGraphicComponent {

  constructor(theme, width, height, menu) {
    super(theme);

    // Engine Container
    this.height = height;
    this.width = width;
    this.menu = menu;

    this.createMainSprite();
    this.createEntries(menu.entries);

    this.textHoverOptions = {
      fontFamily : 'bold Arial',
      fontSize: 24,
      fill : 0xffff11,
      align : 'center'
    };

    this.textOptions = {
      fontFamily : 'Arial',
      fontSize: 24,
      fill : 0xff1010,
      align : 'center'
    };

    this.theme = theme;

    this.placeEntries();
    this.handleMouse();
  }

  createEntries(entries) {

    this.spritesMapping = new WeakMap();
    this.entries = [];

    let i = 0;
    for (let entry of entries) {

      let sprite = new PIXI.Text(entry.name);
      this.spritesMapping.set(sprite, i);

      this.entries.push({
        sprite,
        entry,
        index: i++
      });
    }
  }

  createMainSprite() {
    this.sprite = new PIXI.Container();

    this.background = new PIXI.Container();
    this.foreground = new PIXI.Container();

    this.sprite.addChild(this.background);
    this.sprite.addChild(this.foreground);
  }

  update() {
    for (let sprite of this.entries) {
      if (sprite.index === this.menu.selectedEntry) {
        sprite.sprite.style = this.textHoverOptions;
      } else {
        sprite.sprite.style = this.textOptions;
      }
    }
  }

  placeEntries() {
    let y = this.yText;
    //let marginX = 20;

    for (let entry of this.entries) {

      entry.sprite.y = y;
      this.foreground.addChild(entry.sprite);
      y += entry.sprite.height;
    }
  }

  get textSize() {
    return this.entries[0].sprite.height * this.entries.length;
  }

  get yText() {
    return this.height/2 - this.textSize/2;
  }

  * sprites() {
    for (let e of this.entries) {
      yield(e.sprite);
    }
  }

  handleMouse() {
    for (let sprite of this.sprites()) {
      sprite.interactive = true;

      sprite.mouseup = sprite.tap = (m) => {
        this.mouseup(this.spritesMapping.get(m.target));
      };

      sprite.mouseover = (m) => {
        this.mouseover(this.spritesMapping.get(m.target));
      };
    }
  }

  mouseup(entryIndex) {
    if (entryIndex !== undefined) {
      this.menu.entries[entryIndex].action();
    }
  }

  mouseover(entryIndex) {
    this.menu.selectedEntry = entryIndex;
  }
}


class EngineDefaultGraphicComponent {

  constructor(theme, width, height, fieldView) {

    // Engine Container
    this.height = height;
    this.width = width;

    // Field related info
    this.fieldYProportion = 0.85;

    this.fieldWidth = width;
    this.fieldHeight = this.fieldYProportion * height;
    this.fieldView = fieldView;

    this.theme = theme;

    this.createMainSprite();

    this.createField();
    this.createReceptor();
    this.createJudgment();

    this.stickyNotes = new Set();
  }

  createMainSprite() {
    this.sprite = new PIXI.Container();

    this.background = new PIXI.Container();
    this.foreground = new PIXI.Container();

    this.sprite.addChild(this.background);
    this.sprite.addChild(this.foreground);

  }

  createField() {

    // Create the container
    this.field = new PIXI.Container();
    this.field.width = this.fieldWidth;
    this.field.height = this.fieldHeight;
    this.field.y = this.height - this.fieldHeight;
    this.background.addChild(this.field);

    this.multiplier = this.fieldHeight / this.fieldView;

    this.fieldBackground = new PIXI.Container();
    this.fieldForeground = new PIXI.Container();

    this.field.addChild(this.fieldBackground);
    this.field.addChild(this.fieldForeground);
  }

  // Craete the Note stream
  createStream(steps) {

    this.stream = new PIXI.Container();

    let offset = this.fieldWidth / 5;
    let scale = 0;

    for (let step of steps) {
      for (let note of step.notes) {

        if (scale === 0) {
          scale = offset / note.sprite.width;
        }

        note.graphicComponent.resize(scale, this.multiplier);
        note.sprite.x = (parseInt(note.direction, 10) + 1) * offset;
        note.sprite.y = step.beat * this.multiplier;

        this.stream.addChild(note.sprite);
      }
    }

    this.fieldBackground.addChild(this.stream);
  }

  createReceptor() {
    this.receptor = this.theme.createReceptorGC();
    this.receptor.create(this.fieldWidth);
    this.fieldBackground.addChild(this.receptor.background);
    this.fieldForeground.addChild(this.receptor.foreground);
  }

  update(beat) {

    for (let note of this.stickyNotes) {
      note.stick(beat, this.multiplier);
    }

    this.stream.y = -1 * beat * this.multiplier;
  }

  createJudgment() {
    this.judgment = this.theme.createJudgmentGC();
    this.judgment.create(this.fieldWidth, this.fieldHeight);
    this.foreground.addChild(this.judgment.sprite);
    this.judgment.sprite.x = this.width / 2;
    this.judgment.sprite.y = this.height / 2;
  }

  // Get the score graphic Component
  placeScore(sprite) {
    this.foreground.addChild(sprite);
    sprite.anchor.x = 0.5;
    sprite.x = this.fieldWidth / 2;
    sprite.y = this.height - 50;
  }

  placeCombo(sprite) {
    this.foreground.addChild(sprite);
    sprite.anchor.x = 0.5;
    sprite.x = this.fieldWidth / 2;
    sprite.y = this.height - 200;
  }

  placeLifemeter(sprite) {
    this.foreground.addChild(sprite);
    sprite.x = (this.fieldWidth / 2) - (sprite.width / 2);
    sprite.y = 0;
  }

  placeProgressionBar(sprite) {
    this.foreground.addChild(sprite);
    sprite.x = 0;
    sprite.y = (this.height / 2) - (sprite.height / 2);
  }


  // We prosses the event in case some
  // more complicated stuff need to be added
  feedback(ev) {

    switch (ev.type) {
    case EVENT_NOTE_MISS:
      this.judgment.show(ev.timing);
      break;
    case EVENT_NOTE_HIT:
      this.judgment.show(ev.timing);
      this.receptor.glow(ev.note, ev.timing);

      // handle the Long Note Stickyness
      if (ev.note.duration > 0) {
        this.stickyNotes.add(ev.note.graphicComponent);
      }
      break;
    case EVENT_NOTE_FINISH:
      this.receptor.holdJudge(ev.note, ev.timing);

      // Remove the sticky note
      if (ev.note.duration > 0) {
        this.stickyNotes.delete(ev.note.graphicComponent);
      }
      break;
    }
  }
}

class JudgmentDefaultGraphicComponent {

  constructor(theme) {
    this.theme = theme;
  }

  create() {

    // We keep the current timing not to reload texture uselessly
    this.timing = TM_W1;

    this.sprite = new PIXI.Sprite(this.theme.getJudgmentTexture(this.timing));
    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 0.5;

    this.sprite.alpha = 0;

    this.duration = 0.1;
  }

  show(timing) {

    if (timing === TM_MINE) {
      return;
    }

    if (timing === this.timing) {
      this.sprite.alpha = 0.3;
      this.sprite.scale.x = 0.5;
      this.sprite.scale.y = 0.5;
    } else {
      this.timing = timing;
      this.sprite.alpha = 0;
      this.sprite.scale.x = 0.1;
      this.sprite.scale.y = 0.1;
      this.sprite.texture = this.theme.getJudgmentTexture(timing);
    }

    this.tween = TweenLite.to(this.sprite, this.duration, {alpha: 1});
    this.tween = TweenLite.to(this.sprite.scale, this.duration, {x: 1, y: 1});
  }
}

class ScoreDefaultGraphicComponent {

  constructor() {
    this.sprite = new PIXI.extras.BitmapText('',{font : '24px font', align : 'center'});
    this.update(0);
  }

  update(score) {
    this.sprite.text = this.formatScoreText(score);
  }

  formatScoreText(value) {

    let text = '' + value;
    let output = '';
    let len = text.length;
    let x;

    for (x=len - 3; x > 0; x-=3) {
      output = text.slice(x, x + 3) + ' ' + output;
    }

    x += 3;
    output = text.slice(0, x) + ' ' + output;
    output = output.slice(0, -1);

    while (output.length < 11) {
      if (output.length % 4 === 3) {
        output = ' ' + output;
      } else {
        output = '0' + output;
      }
    }

    return output;
  }
}

class ComboDefaultGraphicComponent {

  constructor() {
    this.sprite = new PIXI.extras.BitmapText('Combo',{font : '24px font', align : 'center'});
    this.update(0);
  }

  update(combo) {
    this.sprite.text = this.formatComboText(combo);
  }

  formatComboText(value) {

    let output = '';

    if (value > 1) {
      output += value + ' Combo';
    }

    return output;
  }
}

class ProgressionBarDefaultGraphicComponent {
  constructor(theme) {
    this.theme = theme;

    this.sprite = new PIXI.Container();

    this.receptor = new PIXI.Sprite(theme.getTexture('progressBarUnder'));
    this.receptor.width = 10;
    this.receptor.height = 400;

    this.bar = new PIXI.Sprite(theme.getTexture('progressBarMiddle'));
    this.bar.x = this.receptor.x + 1;
    this.bar.y = this.receptor.y + 1;
    this.bar.width = this.receptor.width - 2;
    this.bar.height = 0;

    this.sprite.addChild(this.receptor);
    this.sprite.addChild(this.bar);
  }

  update(progression) {
    this.bar.height = (this.receptor.height - 2) * progression;
  }
}

class LifemeterDefaultGraphicComponent {

  constructor(theme) {

    this.theme = theme;
    this.sprite = new PIXI.Container();

    this.sprite.addChild(new PIXI.Sprite(theme.getTexture('lifemeterUnder')));
    this.bar = new PIXI.Sprite(theme.getTexture('lifemeterMiddle'));
    this.sprite.addChild(this.bar);
    this.sprite.addChild(new PIXI.Sprite(theme.getTexture('lifemeterOver')));

    this.bar.x = 5;
    this.bar.y = 5;
    this.bar.scale.y = 1.7;

    this.changing = false;
    this.target = 0;
    this.current = 0;
    this.tweenDuration = 0.2;
  }

  update(fraction) {
    if (this.changing === false) {
      this.target = fraction;
      this.doUpdate();
    } else {
      this.target = fraction;
    }
  }

  doUpdate() {

    this.current = this.target;
    this.changing = true;

    TweenLite.to(this.bar.scale, this.tweenDuration, {x: this.current, ease: 'bounce', onComplete: () => {
      if (this.target !== this.current) {
        this.doUpdate();
      } else {
        this.changing = false;
      }
    }});
  }

}

/**
 * Engine view simple graphic Component
 */
class EngineViewGraphicComponent {

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


/**
 * Fancy Menu
 */

class MenuFancyGraphicComponent extends interfaces.MenuGraphicComponent {

  constructor(theme, width, height, menu) {
    super(theme);

    // Engine Container
    this.height = height;
    this.width = width;
    this.menu = menu;

    this.createMainSprite();

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
      let sprite = new PIXI.extras.BitmapText(entry.name, {font: this.lineHeight + 'px font', align: 'center'});
      sprite.x = this.width/2 - sprite.width / 2;
      //sprite.anchor.x = 0.5;
      sprite.anchor.y = 0.5;
      this.foreground.addChild(sprite);
      this.entries.push(sprite);
    }
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
      sprite.x = this.width/2 - sprite.width / 2;
    }

    let selected = this.entries[this.menu.selectedEntry];
    selected.scale = {x:2, y:2};
    selected.x = this.width/2 - selected.width / 2;
    selected.y = this.origin;

  }
}

class LoadingViewDefaultGraphicComponent extends interfaces.LoadingViewGraphicComponent{

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
    this.background.tint = 0x1099bb;

    this.textSprite = new PIXI.Text(this._text, {font : '24px Arial', fill : 0xffffff, align : 'center'});
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

/**
 * Pause
 */
class PauseDefaultGraphicComponent extends interfaces.PauseGraphicComponent {

  constructor(theme, width, height) {
    super(theme);
    this.width = width;
    this.height = height;

    this.sprite = new PIXI.Container();

    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0xff0000, 0.5);
    this.overlay.drawRect(0, 0, width, height);
    this.overlay.endFill();

    this.sprite.addChild(this.overlay);
  }
}


/**
 * Song Menu
 */

class SongMenuDefaultGraphicComponent extends interfaces.MenuGraphicComponent {

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
      let sprite = new PIXI.extras.BitmapText(entry.name, {font: this.lineHeight + 'px font', align: 'center'});
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
        let sprite = new PIXI.extras.BitmapText(c.difficulty, {font: 30 + 'px font', align: 'center'});
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

/**
 * Results
 */
class ResultsDefaultGraphicComponent extends interfaces.ResultsGraphicComponent {

  constructor(theme, width, height, background, banner, results) {
    super(theme);
    this.width = width;
    this.height = height;

    this.results = results;

    this.sprite = new PIXI.Container();

    // Decoration
    this.sprite.addChild(this.drawBackground(background));
    this.sprite.addChild(this.drawTitleBar());
    this.sprite.addChild(this.drawBanner(banner));


    // Data
    this.sprite.addChild(this.drawStats());

  }

  drawStats() {

    let container = new PIXI.Container();

    let count = 0;

    for (let r of this.results) {

      let playerResults = this.getPlayerResults(r);

      playerResults.x = this.width / ( 2 * this.results.length) - playerResults.width / 2 + count++ * this.width / (this.results.length);
      playerResults.y = 300;

      container.addChild(playerResults);
    }

    return container;

  }

  getPlayerResults(result) {

    let container = new PIXI.Container();

    let nameSprite = new PIXI.extras.BitmapText(result.player.name, {font: 40 + 'px font', align: 'left'});
    container.addChild(nameSprite);

    let rankSprite = new PIXI.extras.BitmapText(RANK_TEXTS[result.rank], {font: 40 + 'px font', align: 'left'});
    rankSprite.y = 50;
    rankSprite.x = 20;
    container.addChild(rankSprite);

    let text = this.getText(result);
    let textSprite = new PIXI.extras.BitmapText(text, {font: 25 + 'px font', align: 'left'});
    textSprite.y = 100;

    container.addChild(textSprite);

    let score = new PIXI.extras.BitmapText('Score: ' + result.score, {font: 40 + 'px font', align: 'left'});
    container.addChild(score);

    score.y = 350;

    return container;

  }

  getText(result) {

    let output = '';

    for (let [t, count] of result.stats.timings) {
      output += TIMING_TEXTS[t] + ': ' + count + '\n';
    }

    output += 'Held: ' + result.stats.held + '\n';
    output += 'Max Combo: ' + result.combo;

    return output;

  }

  drawBanner(texture) {

    let container = new PIXI.Container();

    this.banner = new PIXI.Sprite();
    container.addChild(this.banner);

    texture.then((texture) => {
      this.banner.texture = texture;

      this.banner.x = this.width / 2 - this.banner.width / 2;
      this.banner.y = 100;
    });

    return container;
  }



  drawBackground(texture) {

    let container = new PIXI.Container();

    this.background = new PIXI.Sprite();
    this.background.height = this.height;
    this.background.width = this.width;

    container.addChild(this.background);

    texture.then((texture) => {
      this.background.texture = texture;
    });

    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x000000, 0.5);
    this.overlay.drawRect(0, 0, this.width, this.height);
    this.overlay.endFill();

    container.addChild(this.overlay);

    return container;
  }

  drawTitleBar() {

    let container = new PIXI.Container();

    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x000000, 0.5);
    this.overlay.drawRect(0, 0, this.width, 70);
    this.overlay.endFill();

    container.addChild(this.overlay);

    let text = new PIXI.extras.BitmapText('Your Results', {font: 40 + 'px font', align: 'center'});
    text.x = 20;
    text.y = 20;
    container.addChild(text);

    return container;

  }
}


