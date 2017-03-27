'use strict';

import {MenuItem} from './menu';
import {Theme, Input} from '../services';
import {INPUT_UPDATE, INPUT_CANCEL, INPUT_ENTER} from '../constants/input';

/**
 * Mapping Option Menu Item
 * @extends MenuItem
 *
 */
export class MappingMenuItem extends MenuItem{

  constructor(option, prefix, players) {
    super();

    this.option = option;
    this.values = new Map();
    this.key = `${prefix}.${option.id}`;

    for (let player of players) {
      this.values.set(player.getId(), player.optionStore.get(this.key));
    }

    this.discard = true;
  }

  createGraphicComponent(width, height) {
    this.graphicComponent = Theme.GetTheme().createMappingMenuItemGC(width, height, this);
    return this.graphicComponent.sprite;
  }

  getValues () {
    return this.values;
  }

  enter(player) {

    Input.SetRawListener ((e) => {

      if (e.jsEvent.type === 'keyup') {
        return;
      }

      this.values.set(player.getId(), {key: e.key, controller: e.controller.getId ()});

      this.controller = e.controller;
      Input.RemoveRawListener();
    });
  }

  onSelected(player) {
    if (this.graphicComponent) {
      this.graphicComponent.onSelected(player.getId());
    }
  }

  onDeselected(player) {
    if (this.graphicComponent) {
      this.graphicComponent.onDeselected(player.getId());
    }
  }

  update() {
    this.graphicComponent.update();
  }

}


/**
 * Enum Option Menu Item
 * @extends MenuItem
 *
 */
export class EnumMenuItem extends MenuItem{

  constructor(option, prefix, players) {
    super();

    this.option = option;
    this.key = `${prefix}.${option.id}`;

    this.values = new Map();
    this.indexes = new Map();
    this.colors = new Map();

    for (let player of players) {
      let playerId = player.getId();
      let value = player.optionStore.get(this.key);

      this.values.set(playerId, value);
      this.indexes.set(playerId, this.getEnum().indexOf(value));
      this.colors.set(playerId, player.getColor());
    }
  }

  getIndexes() {
    return this.indexes;
  }

  getColor(playerId) {
    return this.colors.get(playerId);
  }

  createGraphicComponent(width, height) {
    this.graphicComponent = Theme.GetTheme().createEnumMenuItemGC(width, height, this);
    return this.graphicComponent.sprite;
  }

  getEnum () {
    return this.option.acceptedValues;
  }

  getValues () {
    return this.values;
  }

  move(direction, player) {
    const index = this.indexes.get(player.getId());
    const newIndex = index + direction;


    if (newIndex < this.getEnum().length && newIndex >= 0) {
      this.indexes.set(player.getId(), newIndex);
      this.values.set(player.getId(), this.getEnum()[newIndex]);

      this.graphicComponent.onChange(player.getId(), newIndex);
    }
  }

  onSelected(player) {
    if (this.graphicComponent) {
      this.graphicComponent.onSelected(player.getId());
    }
  }

  onDeselected(player) {
    if (this.graphicComponent) {
      this.graphicComponent.onDeselected(player.getId());
    }
  }

  update() {
    this.graphicComponent.update();
  }

}

/**
 * Text Option Menu Item
 * @extends MenuItem
 *
 */
export class InputMenuItem extends MenuItem{

  constructor(name, defaultValue) {
    super();

    //this.option = option;
    //this.key = `${prefix}.${option.id}`;

    this.name = name;
    this.value = defaultValue;
    this.backupValue = defaultValue;
  }

  createGraphicComponent(width, height) {
    this.graphicComponent = Theme.GetTheme().createInputMenuItemGC(width, height, this);
    return this.graphicComponent.sprite;
  }

  getValue () {
    return this.value;
  }

  enter() {

    this.backupValue = this.value;
    this.graphicComponent.onFocus();

    console.log('aaa');

    Input.SetInputListener(this.value, (type, e) => {

      console.log('ttt');

      switch(type) {
      case INPUT_CANCEL:
        this.graphicComponent.onBlur();
        this.value = this.backupValue;
        break;
      case INPUT_ENTER:
        this.graphicComponent.onBlur();
        this.value = e;
        break;
      case INPUT_UPDATE:
        this.value = e;
        break;
      }
    });

    return;
  }

  onSelected(player) {
    if (this.graphicComponent) {
      this.graphicComponent.onSelected(player.getId());
    }
  }

  onDeselected(player) {
    if (this.graphicComponent) {
      this.graphicComponent.onDeselected(player.getId());
    }
  }

  update() {
    this.graphicComponent.update();
  }
}

export class MenuItemHighlighter {

  constructor (menuItems, player) {
    this.graphicComponent = Theme.GetTheme().createMenuItemHighlighterGC(menuItems.map((x) => {return x.graphicComponent;}), player.getId(), player.getColor());
  }

  get sprite() {
    return this.graphicComponent.sprite;
  }

  update() {
    this.graphicComponent.update();
  }
}
