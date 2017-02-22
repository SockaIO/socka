'use strict';

import {MenuItem} from './menu';
import {Theme, Input} from '../services';

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

    for (let player of players) {
      this.values.set(player.getId(), player.optionStore.get(`${prefix}.${option.id}`));
    }

    this.controller = null;
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
    this.discard = true;
    Input.SetRawListener ((e) => {
      if (this.discard) {
        this.discard = false;
        return;
      }

      this.values.set(player.getId(), e.key);

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

