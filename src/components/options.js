'use strict';

import {MenuItem} from './menu';
import {Theme, Input} from '../services';

/**
 * Mapping Option Menu Item
 * @extends MenuItem
 *
 */
export class MappingMenuItem extends MenuItem{

  constructor(option) {
    super();
    this.option = option;
    this.value = option.default;
    this.controller = null;

    this.discard = true;
  }

  createGraphicComponent(width, height) {
    this.graphicComponent = Theme.GetTheme().createMappingMenuItemGC(width, height, this);
    return this.graphicComponent.sprite;
  }

  enter() {
    this.discard = true;
    Input.SetRawListener ((e) => {
      if (this.discard) {
        this.discard = false;
        return;
      }

      this.value = e.key;
      this.controller = e.controller;
      Input.RemoveRawListener();
    });
  }

  update() {
    this.graphicComponent.update();
  }

}

