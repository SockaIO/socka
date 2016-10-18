/* jshint esnext: true */
"use strict";

class MainView {

  constructor(width, height, theme) {
    this.width = width;
    this.height = height;
    this.theme = theme;

    this.stage = new PIXI.Container();
    this.background = new PIXI.Container();
    this.foreground = new PIXI.Container();
    this.stage.addChild(this.background);
    this.stage.addChild(this.foreground);

    this.renderer = PIXI.autoDetectRenderer(width, height, {backgroundColor : 0x1099bb});

    this.views = [];
    this.menu = null;
  }

  addView(view) {
    this.foreground.addChild(view.sprite);
    this.views.push(view);
  }

  removeView(view) {
    this.foreground.removeChild(view.sprite);
    this.views.splice(this.views.indexOf(view), 1);
  }

  update() {
    for (let view of this.views) {
      view.update();
    }
  }

  addMenu(entries) {
    let controller = new KeyboardController;
    controller.setup();

    let mainview = this;

    let menu = new Menu(this.width, this.height, entries);
    menu.controller = controller;

    menu.sprite.x = 100;
    menu.sprite.y = 0;

    this.addView(menu);
    this.menu = menu;
  }

  startSong(song) {
    Promise.resolve(song).then((song) => {
      Note.theme = this.theme;

      let judge = new Judge();

      song.getResources().then(() => {
        song.backgroundTexture.width = this.width;
        song.backgroundTexture.height = this.height;
        this.background.addChild(song.backgroundTexture);
      });

      let engine = new Engine(400, 600, 6);
      engine.loadSong(song, 2, judge);

      engine.sprite.x = 100;
      engine.sprite.y = 0;

      let songPlayer = new SongPlayer();
      songPlayer.load(song).then(() => songPlayer.play());

      engine.setSongPlayer(songPlayer);

      engine.setMissTiming(judge.getMissTiming());
      engine.setMineTiming(judge.getMineTiming());

      let controller = new KeyboardController;
      controller.setup();
      controller.setSongPlayer(engine.songPlayer);

      PadController.Subject.addObserver(engine);
      PadController.Setup();

      engine.controller = controller;
      this.addView(engine);
    });
  }

}

