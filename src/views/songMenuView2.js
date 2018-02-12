'use strict';

import View from './view';
import {Theme, Player} from '../services';

import {MENU_SONG, MENU_CHART} from '../constants/resources';
import {Menu, SongMenuItem, TextMenuItem} from '../components';

import {KEY_UP, KEY_DOWN, TAP, RAPID_FIRE, KEY_BACK, KEY_ENTER, KEY_LEFT, KEY_RIGHT} from '../constants/input';

/**
 * View Class for the Song Menu
 *
 * @extends View
 * @memberof views
 */
export default class SongMenuView extends View {
  constructor(entries, game) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();
    this.entries = entries;

    const bannerSetter = (banner) => {
      this.setBanner(banner);
    };

    const chartSetter = (charts) => {
      this.setCharts(charts);
    };

    // Song Menu
    let songs = [];
    for (let e of entries) {
      songs.push(new SongMenuItem(e, bannerSetter, chartSetter));
    }

    const menuGC = Theme.GetTheme().createSongMenu3GC.bind(Theme.GetTheme());
    const songMenuWidth = width / 2;
    const songMenuHeight = height;
    this.songMenu = new Menu(MENU_SONG, songs, songMenuWidth, songMenuHeight, menuGC);

    // Chart Menu
    // It will be populated when a song is selected
    const optionMenuGC = Theme.GetTheme().createMenuOptionGC.bind(Theme.GetTheme());
    const chartMenuWidth = width / 4;
    const chartMenuHeight = height / 3;
    this.chartMenu = new Menu(MENU_CHART, [new TextMenuItem('')], chartMenuWidth, chartMenuHeight, optionMenuGC);

    this.graphicComponent = Theme.GetTheme().createSongMenuGC(width, height, this);
    this.update();
  }

  setBanner(banner) {
    this.graphicComponent.setBanner(banner);
  }

  setCharts(charts) {
    // Filter the Charts for single player only
    // TODO: Handle more game modes
    const allowedTypes = ['dance-single', 'SINGLE'];
    let chartsFiltered = charts.filter((c) => {return allowedTypes.includes(c.type);});

    let entries = [];
    for (let c of chartsFiltered) {
      entries.push(new TextMenuItem(`${c.difficulty} (${c.meter})`));
    }

    // Update the Menu
    this.chartMenu.setEntries(entries);

    // Update the View GC
    this.graphicComponent.updateChartMenu();
  }

  back() {
    this.game.popView();
  }

  up() {
    this.songMenu.move(-1);
  }

  down() {
    this.songMenu.move(1);
  }

  right() {
    this.chartMenu.move(1);
  }

  left() {
    this.chartMenu.move(-1);
  }

  start() {
  }

  update() {
    this.graphicComponent.update();
  }

  onFocus() {

    let factories = new Map();

    factories.set([KEY_UP, RAPID_FIRE], () => {this.up ();});
    factories.set([KEY_DOWN, RAPID_FIRE], () => {this.down ();});

    factories.set([KEY_LEFT, TAP], () => {this.left ();});
    factories.set([KEY_RIGHT, TAP], () => {this.right ();});

    factories.set([KEY_BACK, TAP], () => {this.back ();});
    factories.set([KEY_ENTER, TAP], () => {this.start ();});

    for (let p of Player.GetPlayers()) {
      p.mapping.setCommands(factories);
    }

    this.graphicComponent.sprite.visible = true;
  }

  onBlur() {
    this.graphicComponent.sprite.visible = false;
  }

  onPoped() {
    for (let e of this.entries) {
      e.song.freeResources();
    }
  }


  get selectedSubEntry() {
    return this.selectedSubEntries[this.selectedEntry];
  }

  set selectedSubEntry(val) {
    this.selectedSubEntries[this.selectedEntry] = val;
  }

  get currentEntry() {
    return this.entries[this.selectedEntry];
  }

  getView() {
    return this.graphicComponent.sprite;
  }

  get selections() {
    let res = {};
    let i = 0;
    for (let entry of this.entries) {
      if (entry.subEntries) {
        res[entry.name] = entry.subEntries[this.selectedSubEntries[i]];
      }
      i++;
    }
    return res;
  }
}

