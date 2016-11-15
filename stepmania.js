/* jshint esnext: true */
"use strict";

window.addEventListener('load', init, false);
let theme;
let game;
let menu;

/**
 * Initialize the game.
 */
function init() {

      game = new Game(800, 600);
      game.init().then(() => {

        menu = new MenuView(800, 600, [
          {
            name: "Astro Troopers",
            action: function() {
              let gView = new EngineView(800, 600, 'Astro Troopers/Astro Troopers.sm', 2, Player.Players.values());
              game.pushView(gView);
            }
          },
          {
            name: "entry2",
            action: function() {
              console.log("entry2");
            }
          },
          {
            name: "Back",
            action: function() {
              let menuA = new MenuView(800, 600, [
                {
                  name: "Toto",
                  action: function () {}
                },
                {
                  name: "Tata",
                  action: function () {}
                }
              ]);
              game.pushView(menuA);
            }
          },
        ]);

        game.pushView(menu);
        game.main()
      });

      //mainview.addMenu([
        //{
          //name: "Astro Troopers",
          //action: function() {
            //mainview.startSong(
              //Song.loadFromFile('Astro Troopers/Astro Troopers.sm')
            //);
            //mainview.removeView(mainview.menu);
          //}
        //},
        //{
          //name: "entry2",
          //action: function() {
            //console.log("entry2");
          //}
        //},
        //{
          //name: "Options",
          //action: function() {
            //mainview.addOptionMenu([
              //{name: 'theme', options: ['theme1', 'theme2']},
              //{name: 'options', options: ['opt1', 'opt2']},
              //{name: 'coucou', options: ['bidule', 'chose', 'machin']},
            //]);
          //}
        //},
      /*]);*/
}
