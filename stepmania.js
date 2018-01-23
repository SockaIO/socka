'use strict';

// Internal dependencies
import {Game} from './src/components';

// External dependencies
import log from 'loglevel';

window.addEventListener('load', init, false);

/**
 * Initialize the game.
 */
function init() {

  log.setLevel('debug');
  log.info('Starting Game Initialization');

  let game = new Game(1280, 720, true);

  game.init().then(() => {
    game.start();
  });
}
