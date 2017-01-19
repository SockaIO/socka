/* global require */

/**
 * @namespace services.FileManager
 */

'use strict';
import {loaders} from 'pixi.js';

import {RSC_AUDIO, RSC_CHART, RSC_BANNER, RSC_BACKGROUND} from '../constants/resources';

let endpoints = new Set();

/**
 * The file manager handkles all the I/O operations.
 *
 * It sets a level of abstraction between the different sources (http, local) and the game
 */


// Create the loader that will be used to get the data
/** @memberof services.FileManager **/
export let loader = new loaders.Loader();

/**
 * Redirect the loader to the right resource depending on the endpoint
 * @memberof services.FileManager
 */
function endpointMiddleware(resource, next) {

  // TODO: Rewrite the resource.url if necessary

  next();
}
loader.pre(endpointMiddleware);

/**
 * List all the packs available
 * @memberof services.FileManager
 */
export function ListPacks() {

  let packs = new Set();

  for (let e of endpoints) {
    packs.add(e.ListPacks());
  }

  return packs;
}

/**
 * List the songs in a pack
 * @memberof services.FileManager
 */
export function ListSongs(pack) {

  return pack.ListSongs();
}


/**
 * Add an endpoint
 *
 * @param {Endpoint} endpoint | Endpoint
 *
 * @memberof services.FileManager
 */
export function AddEndpoint(endpoint) {
  endpoints.add(endpoint);
}

/**
 * An endpoint is the reprensetation of a storage
 * @memberof services.FileManager
 * @interface
 */
export class Endpoint {
  
  /**
   * List the packs present in the endpoint
   * @returns {Pack|Set} Set of packs
   */
  getPacks() {}

}

/**
 * A Pack is a collection of songs
 * @memberof services.FileManager
 * @interface
 */
export class Pack {

  /**
   * List the Songs in the Pack
   * @returns {SongIndex|Set} Set of SongIndex
   */
  getSongs() {}
}


/**
 * Index of the content of a Song
 * @memberof services.FileManager
 */
export class SongIndex {

  constructor(name) {
    this.name = name;
  }

  /**
   * List the Resources available for that Song
   * @returns {Symbol|Set} Set of Resource symbols
   */
  listResources() {}

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
