'use strict';
import {loaders} from 'pixi.js';

import {RSC_AUDIO, RSC_CHART, RSC_BANNER, RSC_BACKGROUND} from '../constants/resources';

/**
 * The file manager handkles all the I/O operations.
 *
 * It sets a level of abstraction between the different sources (http, local) and the game
 */


// Create the loader that will be used to get the data
let loader = new loaders.Loader();

/**
 * Redirect the loader to the right resource depending on the endpoint
 */
function endpointMiddleware(resource, next) {

  // TODO: Rewrite the resource.url if necessary

  next();
}
loader.pre(endpointMiddleware);


// Endpoints for the data
let endpoints = [];

/**
 * List all the packs available
 */
export function ListPacks() {
  
  // TODO: Implement
  return [new Pack('Vocaloid')];
}

/**
 * List the songs in a pack
 */
export function ListSongs(pack) {

  // TODO: Implement
  return [new SongIndex('Astro Trooper')];
}


/**
 * Add an endpoint
 *
 * @param {String} Address | Address of the endpoint
 * @param {Constant} Type | Type of endpoint
 */
export function AddEndpoint(address, type) {

  //TODO: Implement;
}


/**
 * A Pack is a collection of Songs
 */
class Pack {
  constructor(name, songs=null) {
    this.name = name;
    this.songs = songs;
  }

  /**
   * Get the Songs in the pack
   *
   * @return {Song|Array|Promise} Promise of a list of Songs
   */
  getSongs() {
    if (this.songs === null) {
      return this.loadSongs();
    }

    return new Promise(this.songs);
  }

  /**
   * Load the songs from the pack
   *
   * @return {Song|Array|Promise} Promise of a list of Songs
   */
  loadSongs() {
    // TODO: Implement
    return new Promise([new SongIndex('Vocaloid')]);
  }

}


/**
 * Index of the content of a Song
 */
class SongIndex {

  constructor(name) {
    this.name = name;
  }

  /**
   * List the Resources available for that Song
   */
  listResources() {
    // TODO: Implement
    return [RSC_AUDIO, RSC_BANNER, RSC_BACKGROUND, RSC_CHART];
  }

  /**
   * Load the resource
   *
   * @param {Constant|Array} type | Resources to load
   * @return {Object} resource | The requested resource
   */
  load(type) {
    //TODO: Implement


    let url;
    switch(type) {

    case RSC_BACKGROUND:
      loader.add(require('../../astro/bg.png'));
      return new Promise((resolve) => {
        loader.load(resolve);
      }).then(() => {
        return loader.resources[require('../../astro/bg.png')].texture;
      });

    case RSC_AUDIO:
      url = require('../../astro/astro.ogg');
      break;
    case RSC_CHART:
      url = require('../../astro/astro.sm');
      break;
    }

    return fetch(url, {credentials: 'same-origin'}).then((resp) => {

      if  (!resp.ok) {
        throw resp;
      }

      switch(type) {
      case RSC_AUDIO:
        return resp.arrayBuffer();
      case RSC_CHART:
        return resp.text();
      }
    });

  }
}
