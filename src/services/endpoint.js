/**
 * @namespace services.Endpoint
 */

'use strict';

import {Endpoint, Pack, SongIndex} from './fileManager';
import {RSC_AUDIO, RSC_CHART, RSC_BANNER, RSC_BACKGROUND, RSC_SONG} from '../constants/resources';


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
        throw {message: response.statusText, status: response.status, url, opts, type: 'HTTP Endpoint'};
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

    return Promise.all([resp.url, resp.text()]);
  }).then ((data) => {

    let full_url = data[0];

    // Construct DOM from the HTML String
    let el = document.createElement('html');
    el.innerHTML = data[1];

    let parse_url = document.createElement('a');
    parse_url.href = full_url;

    return function* () {
      for (let a of el.getElementsByTagName('a')) {

        // Get the Absolute URL
        let href = a.getAttribute('href');
        if (!href.startsWith('http')) {
          if (href.startsWith('/')) {
            href = parse_url.origin + href;
          } else if (href.startsWith('?')) {
            continue;
          } else {
            href = full_url + '/' + href;
          }
        }

        // Link to the parent directory
        if (full_url.includes(href)) {
          continue;
        }

        // Get the name
        let name = a.title || a.innerHTML;
        let folder = false;
        if (name.endsWith('/')) {
          name = name.slice(0, -1);
          folder = true;
        } else if (!name.split('/').splice(-1)[0].includes('.')) {
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

      let subPack = [];

      links = Array.from(links).filter(l => l.folder);

      if (links.length === 0) {
        return [];
      }

      // Check if we have 2 levels of folders
      return listLinks(links[0].href, this.opts).then((linksA) => {

        let songs = new Set();
        let songLevel = true;

        for (let l of linksA) {
          if (l.folder) {
            songLevel = false;
          }
        }

        // The next level if the songs
        if (songLevel === true) {
          for (let link of links) {
            // Create the SongIndex Object based on the link
            if (!link.folder) {
              continue;
            }
            songs.add(new HttpSongIndex(link.name, link.href, this.opts));
          }
          return songs;
        }

        // We have another level of folders
        // TODO: Maybe suppor n levels ?
        for (let link of links) {
          if (!link.folder) {
            continue;
          }
          subPack.push(listLinks(link.href, this.opts).then((linksA) => {
            let ss = [];
            for (let p of linksA) {

              if (!p.folder) {
                continue;
              }

              let songIndex = (new HttpSongIndex(p.name, p.href, this.opts));
              ss.push(songIndex);
            }
            return ss;
          }));
        }

        return Promise.all(subPack).then((songsA) => {
          for (let ss of songsA) {
            for (let s of ss) {
              songs.add(s);
            }
          }
          return songs;
        });

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
    this.loading = false;

    this.fallbackRscs = new Map();

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

    this.loading = true;

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

        if (IMG_EXTS.includes(ext) &&
            !(nameCanon.includes('bn') || nameCanon.includes('bg')) &&
            !rsc.has(RSC_BANNER)) {

          rsc.set(RSC_BANNER, link.href);
        }

        if (AUDIO_EXTS.includes(ext)) {
          rsc.set(RSC_AUDIO, link.href);
        }

        if (CHART_EXTS.includes(ext)) {
          rsc.set(RSC_CHART, link.href);
          this.chartExt = ext;
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

    if (!this.loading) {
      this.loadResources();
    }

    return this.rsc.then((rscs) => {

      let fallback = this.fallbackRscs.get(type);

      // If the resc was not found and the fallback was not checked
      // Or the resc was not found and the fallback failed
      if ((!rscs.has(type) && fallback === undefined) || (!rscs.has(type) && fallback !== undefined && fallback === this.url + '/')) {

        // Theses resources can be located thanks to the SM file
        if ([RSC_BANNER, RSC_BACKGROUND].includes(type) && !this.fallbackRscs.has(type)) {
          return this.load(RSC_SONG).then((song) => {
            this.fallbackRscs.set(RSC_BANNER, this.url + '/' + song.banner);
            this.fallbackRscs.set(RSC_BACKGROUND, this.url + '/' + song.background);
            return this.doLoad(type);
          });
        }

        return new Promise((resolve, reject) => reject(new Error('Resoure not found')));
      }

      let rsc = rscs.get(type);
      if (!rscs.has(type) && this.fallbackRscs.get(type) !== undefined) {
        rsc = this.fallbackRscs.get(type);
      }

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


