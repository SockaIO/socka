/* jshint esnext: true */
"use strict";

window.addEventListener('load', init, false);
let theme;
let judge;

let stage = new PIXI.Container(),
    renderer = PIXI.autoDetectRenderer(800, 600,{backgroundColor : 0x1099bb});

let note, not, engine, songD, songPlayer;

function init() {
  document.body.appendChild(renderer.view);
  let song;

  theme = new DefaultTheme();
  theme.loadTextures()
    .then(() => {
      return Song.loadFromSMFile('Astro Troopers/Astro Troopers.sm') 
    })
    .then((q) => {
      song = q; 
      songD = q;
      console.log(q);
    })    
    
    .then(() => {
    Note.theme = theme;

    judge = new Judge();

    engine = new Engine(400, 600, 6);
    engine.loadSong(song, 2, judge);

    let field = engine.sprite;
    field.x = 100;
    field.y = 50;

    stage.addChild(field);

    songPlayer = new SongPlayer();
    songPlayer.load(song).then(() => songPlayer.play());

    engine.setSongPlayer(songPlayer);

    engine.setMissTiming(judge.getMissTiming());

    let controller = new KeyboardController;
    controller.setup();
    controller.setSongPlayer(engine.songPlayer);

    engine.controller = controller;

    gameLoop();
    
  });
 }

function gameLoop() {
  requestAnimationFrame(gameLoop);
  engine.update();
  renderer.render(stage);
}
