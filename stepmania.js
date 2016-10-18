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

      mainview.addMenu([
        {
          name: "Astro Troopers",
          action: function() {
            mainview.startSong(
              Song.loadFromFile('Astro Troopers/Astro Troopers.sm')
            );
            mainview.removeView(mainview.menu);
          }
        },
        {
          name: "entry2",
          action: function() {
            console.log("entry2");
          }
        },
        {
          name: "entry3",
          action: function() {
            console.log("entry3");
          }
        },
    ]);

      gameLoop();
    });
}

function gameLoop() {
  window.requestAnimationFrame(gameLoop);
  mainview.update();
  mainview.renderer.render(mainview.stage);
}


