/* jshint esnext: true */
"use strict";

class Subject {

  constructor() {
    this.observers = new Set();
  }

  addObserver(observer) {
    this.observers.add(observer);
  }

  removeObserver(observer) {
    this.observers.delete(observer);
  }

  notify(note, ev) {
    for (let o of this.observers) {
      o.onNotify(note, ev);
    }
  }

}
