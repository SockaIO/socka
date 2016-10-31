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

    this.engines = [];

    const engineWidth = width / 2;
    const engineHeight = height;


    let i = 0;
    for (let player of players) {
      let e = new Engine(engineWidth, engineHeight, 6, player);
      e.sprite.x = i++ * engineWidth;
      e.sprite.y = 0;

      // @TODO: Inside the constructor
      e.setSongPlayer(this.songPlayer);
      e.setMissTiming(game.judge.getMissTiming());
      e.setMineTiming(game.judge.getMineTiming());

      this.engines.push(e);
      this.graphicComponent.addEngine(e.sprite);
    }

    // Load the song
    this.songPromise = Song.loadFromFile(song).then((song) => {
      this.song = song;

      for (let e of this.engines) {
        e.loadSong(this.song, difficulty, game.judge);
      }

      // Load the song into the player and fetch the textures
      return Promise.all([song.getResources(), this.songPlayer.load(song)]);
    }).then(() => {
      this.graphicComponent.setBackground(this.song.backgroundTexture);
    });
  }


  /**
   * Wait for the promises and start the song
   * @listens onFocus
   */
  onFocus() {
    this.songPromise.then(() => {
      this.songPlayer.play();
    });
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
    for (let e of this.engines) {
      e.update();
    }
  }

  /**
   * Return the engine
   * @param {Number} n - Engine index
   */
  getEngine(n) {
    if (n < this.engines.length) {
      return this.engines[n];
    }
    throw new UserException("InvalidEngineId");
  }
}


