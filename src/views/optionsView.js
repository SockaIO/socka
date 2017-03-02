'use strict';

import View from './view';
import {Theme, Player, Input} from '../services';
import {Menu, TextMenuItem, MappingMenuItem} from '../components';

import {KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, TAP, RAPID_FIRE, KEY_BACK, KEY_ENTER} from '../constants/input';



/**
 * Create a menu item to browse an option
 * @param {OptionFolder|OptionGroup} option The option to browse
 * @param {Game} game The game Component
 * @returns {TextMenuItem} Menu Entry
 */
function createEntry(option, prefix, game) {
  return new TextMenuItem(option.getName(), () => {
    let o = new OptionsView(option, prefix, game);
    game.pushView(o);
  });
}

/**
 * Class for browsing and modifying options
 *
 * @extends View
 * @memberof views
 */
export default class OptionsView extends View {

  constructor(option, prefix, game) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    this.option = option;
    this.players = Array.from(Player.GetPlayers ());

    let entries = [];

    // We have a folder
    if (option.constructor.name === 'OptionFolder') {

      for (let c of option.getChildren()) {
        entries.push(createEntry(c,`${prefix}.${option.id}`, game));
      }

    }
    // We have an option Group
    else if (option.constructor.name === 'OptionGroup')
    {

      for (let o of option.getOptions()) {

        if (o.constructor.name === 'MappingOption') {
          entries.push(new MappingMenuItem(o, `${prefix}.${option.id}`, this.players));
        }
      }

      entries.push(new TextMenuItem('Save', () => {

        // Remove the Save Entry
        entries.splice(-1, 1);

        // Store the values for all the players
        for (let e of entries) {
          for (let [playerId, value] of e.getValues()) {
            let player = Player.GetPlayer(playerId);
            player.optionStore.set(e.key, value);
            e.option.updateWorld(value, player);
          }
        }

        Player.SavePlayers();
        game.popView();
      }));
    }

    this.menu = new Menu(entries, width, height, Theme.GetTheme().createMenuOptionGC, false, this.players);
    this.sprite = this.menu.sprite;
    this.update();

  }

  back() {
    this.game.popView();
  }

  up(player) {
    this.menu.move(-1, player);
  }

  down(player) {
    this.menu.move(1, player);
  }

  start(player) {
    this.menu.getSelected(player).enter(player);
  }

  update() {
    this.menu.update();
  }

  onFocus() {

    let close = (player, fct, obj) => {
      return () => {
        fct.bind(obj)(player);
      };
    };

    for (let p of Player.GetPlayers()) {

      let factories = new Map();

      factories.set([KEY_UP, RAPID_FIRE], close(p, this.up, this));
      factories.set([KEY_DOWN, RAPID_FIRE], close(p, this.down, this));

      factories.set([KEY_BACK, TAP], close(p, this.back, this));
      factories.set([KEY_ENTER, TAP], close(p, this.start, this));

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
