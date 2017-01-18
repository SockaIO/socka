/**
 * @namespace services.Endpoint
 */

'use strict';

import {Endpoint, Pack, SongIndex} from './fileManager';


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
  static CreateHttpEndpoint(url) {
    return fetch(url).then((response) => {

      // Catch HTTP Errors
      if (!response.ok) {
        throw {message: response.statusText, status: response.status};
      }

      // The URL is reachable, create the endpoint
      return new HttpEndpoint(url);
    })
    .catch((error) => {
      throw error;
    });
  }

  /**
   * Create a HTTP Endpoint
   * @param {String} url Base URL of the endpoint
   */
  constructor(url) {
    super();
    this.url = url;
  }

  /**
   * Get the top level links and consider the folder as packs
   */
  getPacks() {
    return listLinks(this.url).then((links) => {

      return function* () {
        for (let link of links) {
          if (!link.folder) {
            continue;
          }

          // Create the Pack Object based on the link
          yield new HttpPack(link.name, link.href);

        }
      }();
    });
  }
}


/**
 * List the links at the URL
 * @params {String} url URL of the page
 * @returns {Object|Set|Promise} Set of link objects (name, href)
 */
function listLinks(url) {

  return fetch(url).then((resp) => {

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

  constructor(name, url) {
    super();
    this.name = name;
    this.url = url;
  }

  getSongs() {
    return listLinks(this.url).then((links) => {

      return function* () {
        for (let link of links) {
          if (!link.folder) {
            continue;
          }

          // Create the SongIndex Object based on the link
          yield new HttpSongIndex(link.name, link.href);

        }
      }();
    });
  }
}


/**
 * HttpSongIndex in an HTTP SongIndex
 * @memberof services.Endpoint
 * @extends SongIndex 
 */
class HttpSongIndex extends SongIndex{

  constructor(name, url) {
    super();
    this.name = name;
    this.url = url;
  }
}
