/* jshint esnext: true */
"use strict";

window.addEventListener('load', init, false);
let theme;

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

    engine = new Engine();
    engine.loadSong(song, 3);

    let field = engine.createField();
    field.x = 50;
    field.y = 50;

    stage.addChild(field);

    let gc = new ReceptorDefaultGraphicComponent(theme);
    gc.create(400);
    field.addChild(gc.sprite);

    engine.createStream();

    songPlayer = new SongPlayer();
    songPlayer.load(song).then(() => songPlayer.play());

    engine.setSongPlayer(songPlayer);

    gameLoop();
    
  });
 }

function gameLoop() {
  requestAnimationFrame(gameLoop);
  engine.update();
  renderer.render(stage);
}
