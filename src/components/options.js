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

  constructor(name, key, players, defaultValues=[]) {
    super();

    this.values = new Map();
    this.indexes = new Map();

    this.name = name;
    this.key = key;

    this.numOptions = 4;
    this.players = [];

    if (defaultValues.size > 0) {
      this.values = defaultValues;

    } else {
      for (let player of players) {
        this.indexes.set(player.getId(), 0);
        this.players.push(player);
      }

      this.loadValues();
    }
  }

  loadValues() {

    this.values = new Map();

    for (let player of this.players) {
      // Clone the Value
      const optionValue = player.optionStore.get(this.key);
      let optionValueClone = {};

      for (let layout in optionValue) {
        optionValueClone[layout] = Object.assign({}, optionValue[layout]);
      }

      this.values.set(player.getId(), optionValueClone);
    }
  }

  getIndexes() {
    return this.indexes;
  }

  setIndex(playerId, idx) {
    this.indexes.set(playerId, idx);
    this.graphicComponent.onChange(playerId, idx);
  }

  createGraphicComponent(width, height) {
    this.graphicComponent = Theme.GetTheme().createMappingMenuItemGC(width, height, this);
    return this.graphicComponent;
  }

  getValues () {
    return this.values;
  }

  setLayoutValue(playerId, layout, value) {
    let currentValue = this.values.get(playerId);
    if (value === undefined) {
      delete currentValue[layout];
    } else {
      currentValue[layout] = value;
    }
  }

  setValue(playerId, value) {
    for (let layout of ['PRIMARY', 'SECONDARY']) {
      this.setLayoutValue(playerId, layout, value[layout]);
    }
  }

  enter(player) {

    Input.SetRawListener ((e) => {

      if (e.jsEvent !== undefined) {
        e.jsEvent.preventDefault();

        if (e.jsEvent.type === 'keyup') {
          return;
        }
      }

      const index = this.indexes.get(player.getId());
      let selectedPlayer = this.players[Math.floor(index / 2)];
      let selectedLayout = index % 2 === 0 ? 'PRIMARY' : 'SECONDARY';

      this.setLayoutValue(selectedPlayer.getId(), selectedLayout, {
        key: e.key,
        controller: e.controller.getId()
      });

      this.controller = e.controller;
      Input.RemoveRawListener();
    });
  }

  move(direction, player) {
    const index = this.indexes.get(player.getId());
    const newIndex = index + direction;


    if (newIndex < this.numOptions && newIndex >= 0) {
      this.indexes.set(player.getId(), newIndex);
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
 * Enum Option Menu Item
 * @extends MenuItem
 *
 */
export class EnumMenuItem extends MenuItem{

  constructor(name, key, acceptedValues, players, defaultValues=[]) {
    super();

    this.name = name;
    this.key = key;
    this.acceptedValues = acceptedValues;

    this.values = new Map();
    this.indexes = new Map();
    this.colors = new Map();

    for (let player of players) {
      let playerId = player.getId();
      let value;

      if (defaultValues.size > 0) {
        value = defaultValues.get(playerId);
      } else {
        value = player.optionStore.get(this.key);
      }

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
    return this.graphicComponent;
  }

  getEnum () {
    return this.acceptedValues;
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

  constructor(name, key, players, defaultValues=[]) {
    super();

    this.name = name;
    this.key = key;
    this.backupValue;

    this.values = new Map();

    for (let p of players) {

      let value;

      if (defaultValues.size > 0) {
        value = defaultValues.get(p.getId());
      } else {
        value = p.optionStore.get(this.key);
      }

      this.values.set(p.getId(), value);
      this.modifyingPlayerId = p.getId ();
    }

  }

  createGraphicComponent(width, height) {
    this.graphicComponent = Theme.GetTheme().createInputMenuItemGC(width, height, this);
    return this.graphicComponent;
  }

  getValues () {
    return this.values;
  }

  getValue () {
    return this.values.get(this.modifyingPlayerId);
  }

  enter(player) {


    this.modifyingPlayerId = player.getId();
    this.backupValue = this.values.get(this.modifyingPlayerId);
    this.graphicComponent.onFocus();

    Input.SetInputListener(this.getValue(), (type, e) => {

      switch(type) {
      case INPUT_CANCEL:
        this.graphicComponent.onBlur();
        this.values.set(this.modifyingPlayerId, this.backupValue);
        break;
      case INPUT_ENTER:
        this.graphicComponent.onBlur();
        this.values.set(this.modifyingPlayerId, e);
        break;
      case INPUT_UPDATE:
        this.values.set(this.modifyingPlayerId, e);
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

export class ChartMenuItemHighlighter extends MenuItemHighlighter{
  constructor (menuItems, player) {
    super(menuItems, player);
    this.graphicComponent = Theme.GetTheme().createChartMenuItemHighlighterGC(menuItems.map((x) => {
      return x.graphicComponent;
    }), player.getId(), player.getColor());
  }
}
