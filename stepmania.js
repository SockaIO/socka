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

  log.setLevel(PRODUCTION === true ? 'info' : 'debug');
  log.info('Starting Game Initialization');

  log.info(`Current Environment ${PRODUCTION === true ? 'Production' : 'Dev'}`);

  let game = new Game(1280, 720, PRODUCTION !== true);

  game.init().then(() => {
    game.start();
  });
}
