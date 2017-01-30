'use strict';

import View from './view';
import {Theme} from '../services';

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

  getView() {
    return this.graphicComponent.sprite;
  }
}

export default LoadingView;
