/* jshint esnext: true */
"use strict";


/**
 * View Class for the gameplay.
 * Can contain one or more engines
 *
 * @extends View
 */
class EngineView extends View {

  /**
   * Create an engine view
   * @param {number} width - view width
   * @param {number} height - view height
   * @param {String} song - URL to the sm file of the song
   * @param {Number} difficulty - Index of the chart to use
   * @param {Player|Iterable} players - Players
   *
   */
  constructor(width, height, song, difficulty, players) {
    super();

    this.songPlayer = new SongPlayer();
    this.graphicComponent = game.theme.createEngineViewGC(width, height);

    this.loading = new LoadingPage(width, height);
    this.graphicComponent.placeLoadingPage(this.loading.sprite);

    this.engines = [];
    this.started = false;

    const engineWidth = width / 2;
    const engineHeight = height;

    let i = 0;
    for (let player of players) {
      this.loading.text = "Loading engine " + (i+1) + "...";

      let e = new Engine(engineWidth, engineHeight, 6, player);
      e.sprite.x = i++ * engineWidth;
      e.sprite.y = 0;

      // @TODO: Inside the constructor
      e.setSongPlayer(this.songPlayer);
      e.setMissTiming(game.judge.getMissTiming());
      e.setMineTiming(game.judge.getMineTiming());

      this.engines.push(e);
      this.graphicComponent.addEngine(e.sprite);
      this.loading.percentage = (i*30)/players.size;
    }

    // Load the song
    this.loading.text = "Load the Song...";
    this.songPromise = Song.loadFromFile(song).then((song) => {
      this.song = song;

      for (let e of this.engines) {
        e.loadSong(this.song, difficulty, game.judge);
      }
      this.loading.percentage = 50;
      this.loading.text = "Load Resources...";

      // Load the song into the player and fetch the textures
      return Promise.all([song.getResources(), this.songPlayer.load(song)]);
    }).then(() => {
      this.loading.percentage = 100;
      this.graphicComponent.setBackground(this.song.backgroundTexture);
      this.graphicComponent.removeLoadingPage();
    });

  }


  /**
   * Wait for the promises and start the song
   * @listens onPushed
   */
  onPushed() {
    this.songPromise.then(() => {
      this.songPlayer.play();
      this.started = true;
    });
  }


  /**
   * Configure the input
   * @listens onFocus
   */
  onFocus() {

    for (let engine of this.engines) {
      let player = engine.player;
      let mapping = new Map();

      let createBinding = (keycode, action, engine) => {
        return () => engine.danceInput(keycode, action, engine);
      }

      for (let keycode of [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT]) {
        for (let action of [TAP, LIFT]) {
          mapping.set([keycode, action], createBinding(keycode, action, engine));
        }
      }

      player.mapping.setCommands(mapping);
    }
  }


  /**
   * Get the view sprite
   * @returns {PIXI.DisplayObject}
   */
  getView() {
    return this.graphicComponent.sprite;
  }

  /**
   * Update
   */
  update() {

    if (!this.started) {
      return;
    }

    for (let e of this.engines) {
      e.update();
    }
  }

}

class LoadingPage {
  constructor(width, height, percentage=0, text="Loading...") {
    this.graphicComponent = game.theme.createLoadingPageGC(width, height);
    this.percentage = percentage;
    this.text = text;
  }

  get text () {
    return this.graphicComponent.text;
  }

  set text (text) {
    this.graphicComponent.text = text;
  }

  get percentage() {
    return this.graphicComponent.percentage;
  }

  set percentage(percentage) {
    this.graphicComponent.percentage = percentage;
  }

  get sprite() {
    return this.graphicComponent.sprite;
  }
}

class LoadingPageGraphicComponent {
  constructor(theme) {
    this.theme = theme;
  }

  get text () {}
  set text (text) {}
  get percentage () {}
  set percentage (percentage) {}
}

