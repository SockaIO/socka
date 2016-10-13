/* jshint esnext: true */
"use strict";

/*
 * The Theme class is responsible for laoding 
 * the assets that will be used by the different graphic components
 */

class Theme {
  loadTextures(){}
  getTexture(){}
}

class DefaultTheme {

  constructor() {

    // Must be modified manually
    // TODO: Loader from file
    this.resources = {
      arrows: 'theme/arrows.png',
      mines: 'theme/mines.png',
      receptor: 'theme/receptor.png',
      receptorFlash: 'theme/receptor_flash.png',
      receptorGlow: 'theme/receptor_glow.png',
      holdCap: 'theme/holdCap.png',
      holdBody: 'theme/holdBody.png',
      rollCap: 'theme/rollCap.png',
      rollBody: 'theme/rollBody.png',
      judgments: 'theme/judgments.png',
      holdJudgments: 'theme/holdJudgments.png',
      lifemeterOver: 'theme/lifemeterOver.png',
      lifemeterMiddle: 'theme/lifemeterMiddle.png',
      lifemeterUnder: 'theme/lifemeterUnder.png',
    };

    // Will be filled after loading
    this.textures = {};
  }

  loadTextures() {

    for (let r of Object.keys(this.resources)) {
      PIXI.loader.add(this.resources[r]);
    }

    return new Promise((resolve, reject) => {
      PIXI.loader.load(resolve);
    }).then(() => {

      // Simple textures
      for (let r of Object.keys(this.resources)) {
        this.textures[r] = PIXI.loader.resources[this.resources[r]].texture;
      }

      // Arrows
      let arrowTextures = []
      for (let x=0; x < 8; x++) {
        let texture = PIXI.loader.resources[this.resources['arrows']].texture.clone();
        texture.frame = new PIXI.Rectangle(0, x * 127, 128, 128);
        arrowTextures.push(texture);
      }
      this.textures['arrows'] = arrowTextures;

      // Mines 
      let mineTextures = []
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

  getTexture(name) {
    // TODO: Catch error?
    return this.textures[name];
  }

  getJudgmentTexture(timing) {
    return this.getTexture('judgments')[timing];
  }

  getHoldJudgmentTexture(timing) {
    return this.getTexture('holdJudgments')[timing];
  }

  getNoteTexture(note) {

    switch(note.type) {
      case TAP_NOTE:
      case FAKE_NOTE:
      case HOLD_NOTE:
      case ROLL_NOTE:
        return this.getTexture('arrows')[note.division];
        break;
      case MINE_NOTE:
        return this.getTexture('mines')[0];
        break;
      case LIFT_NOTE:
        // TODO
        break;
    }

  }

  createSimpleNoteGC() {
    return new SimpleNoteDefaultGraphicComponent(this);
  }

  createLongNoteGC() {
    return new LongNoteDefaultGraphicComponent(this);
  }

  createReceptorGC() {
    return new ReceptorDefaultGraphicComponent(this);
  }

  createEngineGC(...args) {
    return new EngineDefaultGraphicComponent(this, ...args);
  }

  createJudgmentGC() {
    return new JudgmentDefaultGraphicComponent(this);
  }

  createScoreGC() {
    return new ScoreDefaultGraphicComponent(this);
  }

  createComboGC() {
    return new ComboDefaultGraphicComponent(this);
  }

  createLifemeterGC() {
    return new LifemeterDefaultGraphicComponent(this);
  }

}

DefaultTheme.angleMap = [1, 0, 2, 3].map((x) => 2 * x * Math.PI / 4);

class SimpleNoteDefaultGraphicComponent extends SimpleNoteGraphicComponent {

  constructor(theme) {
    super(theme);
    this.fadeout = 0.2;
  }

  resize(scale, multiplier) {
    this.sprite.scale.x = scale;
    this.sprite.scale.y = scale;
  }

  create() {
    // Create the sprite
    let sprite = new PIXI.Sprite(this.theme.getNoteTexture(this.note));

    sprite.anchor.x = 0.5;
    sprite.anchor.y = 0.5;

    sprite.rotation = DefaultTheme.angleMap[this.note.direction];

    this.sprite = sprite;
  }

  remove() {
    if (this.sprite.parent !== null) {
      this.sprite.parent.removeChild(this.note.sprite);
    }
    this.sprite.destroy(); 
  }

  miss() {
    // No feedback
  }

  hit(timing) {
    // We hide the note only in the best 3 timings
    if ([TM_W1, TM_W2, TM_W3].includes(timing)) {
      TweenLite.to(this.sprite, this.fadeout, {alpha: 0});
    }
  }
}

class ReceptorDefaultGraphicComponent extends ReceptorGraphicComponent {

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

    this.flashMinScale = scale * 0.7;
    this.flashMaxScale = scale * 1.5;

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

  flash(direction) {

    let arrow = this.notes[direction];
    let flash = arrow.children[0];

    flash.scale = {x: this.flashMinScale, y: this.flashMinScale};
    flash.alpha = 1;

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


    let glow = this.glows[note.direction];
    glow.alpha = 0.7;
    glow.tint = tint;

    TweenLite.to(glow, this.glowDuration, {alpha: 0});

  }
}

class LongNoteDefaultGraphicComponent extends LongNoteGraphicComponent {

  constructor(theme) {
    super(theme);
  }

  getTextures() {

    switch(this.note.type) {
      case ROLL_NOTE:
        return [this.theme.getTexture('rollBody'), this.theme.getTexture('rollCap')];
        break
      case HOLD_NOTE:
        return [this.theme.getTexture('holdBody'), this.theme.getTexture('holdCap')];
        break
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

  create(fieldWidth, fieldHeight) {

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
    this.sprite = new PIXI.Text('', {font : '24px Arial', fill : 0xff1010, align : 'center'});
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
    this.sprite = new PIXI.Text('', {font : '24px Arial', fill : 0xff1010, align : 'center'});
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
