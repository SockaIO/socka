'use strict';

import View from './view';
import EngineView from './engineView';

import {Theme, Player} from '../services';

import {RSC_SONG, RSC_BANNER, MENU_SONG, MENU_CHART} from '../constants/resources';
import {Menu, SongMenuItem, TextMenuItem, ChartMenuItem, ChartMenuItemHighlighter} from '../components';

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

    const songSetter = (song) => {
      this.setSong(song);
    };

    // Song Menu
    let songs = [];
    for (let e of entries) {
      songs.push(new SongMenuItem(e, songSetter));
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

    this.chartMenu = new Menu(MENU_CHART, [new TextMenuItem('')], chartMenuWidth, chartMenuHeight, optionMenuGC, false, ChartMenuItemHighlighter, Array.from(Player.GetPlayers()));

    this.graphicComponent = Theme.GetTheme().createSongMenuGC(width, height, this);
    this.update();
  }

  setSong(theSong) {
    theSong.load(RSC_SONG).then((song) => {

      // TODO: Prevent change if we are not on that song anymore

      // Update the Chart Menu
      this.setCharts(song.charts);
      theSong.charts = song.charts;

      // Update the Banner
      theSong.load(RSC_BANNER).then((banner) => {
        this.setBanner(banner);
      });

    });
  }


  setBanner(banner) {
    this.graphicComponent.setBanner(banner);
  }

  setCharts(charts) {
    // Filter the Charts for single player only
    // TODO: Handle more game modes
    const allowedTypes = ['dance-single', 'SINGLE'];
    const sortFct = (a, b) => {
      let aa = parseInt(a.meter, 10);
      let bb = parseInt(b.meter, 10);
      return aa - bb;
    };

    let chartsFiltered = charts.filter((c) => {return allowedTypes.includes(c.type);}).sort(sortFct);

    let entries = [];
    for (let c of chartsFiltered) {
      entries.push(new ChartMenuItem(c));
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

  right(player) {
    this.chartMenu.move(1, player);
  }

  left(player) {
    this.chartMenu.move(-1, player);
  }

  start() {

    const players = Player.GetPlayers();
    let chart = new Map();
    const song = this.songMenu.getSelected().song.song;


    // Start loading the Resources
    song.loadResources();

    for (let p of players) {
      //Find the chart for the player
      let c = this.chartMenu.getSelected(p).chart;
      //Find the Index of the Chart
      chart.set(p.getId(), song.charts.indexOf(c));
    }

    // Start the Engine View and push it
    let gView = new EngineView(song, chart, Player.GetPlayers(), this.game);
    this.game.pushView(gView);
  }

  update() {
    this.graphicComponent.update();
  }

  onFocus() {

    let factories = new Map();

    let close = (player, fct, obj) => {
      return () => {
        fct.bind(obj)(player);
      };
    };

    for (let p of Player.GetPlayers()) {

      factories.set([KEY_UP, RAPID_FIRE], close(p, this.up, this));
      factories.set([KEY_DOWN, RAPID_FIRE], close(p, this.down, this));

      factories.set([KEY_BACK, TAP], close(p, this.back, this));
      factories.set([KEY_ENTER, TAP], close(p, this.start, this));

      factories.set([KEY_LEFT, TAP], close(p, this.left, this));
      factories.set([KEY_RIGHT, TAP], close(p, this.right, this));

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

