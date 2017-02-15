'use strict';

import View from './view';
import {Theme, Player} from '../services';

class LoadingView extends View {
  constructor(width, height, game, percentage=0, text='Loading...') {
    super(game);
    this.graphicComponent = Theme.GetTheme().createLoadingViewGC(width, height);
    this.parts = 0;
    this.graphicComponent.text = text;
    this.graphicComponent.percentage = percentage;
  }

  addPart() {
    this.parts++;
  }

  loadPart(text) {
    this.graphicComponent.percentage = this.graphicComponent.percentage + 1/this.parts;
    this.graphicComponent.text = text;
  }

  // No input on loading screen
  onFocus() {

    let factories = new Map();

    for (let p of Player.GetPlayers()) {
      p.mapping.setCommands(factories);
    }

    this.graphicComponent.sprite.visible = true;
  }



  getView() {
    return this.graphicComponent.sprite;
  }
}

export default LoadingView;
