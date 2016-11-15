/* jshint esnext: true */
"use strict";

/**
 * View Class for a simple menu
 *
 * @extends View
 */
class MenuView extends View {

  constructor() {
    super();
    this.container = new PIXI.Container();
  }

  up () {
    console.log('UPPP');
  }

  update() {
  }

  getView() {
    return this.container;
  }

  onFocus() {

    console.log('Setting the controller factories');
    let factories = new Map();

    factories.set([KEY_UP, TAP], () => {this.up ()});
    for (let c of Controller.Controllers.values()) {
      c.setCommands(factories);
    }
  }

}
