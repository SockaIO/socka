'use strict';

import View from './view';
import {Theme, Player} from '../services';

import {RSC_SONG, RSC_BANNER} from '../constants/resources';

import {KEY_UP, KEY_DOWN, TAP, RAPID_FIRE, KEY_BACK, KEY_ENTER, KEY_LEFT, KEY_RIGHT} from '../constants/input';

/**
 * View Class for a simple menu
 *
 * @extends View
 * @memberof views
 */
class SongMenuView extends View {
  constructor(entries, game) {
    super(game);

    let width, height;
    [width, height] = game.getScreenSize();

    this.selectedEntry = 0; 
    this.entries = entries;

    this.graphicComponent = Theme.GetTheme().createSongMenuGC(width, height, this);
    this.update();

    this.selectedSong = {
      name: null,
    };
  }

  back() {
    this.game.popView();
  }

  up() {

    if (this.selectedEntry === 0) {
      this.selectedEntry = this.entries.length - 1;
    } else {
      this.selectedEntry--;
    }
  }

  down() {
    if (this.selectedEntry >= this.entries.length - 1) {
      this.selectedEntry = 0;
    } else {
      this.selectedEntry++;
    }
  }

  right() {
    if (this.selectedSong.charts === null) {
      return;
    }

    if (this.selectedChart >= this.selectedSong.charts.length - 1) {
      this.selectedChart = 0;
    } else {
      this.selectedChart++;
    }
  }

  left() {
    if (this.selectedSong.charts === null) {
      return;
    }

    if (this.selectedChart === 0) {
      this.selectedChart = this.selectedSong.charts.length - 1;
    } else {
      this.selectedChart--;
    }
  }

  start() {
    this.entries[this.selectedEntry].action(this.selectedChart);
  }

  update() {

    if (this.selectedSong !== undefined && this.entries[this.selectedEntry].name != this.selectedSong.name) {
      let selectedEntry = this.entries[this.selectedEntry];
      this.selectedSong.name = selectedEntry.name;

      selectedEntry.song.load(RSC_SONG).then((song) => {

        // Check if we are still on the same song
        // TODO: Check if it works
        if (!this.selectedSong.name === selectedEntry.name) {
          return;
        }

        this.selectedSong.charts = song.charts;
        this.selectedChart = 0;
        this.graphicComponent.updateSongDisplay();
      })
      .catch(() => {
        this.selectedSong.charts = undefined;
        this.graphicComponent.updateSongDisplay();
      });

      selectedEntry.song.load(RSC_BANNER).then((banner) => {

        // Check if we are still on the same song
        // TODO: Check if it works
        if (!this.selectedSong.name === selectedEntry.name) {
          return;
        }

        this.selectedSong.banner = banner;
        this.graphicComponent.updateSongDisplay();
      })
      .catch(() => {
        this.selectedSong.banner = null;
        this.graphicComponent.updateSongDisplay();
      });
    }

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
export default SongMenuView;
