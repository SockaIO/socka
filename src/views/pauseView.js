'use strict';

import {Player, Theme, Options} from '../services';
import View from './view';
import WaitView from './waitView';
import OptionsView from './optionsView';
import {TAP, KEY_BACK, KEY_ENTER, KEY_UP, KEY_DOWN, RAPID_FIRE} from '../constants/input';
import {Menu, TextMenuItem} from '../components';
import {MENU_PAUSE} from '../constants/resources';

/**
 * View Class for a simple menu
 *
 * @extends View
 * @memberof views
 */
class PauseView extends View {
  constructor(game, reset) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    let items = [];

    items.push(new TextMenuItem('Resume', () => {
      this.game.popView();
    }));

    items.push(new TextMenuItem('Restart', () => {

      let waitView = new WaitView(game, () => {
        // Pop the pause also
        this.game.popView();
      });

      this.game.pushView(waitView, false);
      reset();
    }));

    // TODO: Improve lookup
    let soundOption;
    for (let o of Options.GetRoot().getChildren()) {
      if (o.id === 'sound') {
        soundOption = o;
        break;
      }
    }

    items.push(new TextMenuItem('Sound', () => {
      // TODO: More resilient non-dependency on the Sound Option position in the Option tree
      let o = new OptionsView(soundOption, '.root', game, false);
      game.pushView(o);
    }));

    items.push(new TextMenuItem('Quit', () => {
      this.game.popView();
      this.game.popView();
    }));

    this.menu = new Menu(MENU_PAUSE, items, width, height, Theme.GetTheme().createMenuGC.bind(Theme.GetTheme()));
    this.graphicComponent = Theme.GetTheme().createPauseGC(width, height, this.menu);

    this.update();
  }

  back() {
    this.game.popView();
  }

  up() {
    this.menu.move(-1);
  }

  down() {
    this.menu.move(1);
  }

  start() {
    this.menu.getSelected().action();
  }


  update() {
    this.graphicComponent.update();
  }

  onFocus() {

    let factories = new Map();

    factories.set([KEY_UP, RAPID_FIRE], () => {this.up ();});
    factories.set([KEY_DOWN, RAPID_FIRE], () => {this.down ();});

    factories.set([KEY_BACK, TAP], () => {this.back ();});
    factories.set([KEY_ENTER, TAP], () => {this.start ();});

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
