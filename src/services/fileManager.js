/**
 * @namespace services.FileManager
 */

'use strict';

import {RSC_AUDIO, RSC_BANNER, RSC_BACKGROUND, RSC_SONG, RSC_CHART} from '../constants/resources';
import * as PIXI from 'pixi.js';
import {Song} from './songParser';

import log from 'loglevel';

let endpoints = new Set();

/**
 * List all the packs available
 * @memberof services.FileManager
 * @returns {Packs|Set|Promise} packs in the loaded endpoints
 */
export function ListPacks() {

  let packs = new Set();
  let packsP = [];

  // Wait for all the endpoints to be ready
  return Promise.all(endpoints).then((endpointsV) => {

    for (let e of endpointsV) {
      packsP.push(e.getPacks());
    }

    return Promise.all(packsP).then((endpointPacks) => {
      for (let ep of endpointPacks) {
        for (let p of ep) {
          packs.add(p);
        }
      }

      return packs;
    }, (err) => {
      log.error(`Error while getting the packs ${JSON.stringify(err)}`);
    });
  }, () => {

    // Remove the Failing endpoints from the list
    for (let p of endpoints) {
      p.catch((err) => {
        log.error(`Endpoint creation failed with error ${JSON.stringify(err)}.`);
        endpoints.delete(p);
      });
    }

    // Retry to list the packs
    return ListPacks();
  });
}

/**
 * Add an endpoint
 *
 * @param {Endpoint} endpoint | Endpoint
 *
 * @memberof services.FileManager
 */
export function AddEndpoint(endpoint) {
  endpoints.add(Promise.resolve(endpoint));
}


/**
 * Remove an endpoint
 *
 * @param {Endpoint|Promise} endpoint | Endpoint
 * @return {Boolean} true if the endpoint was found
 *
 * @memberof services.FileManager
 */
export function RemoveEndpoint(endpoint) {
  return endpoints.delete(endpoint);
}


/**
 * An endpoint is the reprensetation of a storage
 * @memberof services.FileManager
 * @interface
 */
export class Endpoint {

  constructor() {
    this.packs = new Set();
  }

  /**
   * List the packs present in the endpoint
   * @returns {Pack|Set} Set of packs
   */
  getPacks() {

    // The packs have already been loaded
    if (this.packs.size === 0) {
      return this.doGetPacks().then((packs) => {
        this.packs = packs;
        return packs;
      });

    } else {
      return Promise.resolve(this.packs);
    }
  }

  /**
   * Actual method fetching the packs
   * @returns {Pack|Set} Set of packs
   * @virtual
   */
  doGetPacks() {}

  /**
   * Return the unique ID of the endpoint
   * @returns {String} ID
   * @virtual
   */
  getId() {}
}

/**
 * A Pack is a collection of songs
 * @memberof services.FileManager
 * @interface
 */
export class Pack {

  constructor() {
    this.songs = new Set();
  }

  /**
   * List the Songs in the Pack
   * @returns {SongIndex|Set} Set of SongIndex
   */
  getSongs() {

    // The songs have already been loaded
    if (this.songs.size === 0) {
      return this.doGetSongs().then((songs) => {
        this.songs = songs;
        return songs;
      });

    } else {
      return Promise.resolve(this.songs);
    }
  }

  /**
   * List the Songs in the Pack
   * @returns {SongIndex|Set} Set of SongIndex
   * @virtual
   */
  doGetSongs() {}

  /**
   * Return the unique ID of the endpoint
   * @returns {String} ID
   * @virtual
   */
  getId() {}
}


/**
 * Index of the content of a Song
 * @memberof services.FileManager
 */
export class SongIndex {

  constructor(name) {
    this.name = name;
    this.rscMap = new Map();
    this.chartExt = '';
  }

  /**
   * Initializa the fetching of the Resources available for that Song
   * @returns {Symbol|Set} Set of Resource symbols
   */
  loadResources() {}

  /**
   * Free the memory used by the resources that are cached
   */
  freeResources () {
    this.rscMap.clear ();
  }

  /**
   * Return the unique ID of the endpoint
   * @returns {String} ID
   * @virtual
   */
  getId() {}

  /**
   * Load the resource
   *
   * @param {Constant|Array} type | Resources to load
   * @return {Object} resource | The requested resource
   */
  load(type) {
    if (!this.rscMap.has(type)) {

      log.debug(`Loading ${type.toString()} from external`);

      if (type === RSC_BACKGROUND || type === RSC_BANNER) {
        return this.doLoad(type).then((data) => {
          let texture = createTexture(data);
          this.rscMap.set(type, texture);
          return texture;
        });
      } else if (type === RSC_SONG) {
        return this.load(RSC_CHART).then ((data) => {
          let song = Song.CreateSong(data, this.chartExt);
          this.rscMap.set(type, song);
          return song;
        });
      } else if (type === RSC_AUDIO) {
        return this.doLoad(RSC_AUDIO).then((data) => {
          this.rscMap.set(type, data);
          return data.slice(0);
        });
      } else {
        return this.doLoad(type).then((data) => {
          this.rscMap.set(type, data);
          return data;
        });
      }

    } else {
      log.debug(`Loading ${type.toString()} from cache`);
      if (type === RSC_AUDIO) {
        return Promise.resolve(this.rscMap.get(type).slice(0)); // Need to copy not to consume the buffer in the cache
      }
      return Promise.resolve(this.rscMap.get(type));
    }

  }

  /**
   * Load the resource
   *
   * @param {Constant|Array} type | Resources to load
   * @return {Object} resource | The requested resource
   * @virtual
   */
  doLoad(type) {}
}

/**
 * Load a texture from a Blob of Data
 * @param {Blob} data  Data of the image
 * @return {PIXI.Texture|Promise} Texture
 */
function createTexture(data) {

  return new Promise((resolve) => {

    let reader = new FileReader();

    reader.addEventListener('load', function () {
      let img = new Image();
      img.src = reader.result;

      img.onload = () => {
        let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        let texture = PIXI.Texture.fromCanvas(canvas);
        resolve(texture);
      };
    });

    reader.readAsDataURL(data);
  });
}
