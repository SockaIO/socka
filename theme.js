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
      holdCap: 'theme/holdCap.png',
      holdBody: 'theme/holdBody.png',
      rollCap: 'theme/rollCap.png',
      rollBody: 'theme/rollBody.png'
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

    });
  }

  getTexture(name) {
    // TODO: Catch error?
    return this.textures[name];
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
    return new DetectorDefaultGraphicComponent(this);
  }

}

DefaultTheme.angleMap = [1, 0, 2, 3].map((x) => 2 * x * Math.PI / 4);

class SimpleNoteDefaultGraphicComponent extends SimpleNoteGraphicComponent {

  constructor(theme) {
    super(theme);
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
  }

  hit() {
  }
}

class ReceptorDefaultGraphicComponent extends ReceptorGraphicComponent {

  constructor(theme) {
    super(theme);
  }

  create(width) {

    let c = new PIXI.Container();
    let notes = [];

    let offset = width / 5;
    let texture = this.theme.getTexture('receptor');
    let scale = offset / texture.frame.width;

    for (let x=0; x < 4; x++) {
      let note = new PIXI.Sprite(texture);
      note.anchor.x = 0.5;
      note.anchor.y = 0.5;
      note.rotation = DefaultTheme.angleMap[x];
      note.scale.x = scale;
      note.scale.y = scale; 

      note.x = (x + 1) * offset;

      c.addChild(note);
      notes.push(note);
    }

    this.sprite = c;
  }


  remove() {
    if (this.sprite.parent !== null) {
      this.sprite.parent.removeChild(this.note.sprite);
    }
    this.sprite.destroy(); 
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

    // TODO: Compute length for the long note
    // Maybe length not accessible at that point ?
    let length = 0;

    let c = new PIXI.Container();

    let arrow = new PIXI.Sprite(this.theme.getNoteTexture(this.note));
    let bodyTexture, capTexture;

    [bodyTexture, capTexture] = this.getTextures();

    // TODO: Reintroduce Tiling when the sprites are lazy loaded
    //let body = new PIXI.extras.TilingSprite(bodyTexture, 128, 64);
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

