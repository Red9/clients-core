# Clients Core

This repository holds the most Red9 API web clients.

To get started:

```sh
git clone git@bitbucket.org:rednine/clients-core.git
cd clients-core
npm install
bower install
export NODE_ENV=remote   # Or NODE_ENV=development for a local server
grunt serve
```

The `serve` creates a simple HTML server for development use. It will also
automatically watch the affected directories, and on a source save refresh any
open pages that you have. This helps speed up development.

Note that you must have bower and grunt installed. If you don't, then

```sh
npm install -g bower grunt-cli
```

To add a dependency

```sh
bower install --save <package name>    # Get and save the code
grunt wiredep                          # Add the appropriate script and link tags
```

To build for release (concat, minify, etc.)

```sh
grunt build
```

To check the code for style and run tests

```sh
grunt test
```

# Project Structure

Coming soon. Follow:

[Google Angular Style Guide](https://docs.google.com/document/d/1XXMvReO8-Awi1EZXAXS4PzDzdNvV6pGcuaF4Q9821Es/pub)

This repository mirrors the general format here:
[https://github.com/angular/angular-seed](https://github.com/angular/angular-seed)

Still looking for a style guide solution, but one of these two should work:
https://github.com/toddmotto/angularjs-styleguide
https://github.com/johnpapa/angularjs-styleguide




# Production Size

Sizes taken from the original repository \*.min size.

| Resource                   |  .min |
| ---------------------------|------:|
| angular                    |   125 |
| angular-deferred-bootstrap |     2 |
| angular-filter             |    14 |
| angular-leaflet-directive  |    61 |
| angular-resource           |     3 |
| angular-route              |     4 |
| angular-bootstrap (tpls)   |    65 |
| angulartics                |     4 |
| angulartics-segmentio      |     1 |
| ng-file-upload             |     8 |
| d3                         |   150 |
| leaflet                    |   125 |
| leaflet-markercluster      |    28 |
| lodash                     |    47 |
| **Total**                  |**637**|



