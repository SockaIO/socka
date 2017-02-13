'use strict';

import View from './view';
import {Theme, Player} from '../services';
import {RSC_BANNER, RSC_BACKGROUND} from '../constants/resources';

/**
 * View class for the results display
 *
 * @extends View
 * @memberof views
 */
class ResultsView extends View {

  constructor(game, song, engines) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    let results = [];

    for (let e of engines) {
      let r = {
        stats: e.statsTracker.getResults(),
        combo: e.combo.maxi,
        score: e.score.score
      };

      results.push(r);
    }

    this.graphicComponent = Theme.GetTheme().createResultsGC(width,
                                                             height,
                                                             song.load(RSC_BACKGROUND),
                                                             song.load(RSC_BANNER),
                                                             results);
  } 

  onFocus() {

    let factories = new Map();

    for (let p of Player.GetPlayers()) {
      p.mapping.setCommands(factories);
    }
  }


  update() {
    this.graphicComponent.update();
  }

  getView() {
    return this.graphicComponent.sprite;
  }

}

export default ResultsView;
