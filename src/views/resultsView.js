'use strict';

import View from './view';
import {Theme, Player} from '../services';
import {RSC_BANNER, RSC_BACKGROUND} from '../constants/resources';
import {TAP, KEY_BACK, KEY_ENTER} from '../constants/input';

/**
 * View class for the results display
 *
 * @extends View
 * @memberof views
 */
class ResultsView extends View {

  constructor(game, song, results) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    this.graphicComponent = Theme.GetTheme().createResultsGC(width,
                                                             height,
                                                             song.load(RSC_BACKGROUND),
                                                             song.load(RSC_BANNER),
                                                             results);
  } 

  quit() {
    this.game.popView();
  }

  onFocus() {

    let factories = new Map();

    factories.set([KEY_BACK, TAP], () => {this.quit ();});
    factories.set([KEY_ENTER, TAP], () => {this.quit ();});

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
