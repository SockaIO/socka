'use strict';

import View from './view';
import {Theme, Player} from '../services';

/**
 * Wait Class to prevent further action on a menu after selection
 * Could be updated to include loading cue graphic Element
 *
 * @extends View
 * @memberof views
 */
export default class WaitView extends View {
  // Empty

  constructor(game, popedCallback=null) {
    super(game);

    this.popedCallback = popedCallback;

    this.graphicComponent = Theme.GetTheme().createWaitViewGC(game.width, game.height);
  }

  getView() {
    return this.graphicComponent.sprite;
  }

  onPoped() {
    if (this.popedCallback !== null) {
      this.popedCallback();
    }
  }

  onFocus() {
    for (let p of Player.GetPlayers()) {
      p.mapping.resetBindings();
    }
  }
}
