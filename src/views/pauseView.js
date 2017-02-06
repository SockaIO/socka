'use strict';

import {Player, Theme} from '../services';
import View from './view';
import {TAP, KEY_BACK, KEY_ENTER} from '../constants/input';

/**
 * View Class for a simple menu
 *
 * @extends View
 * @memberof views
 */
class PauseView extends View {
  constructor(game) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    this.selectedEntry = 0; 

    this.graphicComponent = Theme.GetTheme().createPauseGC(width, height, this);
    this.update();
  }

  back() {
    this.game.popView();
    this.game.popView();
  }

  enter() {
    this.game.popView();
  }

  update() {
    this.graphicComponent.update();
  }

  onFocus() {

    let factories = new Map();

    factories.set([KEY_BACK, TAP], () => {this.back ();});
    factories.set([KEY_ENTER, TAP], () => {this.enter ();});

    for (let p of Player.GetPlayers()) {
      p.mapping.setCommands(factories);
    }

    this.graphicComponent.sprite.visible = true;
  }

  onBlur() {
    this.graphicComponent.sprite.visible = false;
  }

  getView() {
    return this.graphicComponent.sprite;
  }
}
export default PauseView;
