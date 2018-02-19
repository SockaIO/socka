'use strict';

import View from './view';
import {Theme, Player} from '../services';
import {RSC_BANNER} from '../constants/resources';

class LoadingView extends View {
  constructor(width, height, game, song, percentage=0, text='Loading...') {
    super(game);
    this.graphicComponent = Theme.GetTheme().createLoadingViewGC(width, height);
    this.parts = 0;
    this.graphicComponent.text = text;
    this.graphicComponent.percentage = percentage;
    this.graphicComponent.songName = song.name;

    song.load(RSC_BANNER).then((banner) => {
      this.graphicComponent.banner = banner;
    });
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
