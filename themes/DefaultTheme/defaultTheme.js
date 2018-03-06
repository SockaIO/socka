/* global require */
'use strict';

import * as PIXI from 'pixi.js';

import {theme as interfaces} from '../../src/interfaces';
import {TM_W1, TM_W2, TM_W3, TM_W4, TM_W5, TM_MISS, S_OK, S_NG} from '../../src/constants/judge';
import {TAP_NOTE, FAKE_NOTE, ROLL_NOTE, MINE_NOTE, HOLD_NOTE, LIFT_NOTE} from '../../src/constants/chart';

import {
  SimpleNoteDefaultGraphicComponent,
  LongNoteDefaultGraphicComponent,
  ReceptorDefaultGraphicComponent
} from './note';

import {
  EngineDefaultGraphicComponent,
  JudgmentDefaultGraphicComponent,
  ScoreDefaultGraphicComponent,
  LifemeterDefaultGraphicComponent,
  ProgressionBarDefaultGraphicComponent,
  ComboDefaultGraphicComponent
} from './engine';

import {
  MenuDefaultGraphicComponent,
  SongMenuDefaultGraphicComponent,
  SongMenu2DefaultGraphicComponent,
  SongMenu3DefaultGraphicComponent,
  OptionMenuDefaultGraphicComponent
} from './menu';

import {
  TextMenuItemDefaultGraphicComponent,
  SongMenuItemDefaultGraphicComponent,
  ChartMenuItemDefaultGraphicComponent,
  MappingMenuItemDefaultGraphicComponent,
  InputMenuItemDefaultGraphicComponent,
  EnumMenuItemDefaultGraphicComponent,
  MenuItemSelectorDefaultGraphicComponent,
  MenuItemHighlighterDefaultGraphicComponent,
  ChartMenuItemHighlighterDefaultGraphicComponent
} from './menuItem';

import {PauseDefaultGraphicComponent} from './pause';
import {EngineViewDefaultGraphicComponent} from './engineView';
import {LoadingViewDefaultGraphicComponent} from './loadingView';
import {WaitViewDefaultGraphicComponent} from './waitView';
import {ResultsDefaultGraphicComponent} from './results';
import {NotificationDefaultGraphicComponent} from './notification';

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
      progressBarLeft: require('./img/progressBarLeft.png'),
      progressBarRight: require('./img/progressBarRight.png'),
      progressBarUnder: require('./img/progressBarUnder.png'),
      progressBarUnderLeft: require('./img/progressBarUnderLeft.png'),
      progressBarUnderRight: require('./img/progressBarUnderRight.png'),
      progressBarUnderMiddle: require('./img/progressBarUnderMiddle.png'),
      timelineUnder: require('./img/timelineUnder.png'),
      timelineOver: require('./img/timelineOver.png'),
      clementeRegular: require('./img/clementeRegular.png'),
      // We Load the key twice to have the png also imported with webpack (kindof a hack but convenient)
      // If we load it explicitely we get a warning a texture being loaded twice
      /* eslint no-dupe-keys: 0 */
      clementeRegular: require('./img/clementeRegular.fnt'),
      blank: require('./img/blank.png'),
      bgMain: require('./img/BG1-logo.jpg'),
      bgBlank: require('./img/BG1.jpg'),
      highlighterLeft: require('./img/highlighterLeft.png'),
      highlighterRight: require('./img/highlighterRight.png'),
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
    return new MenuDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Menu Graphic Component
   */
  createMenuOptionGC(...args) {
    return new OptionMenuDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Text Menu Item Graphic Component
   */
  createTextMenuItemGC(...args) {
    return new TextMenuItemDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Song Menu Item Graphic Component
   */
  createSongMenuItemGC(...args) {
    return new SongMenuItemDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Chart Menu Item Graphic Component
   */
  createChartMenuItemGC(...args) {
    return new ChartMenuItemDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Text Menu Item Graphic Component
   */
  createInputMenuItemGC(...args) {
    return new InputMenuItemDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Mapping Menu Item Graphic Component
   */
  createMappingMenuItemGC(...args) {
    return new MappingMenuItemDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Enum Menu Item Graphic Component
   */
  createEnumMenuItemGC(...args) {
    return new EnumMenuItemDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Menu Item Highlighter Graphic Component
   */
  createMenuItemHighlighterGC(...args) {
    return new MenuItemHighlighterDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Chart Menu Item Highlighter Graphic Component
   */
  createChartMenuItemHighlighterGC(...args) {
    return new ChartMenuItemHighlighterDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Menu Item Selector Graphic Component
   */
  createMenuItemSelectorGC(...args) {
    return new MenuItemSelectorDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Song Menu Graphic Component
   */
  createSongMenuGC(...args) {
    return new SongMenu2DefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Song Menu Graphic Component
   */
  createSongMenu3GC(...args) {
    return new SongMenu3DefaultGraphicComponent(this, ...args);
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
    return new EngineViewDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Loasing View Graphic Component
   */
  createLoadingViewGC(...args) {
    return new LoadingViewDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Wait View Graphic Component
   */
  createWaitViewGC(...args) {
    return new WaitViewDefaultGraphicComponent(this, ...args);
  }

  /**
   * Create Notification Graphic Component
   */
  createNotificationGC(...args) {
    return new NotificationDefaultGraphicComponent(this, ...args);
  }

}



