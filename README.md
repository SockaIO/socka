Socka
=====

Socka is a JavaScript dance and rythm game.

It is compatible with three of the most common song formats used by other games: SM, DWI and SSC.

It also features support for up to two players, either using the keyboard or a USB dancepad.

## Installation

### Game Engine 

Socka runs entirely client side. To install it you just need to serve the index.html together with the bundled assets using any web server.

### Songs

The songs must also be served by a web server. It does not need to be the one serving the game. However, in that case, CORS must be properly configured to allow the client to fetch the songs.

In the default build configuration the game expects the songs to be available under the /songs URL. An additional location can be configured in the options. If you want to protect your songs from unauthorized users, Socka supports HTTP basic authentication.

For the game to index them, the server must serve the songs in a format that is supported. As of now two methods are available: Directory Listing and JSON indexes.

#### Directory Listing

When using compatible web servers, with directory listing enabled, you just need to serve your song folder organized as follow:

    Pack 1/
    Pack 1/Song A/
    Pack 1/Song B/
    Pack 2/
    Pack 2/Song C/
    ...

The following web servers have been tested:

* Apache 2
* Python 2 SimpleHTTPServer
* Python 3 http.server

#### JSON Indexes

If you do not want to enable directory listing on your web server, you can instead serve JSON indexes containing the information required by Socka to fetch your songs. This method is slightly more optimized that the previous one and can give a small performance improvement when loading the song assets.

The gen_api.py script is provided (in the tools folder) to generate such JSON files. To use it just run

    python gen_api.py FOLDER

Where *FOLDER* is the folder containing your songs. The song folders need to be organized as instructed in the previous section.

The script will generate a *packs.json* file as well as a *packs* folder containing one json file per pack. You can serve your song folder, now containing both the JSON files and the song files, with any web server.

In the game, the source URL needs to be configured to point to the *packs.json* file.

## Build

To install the dependencies, run

    npm install

To Build the bundled assets, run

    npm run build

The assets are available in the *dist* folder.

## License

This software is licensed under the MIT License. See the LICENSE file in the top distribution directory for the full license text.
