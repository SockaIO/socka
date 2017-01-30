'use strict';

/**
 * Subject class for the observer pattern
 * @memberof helpers
 */
class Subject {

  constructor() {
    this.observers = new Set();
  }

  /**
   * Add an Observer to the subject
   * @param {Observer} observer | Observer to add
   */
  addObserver(observer) {
    this.observers.add(observer);
  }

  /**
   * Remove an Observer to the subject
   * @param {Observer} observer | Observer to remove
   */
  removeObserver(observer) {
    this.observers.delete(observer);
  }

  /**
   * Notify the registered observers + the extra observers passed in parameters
   * @param {Object} ev | Event Object
   * @paran {Observer|Array} extraObserver | xtra observesr that will also be notified
   */
  notify(ev, extraObservers=[]) {
    for (let o of Array.from(this.observers).concat(extraObservers)) {
      o.onNotify(ev);
    }
  }

}

export default Subject
