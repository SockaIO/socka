/**
 * @namespace services.Endpoint
 */

'use strict';

import {Endpoint, Pack, SongIndex} from './fileManager';
import {RSC_AUDIO, RSC_CHART, RSC_BANNER, RSC_BACKGROUND} from '../constants/resources';


/**
 * HttpEndpoint
 *
 * Endpoint to get Songs over HTTP
 * @memberof services.Endpoint
 * @extends Endpoint
 */
export class HttpEndpoint extends Endpoint {

  /**
   * Create and test a HTTP Endpoint
   * @static
   * @param {String} url Base URL of the endpoint
   * @returns {HttpEndpoint|promise} Promise for a HTTP endpoint
   */
  static CreateHttpEndpoint(url, basicAuth=null) {


    let opts = {
      credentials: 'include',
      cache: 'default'
    };

    if (basicAuth !== null) {
      let password = window.btoa('' + basicAuth.username + ':' + basicAuth.password);
      let headers = new Headers();
      headers.append('Authorization', 'Basic ' + password);
      opts.headers = headers;
    }

    return fetch(url, opts).then((response) => {

      // Catch HTTP Errors
      if (!response.ok) {
        throw {message: response.statusText, status: response.status};
      }

      // The URL is reachable, create the endpoint
      return new HttpEndpoint(url, opts);
    })
    .catch((error) => {
      throw error;
    });
  }

  /**
   * Create a HTTP Endpoint
   * @param {String} url Base URL of the endpoint
   * @param {Object} opts Options for fetch
   */
  constructor(url, opts) {
    super();
    this.url = url;
    this.opts = opts;
  }

  /**
   * Get the top level links and consider the folder as packs
   */
  doGetPacks() {
    return listLinks(this.url, this.opts).then((links) => {

      let packs = new Set();

      for (let link of links) {
        if (!link.folder) {
          continue;
        }
        packs.add(new HttpPack(link.name, link.href, this.opts));
      }
      return packs;
    });
  }

  /**
   * Return the unique ID of the endpoint
   * @returns {String} ID
   */
  getId() {
    return this.url;
  }
}


/**
 * List the links at the URL
 * @params {String} url URL of the page
 * @returns {Object|Set|Promise} Set of link objects (name, href)
 */
function listLinks(url, opts) {

  return fetch(url, opts).then((resp) => {

    if (!resp.ok) {
      throw {message: resp.statusText, status: resp.status};
    }

    return resp.text(); 
  }).then ((data) => {

    // Construct DOM from the HTML String
    let el = document.createElement('html');
    el.innerHTML = data;

    return function* () {
      for (let a of el.getElementsByTagName('a')) {

        // Get the Absolute URL
        let href = a.getAttribute('href');
        if (!href.startsWith('http')) {
          href = url + '/' + href;
        }

        // Get the name
        let name = a.innerHTML;
        let folder = false;
        if (name.endsWith('/')) {
          name = name.slice(0, -1);
          folder = true;
        }
        yield {name, href, folder};
      }
    }();
  });
}

/**
 * Pack in an HTTP Endpoint
 * @memberof services.Endpoint
 * @extends Pack
 */
class HttpPack extends Pack{

  constructor(name, url, opts) {
    super();
    this.name = name;
    this.url = url;
    this.opts = opts;
  }

  doGetSongs() {
    return listLinks(this.url, this.opts).then((links) => {

      let songs = new Set();

      for (let link of links) {
        if (!link.folder) {
          continue;
        }

        // Create the SongIndex Object based on the link
        songs.add(new HttpSongIndex(link.name, link.href, this.opts));
      }

      return songs;
    });
  }

  /**
   * Return the unique ID of the endpoint
   * @returns {String} ID
   */
  getId() {
    return this.url;
  }
}


/**
 * HttpSongIndex in an HTTP SongIndex
 * @memberof services.Endpoint
 * @extends SongIndex 
 */
class HttpSongIndex extends SongIndex{

  constructor(name, url, opts) {
    super();
    this.name = name;
    this.url = url;
    this.opts = opts;

    this.rsc = new Promise((resolve, reject) => {
      this.resolveRsc = resolve;
      this.rejectRsc = reject;
    });
  }

  /**
   * Liste the resources available for that song
   * TODO: Update this with the parsing of the SM file which should contain the bg name
   * @returns {Symbol|Set} Set of Resource symbols
   */
  loadResources() {

    listLinks(this.url, this.opts).then((links) => {

      let rsc = new Map();

      for (let link of links) {

        let nameCanon = link.name.toLowerCase();
        let ext = nameCanon.split('.').slice(-1)[0];

        const IMG_EXTS = ['jpg', 'png'];
        const AUDIO_EXTS = ['mp3', 'ogg'];
        const CHART_EXTS = ['dwi', 'sm'];

        if (IMG_EXTS.includes(ext) && nameCanon.includes('bg')) {
          rsc.set(RSC_BACKGROUND, link.href);
        }

        if (IMG_EXTS.includes(ext) && nameCanon.includes('bn')) {
          rsc.set(RSC_BANNER, link.href);
        }

        if (AUDIO_EXTS.includes(ext)) {
          rsc.set(RSC_AUDIO, link.href);
        }

        if (CHART_EXTS.includes(ext)) {
          rsc.set(RSC_CHART, link.href);
        }
      }

      this.resolveRsc(rsc);

    });
  }

  /**
   * Load the resource
   *
   * @param {Constant|Array} type | Resources to load
   * @return {Object} resource | The requested resource
   */
  doLoad(type) {

    return this.rsc.then((rscs) => {

      if (!rscs.has(type)) {
        return new Promise((resolve, reject) => reject(new Error('Resoure not found')));
      }

      let rsc = rscs.get(type);

      return fetch(rsc, this.opts).then((resp) => {
        if (!resp.ok) {
          throw {message: resp.statusText, status: resp.status};
        }

        switch(type){
        case RSC_AUDIO:
          return resp.arrayBuffer();
        case RSC_CHART:
          return resp.text();
        case RSC_BACKGROUND:
        case RSC_BANNER:
          return resp.blob();
        }
      });
    });
  }

  /**
   * Return the unique ID of the endpoint
   * @returns {String} ID
   */
  getId() {
    return this.url;
  }
}


