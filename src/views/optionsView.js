'use strict';

import View from './view';
import {Theme, Player} from '../services';
import {Menu, TextMenuItem, MappingMenuItem, EnumMenuItem, MenuItemHighlighter, InputMenuItem} from '../components';

import {KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, TAP, RAPID_FIRE, KEY_BACK, KEY_ENTER} from '../constants/input';
import {MENU_OPTION} from '../constants/resources';
import {NUM_PLAYERS} from '../constants/signaling';



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
    let optionByKey = new Map();

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

        this.players = option.isGlobal() ? [Player.GamePlayer] : this.players;

        if (o.constructor.name === 'MappingOption') {
          entries.push(new MappingMenuItem(o.name, `${prefix}.${option.id}.${o.id}`, this.players));

        } else if (o.constructor.name === 'EnumOption') {
          entries.push(new EnumMenuItem(o.name, `${prefix}.${option.id}.${o.id}`, o.acceptedValues, this.players));

        } else if (o.constructor.name === 'TextOption') {
          entries.push(new InputMenuItem(o.name, `${prefix}.${option.id}.${o.id}`, this.players));
        }

        optionByKey.set(`${prefix}.${option.id}.${o.id}`, o);
      }

      entries.push(new TextMenuItem('Save', () => {

        // Remove the Save Entry
        entries.splice(-1, 1);

        // Store the values for all the players
        for (let e of entries) {
          for (let [playerId, value] of e.getValues()) {
            let player = Player.GetPlayer(playerId);
            player.optionStore.set(e.key, value);
            optionByKey.get(e.key).updateWorld(value, player, game);
          }
        }

        Player.SavePlayers();
        game.popView();
      }));
    }

    let keepIndex = false;
    if (option.id === 'mapping') {
      keepIndex = true;
    }

    this.menu = new Menu(MENU_OPTION, entries, width, height, Theme.GetTheme().createMenuOptionGC.bind(Theme.GetTheme()), true, MenuItemHighlighter, this.players, 'name', keepIndex);
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

  left(player) {
    this.menu.getSelected(player).move(-1, player);
  }

  right(player) {
    this.menu.getSelected(player).move(1, player);
  }

  update() {
    this.menu.update();
  }

  upgrade(modifications) {
    this.menu.upgrade(modifications);

    if (!Array.isArray(modifications)) {
      modifications = [modifications];
    }

    for (let m of modifications) {
      this.handleModification(m);
    }
  }

  handleModification(modification) {
    switch(modification.type) {
    case NUM_PLAYERS:
        // Nothing to implement yet because we cannot have an option
        // View dependent on the players loaded after we change the option
      break;
    }
  }

  onFocus() {

    let close = (player, fct, obj) => {
      return () => {
        fct.bind(obj)(player);
      };
    };

    for (let p of this.players) {

      let factories = new Map();

      factories.set([KEY_UP, RAPID_FIRE], close(p, this.up, this));
      factories.set([KEY_DOWN, RAPID_FIRE], close(p, this.down, this));

      factories.set([KEY_BACK, TAP], close(p, this.back, this));
      factories.set([KEY_ENTER, TAP], close(p, this.start, this));

      factories.set([KEY_LEFT, TAP], close(p, this.left, this));
      factories.set([KEY_RIGHT, TAP], close(p, this.right, this));

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
