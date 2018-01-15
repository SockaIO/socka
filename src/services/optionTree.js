'use stric';

import {Options} from './';
import {KEYS} from '../constants/input';
import {RESIZE, NUM_PLAYERS} from '../constants/signaling';
import {Player} from '../services';

/**
 * @namespace services.OptionTree
 * @returns {OptionFolder} Root of the option tree
 */

export default function GetOptionTree() {

  /*
   * Display
   */
  let resolution = new Options.EnumOption('Resolution', 'resolution', ['1280x720', '1920x1080'], '1280x720');
  resolution.setUpdateWorld ((value, player, game) => {

    let width, height;
    [width, height] = value.split('x');

    game.upgrade({type: RESIZE, width, height});
  });

  let display = new Options.OptionGroup('Display', 'display', true, [resolution]);

  /*
   * Gameplay
   */

  let field = new Options.EnumOption('Field of view', 'fieldOfView', ['4', '5', '6', '7', '8'], '6');

  let gameplay = new Options.OptionGroup('Gameplay', 'gameplay', false, [field]);

  /*
   * Player
   */
  let numPlayers = new Options.EnumOption('Players', 'numPlayers', ['1', '2'], '1');
  numPlayers.setUpdateWorld((value, player, game) => {
    Player.SetNumPlayers(value);
    game.upgrade({type: NUM_PLAYERS});
  });

  let namePlayer1 = new Options.TextOption('Name Player 1', 'namePlayer1', 1, 100, 'Player 1');
  namePlayer1.setUpdateWorld((value) => {
    Player.GetPlayer(1).name = value;
  });

  let namePlayer2 = new Options.TextOption('Name Player 2', 'namePlayer2', 1, 100, 'Player 2');
  namePlayer2.setUpdateWorld((value) => {
    Player.GetPlayer(2).name = value;
  });

  let players = new Options.OptionGroup('Players', 'players', true, [numPlayers, namePlayer1, namePlayer2]);

  /*
   * Mapping
   */
  let left = new Options.MappingOption('LEFT', 'left', {key: 37, controller: -1});
  let up = new Options.MappingOption('UP', 'up', {key: 38, controller: -1});
  let right = new Options.MappingOption('RIGHT', 'right', {key: 39, controller: -1});
  let down = new Options.MappingOption('DOWN', 'down', {key: 40, controller: -1});
  let enter = new Options.MappingOption('ENTER', 'enter', {key: 13, controller: -1});
  let back = new Options.MappingOption('BACK', 'back', {key: 8, controller: -1});

  const keyOptions = [left, right, down, up, enter, back];

  for (let x = 0; x < keyOptions.length ; x++) {

    let fct = (value, player) => {
      let m = player.mapping;
      const k = KEYS[x];
      m.resetKey(k);
      m.setKey(k, value.key, value.controller);
    };

    keyOptions[x].setUpdateWorld(fct);
  }

  let mapping = new Options.OptionGroup('Mapping', 'mapping', false, [left, up, right, down, enter, back]);

  /*
   * Root
   */
  let root = new Options.OptionFolder('root', 'root', [display, gameplay, players, mapping]);

  return root;
}
