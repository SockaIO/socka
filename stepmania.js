'use strict';

//import PIXI from 'pixi.js';
//import { TweenLite } from 'gsap';

//import * as components from './components';
//import * as views from './views';
//import {theme} from './src/services';

// Internal dependencies
import {Game} from './src/components';
import {MenuView} from './src/views';

// External dependencies
import log from 'loglevel';
import * as PIXI from 'pixi.js';

window.addEventListener('load', init, false);

/**
 * Initialize the game.
 */

function init() {

  log.setLevel('debug');
  log.info('Starting Game Initialization');

  let game = new Game(800, 600, true);

  game.init().then(() => {

    let menu = new MenuView(800, 600, [
      {
        name: 'Astro Troopers',
        action: () => {log.debug('Astro');}
      },
      {
        name: 'Toto',
        action: () => {}
      },
      {
        name: 'Titi',
        action: () => {
          let menuA = new MenuView(800, 600, [
            {
              name: 'Toto',
              action: () => {}
            },
            {
              name: 'Back',
              action: () => {game.popView();}
            }
          ], game);
          game.pushView(menuA);
        }
      }
    ], game);

    game.pushView(menu);
    game.main();
  });


}

/*function init() {*/

  //let game = new components.Game(800, 600);
  //game.init().then(() => {

    //let menu = new views.menu(800, 600, [
      //{
        //name: "Astro Troopers",
        //action: function() {
          //let gView = new views.engine(800, 600, 'Astro Troopers/Astro Troopers.sm', 2, Player.Players.values());
          //game.pushView(gView);
        //}
      //},
      //{
        //name: "entry2",
        //action: function() {
          //console.log("entry2");
        //}
      //},
      //{
        //name: "Back",
        //action: function() {
          //let menuA = new views.menu(800, 600, [
            //{
              //name: "Toto",
              //action: function () {}
            //},
            //{
              //name: "Tata",
              //action: function () {}
            //}
          //]);
          //game.pushView(menuA);
        //}
      //},
    //]);

    //game.pushView(menu);
    //game.main();
  //});

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
//}
