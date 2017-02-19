'use strict';

import View from './view';
import {Theme, Player} from '../services';
import {Menu, TextMenuItem} from '../components';

import {KEY_UP, KEY_DOWN, TAP, RAPID_FIRE, KEY_BACK, KEY_ENTER} from '../constants/input';

/**
 * View Class for a simple menu
 *
 * @extends View
 * @memberof views
 */
class MenuView extends View {
  constructor(entries, game) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    let items = [];

    for (let e of entries) {
      items.push(new TextMenuItem(e.name, e.action));
    }

    this.menu = new Menu(items, width, height, Theme.GetTheme().createMenuGC, true);
    this.sprite = this.menu.sprite;
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
    this.menu.update();
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

    this.sprite.visible = true;
  }

  onBlur() {
    this.sprite.visible = false;
  }

  getView() {
    return this.sprite;
  }
}
export default MenuView;
