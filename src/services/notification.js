'use strict';

/**
 * @namespace services.Notification
 */

import {GetTheme} from './theme';
import log from 'loglevel';

let graphicComponent = {
  log: () => {
    log.debug('Notification Service not initialized');
  },
  queue: null,
  dismiss: function () {
    this.log();
  },
  notify: function (...args) {
    // Queue the call for later
    this.queue = args;
    this.log();
  }
};

/**
 * Init the notification
 * We need to be able to defer init to let the time to set
 * the theme
 *
 * @param {Game} game - Game Object
 */
export function Init(game) {
  let queue = graphicComponent.queue;
  graphicComponent = GetTheme().createNotificationGC(game.width, game.height);

  if (queue !== null) {
    Notify(...queue);
  }
}

export function GetSprite() {
  if (graphicComponent.sprite === undefined) {
    log.error('Notification Service not initialized');
  }
  return graphicComponent.sprite;
}

/**
 * Notify the user
 *
 * @param {String} msg message
 * @parem {duration} duration Duration in ms
 */
export function Notify(msg, duration=5000) {
  graphicComponent.notify(msg, duration);
}

/**
 * Dismiss any displayed notification
 *
 */
export function Dismiss() {
  graphicComponent.dismiss();
}
