'use stric';

import {Options} from './';

/**
 * @namespace services.OptionTree
 * @returns {OptionFolder} Root of the option tree
 */

export default function GetOptionTree() {

  /*
   * Display
   */
  let resolution = new Options.EnumOption('Resolution', 'resolution', ['1280x720', '1920x1080'], '1280x720');
  let fullscreen = new Options.EnumOption('Fullscreen', 'fullscreen', ['True', 'False'], 'False');

  let display = new Options.OptionGroup('Display', 'display', [resolution, fullscreen]);

  /*
   * Mapping
   */
  let left = new Options.MappingOption('LEFT', 'left', 37);
  let up = new Options.MappingOption('UP', 'up', 38);
  let right = new Options.MappingOption('RIGHT', 'right', 39);
  let down = new Options.MappingOption('DOWN', 'down', 40);
  let enter = new Options.MappingOption('ENTER', 'enter', 13);
  let back = new Options.MappingOption('BACK', 'back', 8);

  let mapping = new Options.OptionGroup('Mapping', 'mapping', [left, up, right, down, enter, back]);

  /*
   * Root
   */
  let root = new Options.OptionFolder('root', 'root', [display, mapping]);

  return root;
}
