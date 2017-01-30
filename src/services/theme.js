'use strict';

/**
 * @namespace services.Theme
 */

import {DefaultTheme} from '../../themes/DefaultTheme';
import log from 'loglevel';

log.info('Setting default Theme');
let theme = new DefaultTheme();
theme.init();

/**
 * Set the theme to be used
 * @memberof services.Theme
 */
function SetTheme(newTheme) {
  log.info(`Changing theme to ${newTheme.constructor.name}`);
  theme = newTheme;
  theme.init();
}

/*
 * Get the theme
 * @memberof servicse.Theme
 */
function GetTheme() {
  return theme;
}

export {
  SetTheme,
  GetTheme
};
