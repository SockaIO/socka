'use strict';

import {DefaultTheme} from '../../themes/DefaultTheme';
import log from 'loglevel';

log.info('Setting default Theme');
let theme = new DefaultTheme();
theme.init();

/**
 * Set the theme to be used
 */
export function SetTheme(newTheme) {
  log.info(`Changing theme to ${newTheme.constructor.name}`);
  theme = newTheme;
  theme.init();
}

/*
 * Get the theme
 */
export function GetTheme() {
  return theme;
}
