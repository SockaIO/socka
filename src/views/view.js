'use strict';

/**
 * View Class. Represent a 'screen' of the game. It provides what is to be displayed in the window.
 *
 * When a view is in focus its update method is called. It also implements
 * other methods that are callbacks for special events.
 *
 * @interface
 */
export default class View {

  constructor(game) {
    this.game = game;
  }

  /**
   * Main loop to update the view content
   */
  update() {}

  /**
   * Called when the view is pushed on the stack
   */
  onPushed() {}

  /**
   * Called when the view is poped from the stack
   */
  onPoped() {}

  /**
   * Called when the view gets focus (i.e the view is pushed
   * or the view above it is poped).
   */
  onFocus() {}

  /**
   * Called when the view looses focus (i.e the view is poped
   * or a view is pushed above it).
   */
  onBlur() {}

  /**
   * Return the pixi container of the view
   *
   * @return {PIXI.Container} The view Container
   */
  getView() {}
}
