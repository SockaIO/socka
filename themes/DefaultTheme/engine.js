'use strict';

import * as PIXI from 'pixi.js';
import {TweenLite} from 'gsap';

import {TM_W1, TM_MINE} from '../../src/constants/judge';
import {EVENT_NOTE_HIT, EVENT_NOTE_MISS, EVENT_NOTE_FINISH} from '../../src/constants/chart';

export class EngineDefaultGraphicComponent {

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

  reset() {
    this.fieldBackground.removeChild(this.stream);
    this.judgment.hide();
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

export class JudgmentDefaultGraphicComponent {

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

  hide() {
    this.sprite.alpha = 0;
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

export class ScoreDefaultGraphicComponent {

  constructor() {
    this.sprite = new PIXI.extras.BitmapText('',{font : '24px clementeRegular', align : 'center'});
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

export class ComboDefaultGraphicComponent {

  constructor() {
    this.sprite = new PIXI.extras.BitmapText('Combo',{font : '24px clementeRegular', align : 'center'});
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

export class ProgressionBarDefaultGraphicComponent {
  constructor(theme) {
    this.theme = theme;

    this.sprite = new PIXI.Container();

    // Create the Sprite

    this.under = new PIXI.Sprite(this.theme.getTexture('timelineUnder'));
    this.sprite.addChild(this.under);

    this.over = new PIXI.Sprite(this.theme.getTexture('timelineOver'));
    this.sprite.addChild(this.over);

    // Create the mask for the top
    let mask = new PIXI.Graphics();
    this.over.addChild(mask);

    mask.beginFill(0x8bc5ff, 0.5)
        .drawRect(0, 0, this.over.width, this.over.height)
        .endFill();

    mask.height = 0;
    this.over.mask = mask;
  }

  update(progression) {
    this.over.mask.height = this.over.height * progression;
  }
}

export class LifemeterDefaultGraphicComponent {

  constructor(theme) {

    this.theme = theme;
    this.sprite = new PIXI.Container();

    this.under = new PIXI.Sprite(theme.getTexture('lifemeterUnder'));
    this.sprite.addChild(this.under);

    this.bar = new PIXI.Sprite(theme.getTexture('lifemeterMiddle'));
    this.sprite.addChild(this.bar);

    // Create the mask for the top
    let mask = new PIXI.Graphics();
    this.bar.addChild(mask);

    mask.beginFill(0x8bc5ff, 0.5)
        .drawRect(0, 0, this.bar.width, this.bar.height)
        .endFill();

    mask.width = 0;
    this.bar.mask = mask;

    //this.sprite.addChild(new PIXI.Sprite(theme.getTexture('lifemeterOver')));

    this.sprite.scale = {x: 0.5, y: 0.5};

    this.changing = false;
    this.target = 0;
    this.current = 0;
    this.tweenDuration = 0.5;
  }

  update(fraction) {
    if (this.changing === false) {
      this.target = fraction * this.bar.width;
      this.doUpdate();
    } else {
      this.target = fraction * this.bar.width;
    }
  }

  doUpdate() {

    this.current = this.target;
    this.changing = true;

    TweenLite.to(this.bar.mask, this.tweenDuration, {width: this.current, ease: 'bounce', onComplete: () => {
      if (this.target !== this.current) {
        this.doUpdate();
      } else {
        this.changing = false;
      }
    }});
  }

}
