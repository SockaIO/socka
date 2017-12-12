'use strict';

import * as PIXI from 'pixi.js';

import {theme as interfaces} from '../../src/interfaces';

import {TIMING_TEXTS, RANK_TEXTS} from '../../src/constants/judge';

/**
 * Results
 */
export class ResultsDefaultGraphicComponent extends interfaces.ResultsGraphicComponent {

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

    let nameSprite = new PIXI.extras.BitmapText(result.player.name, {font: 40 + 'px clementeRegular', align: 'left'});
    container.addChild(nameSprite);

    let rankSprite = new PIXI.extras.BitmapText(RANK_TEXTS[result.rank], {font: 40 + 'px clementeRegular', align: 'left'});
    rankSprite.y = 50;
    rankSprite.x = 20;
    container.addChild(rankSprite);

    let text = this.getText(result);
    let textSprite = new PIXI.extras.BitmapText(text, {font: 25 + 'px clementeRegular', align: 'left'});
    textSprite.y = 100;

    container.addChild(textSprite);

    let score = new PIXI.extras.BitmapText('Score: ' + result.score, {font: 40 + 'px clementeRegular', align: 'left'});
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

    let text = new PIXI.extras.BitmapText('Your Results', {font: 40 + 'px clementeRegular', align: 'center'});
    text.x = 20;
    text.y = 20;
    container.addChild(text);

    return container;

  }
}
