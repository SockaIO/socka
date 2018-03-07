'use strict';

import * as PIXI from 'pixi.js';
import {TweenLite} from 'gsap';

import {theme as interfaces} from '../../src/interfaces';

/**
 * Notification
 */
export class NotificationDefaultGraphicComponent extends interfaces.NotificationGraphicComponent {

  constructor(theme, width, height) {
    super(theme);
    this.width = width;
    this.height = height;

    // Parameters
    this.fontSize = 25;
    this.margin = 50;
    this.padding = 15;

    this.easeDuration = 0.3;

    this.sprite = new PIXI.Container();
    this.notification = null;
  }

  createNotification(msg) {

    const txtFormat = {
      font: `${this.fontSize}px clementeRegular`,
      align: 'left',
      maxWidth: this.width - 2 * this.margin
    };
    let txt = new PIXI.extras.BitmapText(msg, txtFormat);

    const height = txt.height + 2 * this.padding;
    let width = txt.width + 2 * this.padding + 5;
    width = Math.max(width, this.width / 4);


    let container = new PIXI.Container();

    let background = new PIXI.Graphics()
              .beginFill(0x222222, 0.7)
              .drawRect(0, 0, width, height)
              .endFill();

    container.addChild(background);

    let border = new PIXI.Graphics();
    const thick = 1;
    border.lineStyle(thick, 0xffffff)
          .moveTo(thick, thick)
          .lineTo(thick, height - thick)
          .lineTo(width - thick, height - thick)
          .lineTo(width - thick, thick)
          .lineTo(thick, thick)
          .lineStyle(0, 0x000000);

    border.alpha = 0.7;
    container.addChild(border);

    txt.x = this.padding;
    txt.y = this.padding;
    container.addChild(txt);

    this.sprite.addChild(container);

    container.x = this.width / 2 - container.width / 2;
    container.targetY = 20;
    container.alpha = 0;

    this.notification = container;
  }

  display(duration) {
    if (this.notification === undefined) {
      return;
    }

    const target = {
      y: this.notification.targetY,
      alpha: 1,
      onComplete: () => {
        this.timeoutFct = () => {

          this.timeout =  undefined;

          let target = {
            y: 0,
            alpha: 0,
          };

          // Disappearance animation
          TweenLite.to(this.notification, this.easeDuration, target);
        };

        // Timer until disappearance
        this.timeout = setTimeout(this.timeoutFct, duration);
      }
    };

    // Appearance animation
    TweenLite.to(this.notification, this.easeDuration, target);
  }

  notify(msg, duration) {
    this.dismiss();
    this.createNotification(msg);
    this.display(duration);
  }

  dismiss() {
    // If the notification is still displayed
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
      this.timeoutFct();
    }
  }

}
