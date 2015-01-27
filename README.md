# Clients Core

This repository holds the most Red9 API web clients.

To get started:

```sh
git clone git@bitbucket.org:rednine/clients-core.git
cd clients-core
npm install
bower install
export NODE_ENV=remote
nodejs server.js         # In your first terminal
grunt watch              # In a second terminal
```

The `watch` task will automatically watch the affected directories, and
on a save refresh any open pages that you have. This helps speed up development.

Note that you must have bower and grunt installed. If you don't, then

```sh
npm install -g bower grunt-cli
```

To add a dependency:

```sh
bower install --save <package name>    # Get and save the code
grunt wiredep                          # Add the appropriate script and link tags
```

To build for release (concat, minify, etc.):
```sh
grunt build
```


# Project Structure

Coming soon.
