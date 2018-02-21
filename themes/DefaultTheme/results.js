'use strict';

import * as PIXI from 'pixi.js';

import {theme as interfaces} from '../../src/interfaces';

import {TIMING_TEXTS, RANK_TEXTS, TM_W1, TM_W2, TM_W3, TM_W4, TM_W5, TM_MISS} from '../../src/constants/judge';

const TIMING_COLORS = {
  [TM_W1]: 0xb43578,
  [TM_W2]: 0x2469aa,
  [TM_W3]: 0x35c379,
  [TM_W4]: 0xdbd71c,
  [TM_W5]: 0xdd4119,
  [TM_MISS]: 0xbc101f
};

/**
 * Results
 */
export class ResultsDefaultGraphicComponent extends interfaces.ResultsGraphicComponent {

  constructor(theme, width, height, background, banner, results) {
    super(theme);
    this.width = width;
    this.height = height;

    this.results = results;

    this.titleHeight = 80;

    this.sprite = new PIXI.Container();

    // Decoration
    this.sprite.addChild(this.drawBackground(background));
    this.sprite.addChild(this.drawTitleBar());

    this.bottom = new PIXI.Container();
    this.bottom.y = this.titleHeight;
    this.sprite.addChild(this.bottom);

    this.bottom.addChild(this.drawBanner(banner));
  }

  finishDrawing() {
    this.drawCenter();
    this.drawNames();
    this.bottom.y = this.titleHeight + (this.height - this.titleHeight) / 2 - this.bottom.height / 2;
  }

  drawCenter() {

    let result = this.results[0];

    const width = this.banner.width;
    const x = this.width / 2 - width / 2;
    let y = 0;

    this.counts = new PIXI.Container();
    this.counts.x = x;
    this.bottom.addChild(this.counts);

    for (let [t, ] of result.stats.timings) {
      let row = this.createRow(t, width);
      this.counts.addChild(row);
      row.y = y;
      y+= 40;
    }

    this.counts.y = (this.banner.height + 520) / 2 - this.counts.height / 2;
  }

  createRow(timing, width, height=40) {

    let row = new PIXI.Container();

    let color = TIMING_COLORS[timing];
    let text = TIMING_TEXTS[timing];

    let border = new PIXI.Graphics();
    const thick = 1;
    border.beginFill(0x111111, 0.8)
               .drawRect(thick, thick, width - thick, height - thick)
               .endFill()
               .lineStyle(thick, 0xffffff)
               .moveTo(thick, thick)
               .lineTo(thick, height - thick)
               .lineTo(width - thick, height - thick)
               .lineTo(width - thick, thick)
               .lineTo(thick, thick),

    border.tint = color;
    row.addChild(border);

    let txt = new PIXI.extras.BitmapText(text, {font: height - 4 + 'px clementeRegular'});
    txt.tint = color;
    txt.x = width / 2 - txt.width / 2;
    txt.y = height / 2 - txt.height / 2;
    row.addChild(txt);

    return row;
  }

  drawNames() {

    const height = 160;
    const width = (this.width - this.banner.width) / 4;

    let index = 0;
    for (let result of this.results) {

      let theX = index * (this.width / 2 + this.banner.width / 2) + width / 2;

      // Name

      let container = new PIXI.Container();
      this.bottom.addChild(container);
      container.addChild(this.createBackground(width, height));
      container.x = theX;
      container.y = 0;

      let name = new PIXI.extras.BitmapText(result.player.name, {font: 40 + 'px clementeRegular'});
      name.x = width / 2 - name.width / 2;
      name.y = name.height / 2;
      container.addChild(name);

      let rank = new PIXI.extras.BitmapText(RANK_TEXTS[result.rank], {font: 80 + 'px clementeRegular'});
      rank.x = width/2 - rank.width / 2;
      rank.y = (1.5 * name.height + height) / 2 - rank.height / 2;
      rank.tint = 0x37759c;
      container.addChild(rank);

      //
      // Held
      //

      let heldContainer = new PIXI.Container();
      this.bottom.addChild(heldContainer);
      heldContainer.addChild(this.createBackground(width, height / 2));
      heldContainer.x = theX;
      heldContainer.y = 200;

      let txt = new PIXI.Container();

      let held = new PIXI.extras.BitmapText('Held', {font: 36 + 'px clementeRegular'});
      held.x = width / 2 - held.width / 2;
      held.y = 0;
      txt.addChild(held);

      let heldNr = new PIXI.extras.BitmapText(`${result.stats.held}`, {font: 30 + 'px clementeRegular'});
      heldNr.x = width/2 - heldNr.width / 2;
      heldNr.y = 1.5 * held.height;
      txt.addChild(heldNr);

      heldContainer.addChild(txt);
      txt.y = height / 4 - txt.height / 2;

      //
      // Combo
      //

      let comboContainer = new PIXI.Container();
      this.bottom.addChild(comboContainer);
      comboContainer.addChild(this.createBackground(width, height / 2));
      comboContainer.x = theX;
      comboContainer.y = 200 + height / 2 * 1.5;

      let txt2 = new PIXI.Container();

      let background2 = this.createBackground(width, height / 2 - 2);
      background2.y = height / 2 + 4;

      let combo = new PIXI.extras.BitmapText('Max combo', {font: 36 + 'px clementeRegular'});
      combo.x = width / 2 - combo.width / 2;
      txt2.addChild(combo);

      let comboNr = new PIXI.extras.BitmapText(`${result.combo}`, {font: 30 + 'px clementeRegular'});
      comboNr.x = width/2 - comboNr.width / 2;
      comboNr.y = 1.5 * combo.height;
      txt2.addChild(comboNr);

      comboContainer.addChild(txt2);
      txt2.y = height / 4 - txt2.height / 2;

      //
      // Score
      //

      let scoreWidth = this.width / 2 - width / 2 - 1;

      let scoreContainer = new PIXI.Container();
      this.bottom.addChild(scoreContainer);
      scoreContainer.addChild(this.createBackground(scoreWidth, height / 2));
      scoreContainer.x = width / 2 + index * (scoreWidth + 2);
      scoreContainer.y = 520;

      let score = new PIXI.extras.BitmapText(`${result.score}`, {font: 80 + 'px clementeRegular'});
      score.x = 10 + index * ( - 30 + scoreWidth - score.width);
      score.y = height / 4 - score.height / 2;
      scoreContainer.addChild(score);

      //
      // Counts
      //
      let y = 0;
      const lineHeight = 40;
      for (let [t, count] of result.stats.timings) {
        let countTxt = new PIXI.extras.BitmapText(`${count}`, {font: 36 + 'px clementeRegular'});
        this.counts.addChild(countTxt);
        countTxt.x = 5 + index * ( - 15 + this.counts.width - countTxt.width);
        countTxt.y = y + lineHeight / 2 - countTxt.height / 2;
        y += lineHeight;
        countTxt.tint = TIMING_COLORS[t];
      }

      index++;
    }
  }

  createBackground(width, height) {
    let background = new PIXI.Graphics();
    background.beginFill(0x111111, 0.8);
    background.drawRect(0, 0, width, height);
    background.endFill();

    return background;
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
      this.banner.width = this.width / 2 * 0.65;

      container.x = this.width / 2 - this.banner.width / 2;
      container.y = 0;

      this.bannerBorder = new PIXI.Graphics();
      const thick = 1;
      this.bannerBorder.lineStyle(thick, 0xffffff)
                 .moveTo(thick, thick)
                 .lineTo(thick, this.banner.height - thick)
                 .lineTo(this.banner.width - thick, this.banner.height - thick)
                 .lineTo(this.banner.width - thick, thick)
                 .lineTo(thick, thick),
      container.addChild(this.bannerBorder);

      this.finishDrawing();

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
    this.overlay.beginFill(0x999999, 0.75);
    this.overlay.drawRect(0, 0, this.width, this.height);
    this.overlay.endFill();

    container.addChild(this.overlay);

    return container;
  }

  drawTitleBar() {

    const height = this.titleHeight;

    let container = new PIXI.Container();

    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x000000, 0.5);
    this.overlay.drawRect(0, 0, this.width, height);
    this.overlay.endFill();

    container.addChild(this.overlay);

    this.overlay2 = new PIXI.Graphics();
    this.overlay2.beginFill(0x000000, 0.5);
    this.overlay2.drawRect(0, 0, this.width, height);
    this.overlay2.endFill();
    this.overlay2.y = this.height - height;

    let text = new PIXI.extras.BitmapText('Your Results', {font: 40 + 'px clementeRegular', align: 'center'});
    text.x = 20;
    text.y = 20;
    text.tint = 0xfff893;
    container.addChild(text);

    return container;

  }
}
