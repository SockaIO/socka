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
          name: "Options",
          action: function() {
            mainview.addOptionMenu([
              {name: 'theme', options: ['theme1', 'theme2']},
              {name: 'options', options: ['opt1', 'opt2']},
              {name: 'coucou', options: ['bidule', 'chose', 'machin']},
            ]);
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


