'use stric';

import {Options} from './';
import {KEYS, PRIMARY, SECONDARY} from '../constants/input';
import {MENU_OPTION, MENU_OPTION_MAPPING} from '../constants/resources';
import {RESIZE, NUM_PLAYERS, VOLUME} from '../constants/signaling';
import {Player, Library} from '../services';
import {HttpEndpoint} from './endpoint';

/**
 * @namespace services.OptionTree
 * @returns {OptionFolder} Root of the option tree
 */

export default function GetOptionTree() {

  /*
   * Display
   */

  // Detect the resolution
  const screenHeight = window.screen.availHeight;
  const screenWidth = window.screen.availWidth;
  const ratio = screenWidth / screenHeight;
  let widths;

  switch (ratio) {
  case 16/10:
    widths = [1280, 1440, 1680, 1920];
    break;
  case 16/9:
  default:
    widths = [1280, 1366, 1660, 1920];
    break;
  }

  const resolutions = widths.map((width) => {
    return `${width}x${Math.floor(width / ratio)}`;
  });

  let resolution = new Options.EnumOption('Resolution', 'resolution', resolutions, resolutions[0]);
  resolution.setUpdateWorld ((value, player, game) => {

    let width, height;
    [width, height] = value.split('x');

    game.upgrade({type: RESIZE, width, height});
  });

  let display = new Options.OptionGroup('Display', 'display', true, [resolution]);

  /*
   * Sound
   */

  let volume = new Options.EnumOption('Music Volume', 'musicVolume', ['25', '50', '75', '100'], '100');
  volume.setUpdateWorld((value, player, game) => {
    let newVolume = parseInt(value, 10);
    game.upgrade({type: VOLUME, volume: newVolume});
  });

  let sound = new Options.OptionGroup('Sound', 'sound', true, [volume]);

  /*
   * Gameplay
   */

  let field = new Options.EnumOption('Field of view', 'fieldOfView', ['4', '5', '6', '7', '8', '9', '12'], '6');

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
   * NOTE: Defaults are actually from the Player (but should be mirrored here)
   */
  let left = new Options.MappingOption('LEFT', 'left', {PRIMARY: {key: 37, controller: -1},
    SECONDARY: {key: 1, controller: 0}},
                                                       {PRIMARY: {key: 65, controller: -1}});
  let up = new Options.MappingOption('UP', 'up', {PRIMARY: {key: 38, controller: -1},
    SECONDARY: {key: 2, controller: 0}},
                                                 {PRIMARY: {key: 87, controller: -1}});
  let right = new Options.MappingOption('RIGHT', 'right', {PRIMARY: {key: 39, controller: -1},
    SECONDARY: {key: 3, controller: 0}},
                                                          {PRIMARY: {key: 68, controller: -1}});
  let down = new Options.MappingOption('DOWN', 'down', {PRIMARY: {key: 40, controller: -1},
    SECONDARY: {key: 0, controller: 0}},
                                                       {PRIMARY: {key: 83, controller: -1}});
  let enter = new Options.MappingOption('ENTER', 'enter', {PRIMARY: {key: 13, controller: -1},
    SECONDARY: {key: 9, controller: 0}},
                                                          {PRIMARY: {key: 69, controller: -1}});
  let back = new Options.MappingOption('BACK', 'back', {PRIMARY: {key: 8, controller: -1},
    SECONDARY: {key: 8, controller: 0}},
                                                       {PRIMARY: {key: 81, controller: -1}});

  const keyOptions = [left, right, down, up, enter, back];

  for (let x = 0; x < keyOptions.length ; x++) {

    let fct = (value, player) => {
      let m = player.mapping;

      const k = KEYS[x];
      m.setKey(k, value['PRIMARY'].key, value['PRIMARY'].controller, PRIMARY);

      if (value['SECONDARY'] !== undefined) {
        m.setKey(k, value['SECONDARY'].key, value['SECONDARY'].controller, SECONDARY);
      }
    };

    keyOptions[x].setUpdateWorld(fct);
  }

  const config = {
    keepIndex: true,
    reset: true
  };
  let mapping = new Options.OptionGroup('Mapping', 'mapping', false, [left, up, right, down, enter, back], MENU_OPTION_MAPPING, config);

  /**
   * Endpoint
   */


  let endpointUrl = new Options.TextOption('URL', 'url', 0, 100, '');
  endpointUrl.setUpdateWorld((value, player) => {

    if (value === '') {
      Library.RemoveCustomEndpoint();
      return;
    }

    let username = player.optionStore.get('.root.endpoint.username');
    let password = player.optionStore.get('.root.endpoint.password');

    let basicAuth = null;
    if (username !== '') {
      basicAuth = {
        username,
        password
      };
    }

    Library.SetCustomEndpoint(HttpEndpoint.CreateHttpEndpoint(value, basicAuth));
  });

  let endpointUsername = new Options.TextOption('Username', 'username', 0, 100, '');
  let endpointPassword = new Options.TextOption('Password', 'password', 0, 100, '');

  let endpoint = new Options.OptionGroup('Custom Source', 'endpoint', true, [endpointUrl, endpointUsername, endpointPassword], MENU_OPTION, {sort: false});

  /*
   * Root
   */
  let root = new Options.OptionFolder('root', 'root', [display, sound, gameplay, players, mapping, endpoint]);

  return root;
}
