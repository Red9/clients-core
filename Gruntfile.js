/*jslint node: true */
'use strict';

var mozjpeg = require('imagemin-mozjpeg');
var pngquant = require('imagemin-pngquant');
var rewriteModule = require('http-rewrite-middleware');


var pkg = require('./package.json');

//Using exclusion patterns slows down Grunt significantly
//instead of creating a set of patterns like '**/*.js' and '!**/node_modules/**'
//this method is used to create a set of inclusive patterns for all subdirectories
//skipping node_modules, bower_components, dist, and any .dirs
//This enables users to create any directory structure they desire.
var createFolderGlobs = function (fileTypePatterns) {
    fileTypePatterns = Array.isArray(fileTypePatterns) ? fileTypePatterns : [fileTypePatterns];
    var ignore = ['node_modules', 'bower_components', 'dist'];
    var fs = require('fs');
    return fs.readdirSync(process.cwd())
        .map(function (file) {
            if (ignore.indexOf(file) !== -1 ||
                file.indexOf('.') === 0 || !fs.lstatSync(file).isDirectory()) {
                return null;
            } else {
                return fileTypePatterns.map(function (pattern) {
                    return file + '/**/' + pattern;
                });
            }
        })
        .filter(function (patterns) {
            return patterns;
        })
        .concat(fileTypePatterns);
};

module.exports = function (grunt) {

    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: pkg,
        // ---------------------------------------------------------------------
        // Serve
        // ---------------------------------------------------------------------
        watch: {
            service: {
                options: {
                    livereload: true,
                    livereloadOnError: false,
                    spawn: false // Faster, but more prone to watch failure
                },
                files: ['src/**/*.*'],
                tasks: ['<%= grunt.task.current.args[1] %>']
            }
        },
        connect: {
            options: {
                debug: false,
                livereload: true,
                protocol: 'https',
                // If it doesn't have a file extension then let's try serving
                // a .html file. Allows for vanity URLs.
                middleware: function (connect, options) {
                    var middlewares = [];

                    middlewares.push(rewriteModule.getMiddleware([
                        {
                            // This line is a bit fragile when you consider that we
                            // want to serve stuff from bower_components, and we
                            // don't have a [... WHAT SRLM?]
                            from: '(^((?!css|html|js|images|img|fonts|\/$).)*$)',
                            to: "$1.html"
                        }
                    ]));

                    if (!Array.isArray(options.base)) {
                        options.base = [options.base];
                    }

                    var directory = options.directory || options.base[options.base.length - 1];
                    options.base.forEach(function (base) {
                        // Serve static files.
                        middlewares.push(connect.static(base));
                    });

                    // Make directory browse-able.
                    middlewares.push(connect.directory(directory));


                    // Not found? Probably a single page app or a 404. Either way, let the SPA page handle it.
                    // Doesn't need to be perfect, since it's only for development.
                    middlewares.push(function (req, res) {
                        // Taken from https://gist.github.com/ssafejava/8704372
                        for (var file, i = 0; i < options.base.length; i++) {
                            file = options.base + "/index.html";
                            if (grunt.file.exists(file)) {
                                require('fs').createReadStream(file).pipe(res);
                                return; // we're done
                            }
                        }
                        // We won't do a 404 since it's probably a SPA page.
                        //res.statusCode(404); // where's index.html?
                        res.end();
                    });

                    return middlewares;
                }
            },
            development: {
                options: {
                    port: 8000,
                    base: 'build'
                }
            },
            dist: {
                options: {
                    port: 8000,
                    base: 'dist'
                }
            }
        },
        // ---------------------------------------------------------------------
        // Setup
        // ---------------------------------------------------------------------
        clean: { // marketing website
            prepare: {
                files: [{
                    expand: true,
                    cwd: './',
                    //src: ['dist/', '.tmp/', 'build/**/*.*', '!build/bower_components/**/*']
                    src: ['dist/', '.tmp/']
                }]
            },
            newer: {
                src: 'node_modules/grunt-newer/.cache/'
            }
        },

        // ---------------------------------------------------------------------
        // Check
        // ---------------------------------------------------------------------
        jshint: {
            main: {
                options: {
                    "laxbreak": true,
                    "globals": {
                        "d3": true,
                        "alert": true,
                        "red9config": true,
                        "jQuery": true,
                        "angular": true,
                        "console": true,
                        "$": true,
                        "_": true,
                        "moment": true,
                        "describe": true,
                        "beforeEach": true,
                        "module": true,
                        "inject": true,
                        "it": true,
                        "expect": true,
                        "xdescribe": true,
                        "xit": true,
                        "spyOn": true
                    }
                },
                src: ['src/**/*.js']
            }
        },
        // ---------------------------------------------------------------------
        // Build
        // ---------------------------------------------------------------------
        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['**/*.{html,js}'],
                        dest: 'build/'
                    },
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['images/**/*', 'fonts/**/*'],
                        dest: 'build/'
                    },
                    {
                        expand: true,
                        cwd: 'src/',
                        src: ['bower_components/**/*.*'],
                        dest: 'build/'
                    }
                ]
            },
            prepare: {
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: [
                        'index.html',
                        'fragments/**/*.html',
                        'images/**/*',
                        '!bower_components/**/*.*'
                    ],
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: 'build/',
                    src: ['**/fonts/**/*.{woff,woff2,ttf,otf,eot,svg}'],
                    dest: 'dist/fonts/',
                    flatten: true
                }]
            }
        },
        wiredep: { // Clients core
            build: {
                src: [
                    'build/index.html',
                    // TODO: Using the same bower_components for each fragment is a bit inefficient.
                    'build/fragments/**/*.html'
                ],

                options: {
                    // See wiredep's configuration documentation for the options
                    // you may pass:

                    // https://github.com/taptapship/wiredep#configuration
                    exclude: [
                        '/jquery/', // Required by bootstrap JS, which we're not using.
                        '/SHA-1/',  // Angulartics: https://github.com/luisfarzati/angulartics/issues/209
                        '/waypoints/' // Same.
                    ],
                    overrides: {
                        angulartics: {
                            main: [ // We don't want all "main"s that angulartics defines...
                                'src/angulartics.js',
                                'src/angulartics-segmentio.js'
                            ]
                        },
                        leaflet: { // leaflet double includes...
                            main: [
                                'dist/leaflet-src.js',
                                'dist/leaflet.css'
                            ]
                        },
                        bootstrap: { // We don't want the bootstrap JS, so we set main to just CSS
                            main: 'dist/css/bootstrap.css'
                        },
                        'leaflet.markercluster': {
                            main: [
                                'dist/MarkerCluster.css',
                                'dist/MarkerCluster.Default.css',
                                'dist/leaflet.markercluster.js' // The -src version doesn't seem to get through to wiredep
                            ]
                        },
                        'ng-tags-input': {
                            main: [
                                'ng-tags-input.css', // Must be first!
                                'ng-tags-input.bootstrap.css', // Need to add the bootstrap bit...
                                'ng-tags-input.js'
                            ]
                        }
                    }
                }
            }
        },
        sass: {
            build: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['**/*.scss'],
                    dest: 'build/',
                    ext: '.css'
                }]
            }
        },
        postcss: {
            options: {
                map: true, // Update the existing source map
                diff: false,
                processors: [
                    require('autoprefixer-core')({
                        browsers: 'last 3 versions, > 0.5%'
                    })
                ]
            },
            build: {
                files: [{
                    expand: true,
                    cwd: 'build/',
                    src: ['**/*.css', '!bower_components/**/*.css'],
                    dest: 'build/'
                }]
            }
        },
        imagemin: {
            build: {
                options: {
                    optimizationLevel: 4, // png trials
                    use: [
                        mozjpeg({
                            quality: 80,
                            progressive: true
                        }),
                        pngquant({
                            quality: '75-80',
                            speed: 1
                        })
                    ]
                },
                files: [{
                    expand: true,
                    cwd: 'build/images/',
                    src: ['**/*.{png,jpg,gif}', '!favicons/**'],
                    dest: 'build/images/'
                }]
            }
        },

        // ---------------------------------------------------------------------
        // Prepare
        // ---------------------------------------------------------------------
        useminPrepare: {
            prepare: {
                src: [
                    'build/index.html',
                    'build/fragments/**/*.html'
                ],
                options: {
                    dest: 'dist',
                    root: 'build/'
                }
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            prepare: {
                files: [{
                    expand: true,
                    cwd: '.tmp/concat/js',
                    src: '*.js',
                    dest: '.tmp/concat/js'
                }]
            }
        },
        //uncss: {
        //    prepare: {
        //        options: {
        //            csspath: '../',
        //            stylesheets: ['.tmp/concat/css/site.css'],
        //            // ignore list taken from: ???
        //            ignore: [
        //                ///(#|\.)fancybox(\-[a-zA-Z]+)?/,
        //                // Bootstrap selectors added via JS
        //                /\w\.in/,
        //                ".fade",
        //                ".collapse",
        //                ".collapsing",
        //                /(#|\.)navbar(\-[a-zA-Z]+)?/,
        //                /(#|\.)dropdown(\-[a-zA-Z]+)?/,
        //                /(#|\.)(open)/,
        //                // currently only in a IE conditional, so uncss doesn't see it (? SRLM)
        //                ".close",
        //                ".alert-dismissible",
        //                ".animated",
        //                '.swipebox-video',
        //                /(#|\.)swipebox(\-[a-zA-Z]+)?/
        //            ]
        //        },
        //        files: {
        //            // Yes, this is a special case. Remove CSS rules from the
        //            // sitewide css file if that rule is not used in any HTML
        //            // file.
        //            '.tmp/concat/css/site.css': 'dist/**/*.html'
        //
        //        }
        //    }
        //},

        usemin: {
            html: ['dist/**/*.html'],
            css: ['dist/**/*.css'],
            js: ['dist/**/*.js'],
            options: {
                assetsDirs: ['.tmp', 'build', 'dist'],
                patterns: {
                    js: [
                        [/((my-client|components)\/.*?\.(?:css|html))/gm, 'Update references to revved files that are pulled in dynamically']
                    ]
                }
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                compress: {
                    sequences: true,
                    dead_code: true,
                    conditionals: true,
                    booleans: true,
                    unused: true,
                    if_return: true,
                    join_vars: true,
                    drop_console: true
                }
            }
        },
        htmlmin: {                                     // Task
            prepare: {
                options: {                             // Target options
                    removeComments: true,
                    collapseWhitespace: true,
                    conservativeCollapse: true
                },
                files: [
                    {
                        expand: true,
                        cwd: 'dist/',
                        src: '**/*.html',
                        dest: 'dist/'
                    }
                ]
            }
        },
        filerev: {
            options: {
                algorithm: 'md5',
                length: 8
            },
            prepare: {
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*.*', '!**/*.html', '!images/**', '!bower_components/**'],
                    dest: 'dist/'
                }, {
                    // Copy (and filerev) the html/css files over that are dynamically loaded.
                    expand: true,
                    cwd: 'build/',
                    src: [
                        '**/*.{html,css}',
                        '!index.{html,css}',
                        '!fragments/**/*.{html,css}'
                    ],
                    dest: 'dist/'
                }, {
                    expand: true,
                    cwd: '.tmp/',
                    src: '**/*.{js,css}',
                    dest: '.tmp/'
                }]
            }
        },

        // ---------------------------------------------------------------------
        // Deploy
        // ---------------------------------------------------------------------
        compress: {
            deploy: {
                options: {
                    mode: 'gzip'
                },
                files: [{
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*', '!images/**/*'],
                    dest: 'dist/',
                    ext: function (ext) {
                        return ext + '.gz';
                    }
                }]
            }
        },
        aws: grunt.file.readJSON('private/staging.json'), // Read the file
        aws_s3: {
            options: {
                //debug: true,
                accessKeyId: '<%= aws.AWSAccessKeyId %>', // Use the variables
                secretAccessKey: '<%= aws.AWSSecretKey %>', // You can also use env variables
                region: '<%= aws.region %>',
                uploadConcurrency: 10, // 10 simultaneous uploads
                downloadConcurrency: 10, // 10 simultaneous downloads
                differential: true, // Only uploads the files that have changed
                displayChangesOnly: true,
                gzipRename: 'ext' // when uploading a gz file, keep the original extension
            },
            stagingUploadStatic: {
                options: {
                    bucket: 'staging.redninesensor.com',
                    params: {
                        CacheControl: 'no-transform, public, max-age=10, s-maxage=60'
                    }
                },
                files: [{
                    action: 'upload',
                    expand: true,
                    cwd: 'dist/',
                    src: ['**/*.gz', 'images/**/*', 'fonts/**/*'],
                    dest: ''
                }]
            },
            stagingUploadPages: {
                options: {
                    bucket: 'staging.redninesensor.com',
                    params: {
                        CacheControl: 'public, max-age=10, s-maxage=60'
                    }
                },
                files: [{
                    action: 'upload',
                    expand: true,
                    cwd: 'dist/',
                    src: [
                        'index.html.gz',
                        'fragments/**/*.html.gz'
                    ],
                    dest: '',
                    rename: function (err, src) {
                        console.log('src: ' + src);
                        return src.slice(0, -8); // Remove the known .html.gz extension.
                    }
                }]
            }
        },
        invalidate_cloudfront: {
            options: {
                key: '<%= aws.AWSAccessKeyId %>', // Use the variables
                secret: '<%= aws.AWSSecretKey %>', // You can also use env variables
                distribution: '<%= aws.cloudfrontDistribution %>'
                //distribution: 'TESTING'
            },
            staging: {
                expand: true,
                cwd: 'dist/',
                src: [
                    'index.html',
                    'fragments/**/*.html'
                ],
                dest: '',
                filter: 'isFile',
                rename: function (err, src) {
                    return src.slice(0, -5); // Remove the known .html extension.
                }
            }
        }
    });

    grunt.registerTask('serve', ['build', 'connect:development', 'watch:service:build']);
    grunt.registerTask('serve-dist', ['prepare', 'connect:dist', 'watch:service:prepare']);

    grunt.registerTask('build', [
        'jshint',
        'copy:build',
        'wiredep:build',
        'sass:build',
        'postcss:build',
        'newer:imagemin:build'
    ]);

    grunt.registerTask('prepare', [
        'clean:prepare',
        'build',
        'copy:prepare',
        'useminPrepare',
        'concat:generated',
        'ngAnnotate:prepare',
        //'uncss:prepare',
        'cssmin:generated',
        'uglify:generated',
        'filerev',
        'usemin',
        'htmlmin:prepare'
    ]);

    grunt.registerTask('deploy-staging', [
        //'clean:newer',
        'prepare',
        'compress:deploy',
        'aws_s3:stagingUploadStatic',
        'aws_s3:stagingUploadPages',
        'invalidate_cloudfront:staging'
    ]);

};
