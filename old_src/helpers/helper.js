/* jshint esnext: true */
"use strict";

export class Subject {

  constructor() {
    this.observers = new Set();
  }

  addObserver(observer) {
    this.observers.add(observer);
  }

  removeObserver(observer) {
    this.observers.delete(observer);
  }

  notify(ev, extraObservers=[]) {
    for (let o of Array.from(this.observers).concat(extraObservers)) {
      o.onNotify(ev);
    }
  }

}
