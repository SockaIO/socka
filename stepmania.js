/* jshint esnext: true */
"use strict";

window.addEventListener('load', init, false);
let theme;
let mainview;

function init() {
  theme = new DefaultTheme();
  theme.loadTextures()
    .then(() => {
      mainview = new MainView(800, 600, theme);

      document.body.appendChild(mainview.renderer.view);

      mainview.startSong(Song.loadFromSMFile('Astro Troopers/Astro Troopers.sm'));

      gameLoop();
    });
}

function gameLoop() {
  window.requestAnimationFrame(gameLoop);
  mainview.update();
  mainview.renderer.render(mainview.stage);
}


