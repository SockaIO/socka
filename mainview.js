/* jshint esnext: true */
"use strict";

class MainView {

  constructor(width, height, theme) {
    this.width = width;
    this.height = height;

    this.stage = new PIXI.Container(),
      this.renderer = PIXI.autoDetectRenderer(width, height,{backgroundColor : 0x1099bb});

    this.views = [];
  }

  startSong(song) {
    Promise.resolve(song).then((song) => {
      Note.theme = this.theme;

      let judge = new Judge();

      let engine = new Engine(400, 600, 6);
      engine.loadSong(song, 4, judge);

      let field = engine.sprite;
      field.x = 100;
      field.y = 0;

      this.stage.addChild(field);

      let songPlayer = new SongPlayer();
      songPlayer.load(song).then(() => songPlayer.play());

      engine.setSongPlayer(songPlayer);

      engine.setMissTiming(judge.getMissTiming());

      let controller = new KeyboardController;
      controller.setup();
      controller.setSongPlayer(engine.songPlayer);

      PadController.Subject.addObserver(engine);
      PadController.Setup();

      engine.controller = controller;
      this.views.push(engine);
    });
  }

  update() {
    for (let view of this.views) {
      view.update();
    }
  }
}

