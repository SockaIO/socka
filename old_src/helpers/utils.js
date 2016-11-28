/* jshint esnext: true */
"use strict";

/*
 * Utils (some usefull(?) functions)
 */
class Utils {
  static findLinks (url) {
    return fetch(url, {credentials: 'same-origin'}).then((resp) => {
      if (!resp.ok) {
        throw resp;
      }

      url = resp.url;

      return resp.text();
    }).then((data) => {
      let el = document.createElement('html');
      el.innerHTML = data;

      return function* () {
        yield url;
        for (var a of el.getElementsByTagName('a')) {
          let href = a.getAttribute('href');
          if (!href.startsWith("http")) {
            if (href.startsWith("/")) {
              href = url.split("/").slice(0, 3).join("/");
            } else {
              href = url + href;
            }
          }
          yield href;
        }
      }();
    });
  }

  static findSMFiles (url) {
    return Utils.findLinks(url).then((links) => {
      let trueUrl;
      function* files() {
        for (let link of links) {
          if (!trueUrl) {
            trueUrl = link;
            continue;
          }
          let ext = link.split(".").slice("-1")[0].toLowerCase();

          if (ext === "sm") {
            yield link;
          } else if (ext.includes("/") && link.includes(trueUrl) && link.endsWith("/")) {
            yield Utils.findSMFiles(link);
          }
        }
      }
      return Promise.all(files());
    }).then((values) => {
      return [].concat.apply([], values);
    });
  }

}
