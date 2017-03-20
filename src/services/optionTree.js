'use stric';

import {Options} from './';
import {KEYS} from '../constants/input';
import {Input} from '../services';

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

    game.resize(width, height);
  });

  let display = new Options.OptionGroup('Display', 'display', true, [resolution]);

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
      m.setKey(k, value.key, Input.GetController(value.controller));
    };

    keyOptions[x].setUpdateWorld(fct);
  }

  let mapping = new Options.OptionGroup('Mapping', 'mapping', false, [left, up, right, down, enter, back]);

  /*
   * Root
   */
  let root = new Options.OptionFolder('root', 'root', [display, mapping]);

  return root;
}
