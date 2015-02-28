'use strict';

if (typeof process.env.NODE_ENV === 'undefined') {
    console.log('Must set NODE_ENV');
    process.exit(1);
}

var nconf = require('nconf');
nconf
    .argv()
    .env()
    .file('deployment', {file: 'config/' + process.env.NODE_ENV + '.server.json'});

var Hapi = require('hapi');
var Good = require('good');
var path = require('path');

var server = new Hapi.Server({
    connections: {
        routes: {
            cache: {
                privacy: 'public',
                expiresIn: nconf.get('cacheMaxAge')
            }
        }
    }
});
server.connection({port: nconf.get('port')});

server.route({
    method: 'GET',
    path: '/config.js',
    handler: {
        file: path.join('config', nconf.get('NODE_ENV') + '.js')
    }
});

server.route({
    method: 'GET',
    path: '/dataset/{id}',
    handler: {
        file: path.join(nconf.get('src'), 'data.html')
    }
});

//server.route({
//    method: 'GET',
//    path: '/event/{id}',
//    handler: {
//        file: path.join(nconf.get('src'), 'data.html')
//    }
//});

server.route({
    method: 'GET',
    path: '/{path*}',
    handler: function (request, reply) {
        // Try to 404 if it's a "file" we're looking for. In this case a file
        // is something with a '.' in it. The purpose here is to allow simple
        // 404s for files, but Angualar SPA 404s for "user errors".
        // This is a bit hacky... It won't work if any of our site routes have '.' in them.
        if (request.params.path &&
            request.params.path.split('.').length > 1) {
            reply.file(path.join(nconf.get('src'), request.params.path));
        } else {
            reply.file(path.join(nconf.get('src'), 'index.html'));
        }
    }
});

// This is a maxBuffer error hack.
// Should fix with https://www.npmjs.com/package/grunt-bg-shell
var consoleArgs = {log: '*', response: '*'};
if (nconf.get('NODE_ENV') === 'development') {
    consoleArgs = null;
}

server.register({
    register: Good,
    options: {
        reporters: [{
            reporter: require('good-console'),
            args: [consoleArgs]
        }]
    }
}, function (err) {
    if (err) {
        throw err; // something bad happened loading the plugin
    }

    server.start(function () {
        server.log('info', 'Server running at:       ' + server.info.uri);
        server.log('info', 'Server node environment: "' + nconf.get('NODE_ENV') + '"');
    });
});
