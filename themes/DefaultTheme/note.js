'use strict';

import * as PIXI from 'pixi.js';
import { TweenLite } from 'gsap';

import {theme as interfaces} from '../../src/interfaces';

import {MINE_NOTE, ROLL_NOTE, HOLD_NOTE} from '../../src/constants/chart';
import {TM_W1, TM_W2, TM_W3, S_OK} from '../../src/constants/judge';

const angleMap = [1, 0, 2, 3].map((x) => 2 * x * Math.PI / 4);

/**
 * Simple Note GC
 */
export class SimpleNoteDefaultGraphicComponent extends interfaces.SimpleNoteGraphicComponent {

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
      arrow.rotation = angleMap[this.note.direction];
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

export class LongNoteDefaultGraphicComponent extends interfaces.LongNoteGraphicComponent {

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

    this.sprite.children[1].y = duration * multiplier - 1;

    let height = this.sprite.children[0].height;
    this.sprite.children[0].height = duration * multiplier;

    // Move the tile offset to keep the illusion of movement
    if (this.note.type == ROLL_NOTE) {
      let heightDiff = duration * multiplier - height;
      this.sprite.children[0].tilePosition.y = (this.sprite.children[0].tilePosition.y + heightDiff) % 64;
    }
  }

  resize(scale, multiplier) {

    this.sprite.children[2].scale.x = scale;
    this.sprite.children[2].scale.y = scale;
    this.sprite.children[1].scale.x = scale;
    this.sprite.children[1].scale.y = scale;
    this.sprite.children[0].scale.x = scale;

    this.sprite.children[1].y = this.note.duration * multiplier - 1;
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
    // But it is ugly for the roll so let's use it anyway
    let body;
    if (this.note.type === ROLL_NOTE) {
      body = new PIXI.extras.TilingSprite(bodyTexture, 128, 64);
    } else {
      body = new PIXI.Sprite(bodyTexture);
    }
    let cap = new PIXI.Sprite(capTexture);

    arrow.anchor.x = 0.5;
    arrow.anchor.y = 0.5;

    arrow.rotation = angleMap[this.note.direction];

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


export class ReceptorDefaultGraphicComponent extends interfaces.ReceptorGraphicComponent {

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
        n.rotation = angleMap[x];
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
      glow.rotation = angleMap[x];
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


