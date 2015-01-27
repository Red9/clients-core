/*jslint node: true */
'use strict';

var pkg = require('./package.json');

//Using exclusion patterns slows down Grunt significantly
//instead of creating a set of patterns like '**/*.js' and '!**/node_modules/**'
//this method is used to create a set of inclusive patterns for all subdirectories
//skipping node_modules, bower_components, dist, and any .dirs
//This enables users to create any directory structure they desire.
var createFolderGlobs = function (fileTypePatterns) {
    fileTypePatterns = Array.isArray(fileTypePatterns) ? fileTypePatterns : [fileTypePatterns];
    var ignore = ['node_modules', 'bower_components', 'dist', 'temp'];
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
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            main: {
                options: {
                    livereload: true,
                    livereloadOnError: false,
                    spawn: false
                },
                files: [createFolderGlobs(['*.js', '*.scss', '*.html']), '!_SpecRunner.html', '!.grunt'],
                tasks: [] //all the tasks are run dynamically during the watch event handler
            }
        },
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
                src: createFolderGlobs('*.js').concat('!old/**/*').concat('!server.js')
            }
        },
        clean: {
            before: {
                src: ['dist', '.tmp']
            },
            after: {
                src: ['.tmp']
            }
        },

        //ngtemplates: {
        //    main: {
        //        options: {
        //            module: pkg.name,
        //            htmlmin: '<%= htmlmin.main.options %>'
        //        },
        //        src: [createFolderGlobs('*.html'), '!index.html', '!_SpecRunner.html', '!old/**/*'],
        //        dest: 'temp/templates.js'
        //    }
        //},
        copy: {
            index: {
                files: [
                    {
                        src: 'index.html',
                        dest: 'dist/index.html'
                    },
                    {
                        src: [
                            'my-client/**/*.css',
                            'my-client/**/*.css.map',
                            'images/**',
                            'my-client/**/*.html',
                            'old/**/*' // For the historic data page. Hopefully soon we can get rid of this.
                        ],
                        dest: 'dist/'
                    },
                    {
                        cwd: 'bower_components/',
                        src: ['leaflet/dist/images/**'],
                        dest: 'dist/css/images/',
                        flatten: true,
                        filter: 'isFile',
                        expand: true
                    },
                    {
                        cwd: 'bower_components/',
                        src: ['font-awesome/fonts/**', 'bootstrap/dist/fonts/**'],
                        dest: 'dist/fonts/',
                        flatten: true,
                        filter: 'isFile',
                        expand: true
                    }
                ]
            }
        },
        dom_munger: {
            update: {
                options: { // Remove development scripts
                    remove: ['script[data-remove="true"]']
                },
                src: 'dist/index.html',
                dest: 'dist/index.html'
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '.tmp/concat/js',
                    src: '*.js',
                    dest: '.tmp/concat/js'
                }]
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                mangle: {
                    except: ["$super"] // Don't modify the "$super" text, needed to make Rickshaw pass optimization.
                }
            }
        },
        htmlmin: {                                     // Task
            target: {
                options: {                                 // Target options
                    removeComments: true,
                    collapseWhitespace: true,
                    conservativeCollapse: true
                },
                files: [
                    {
                        expand: true,
                        cwd: 'dist/',
                        src: [
                            '**/*.html',
                            '!**/embeddedvideo.fcpxmldialog.html',
                            '!**/fcpxml.html',
                            '!**/embeddedvideo.html',
                            '!**/eventdetection.session.html',
                            '!**/layouteditor.html',
                            '!**/modifyresource.html',
                            '!**/panelgraph.settings.html'
                        ],
                        dest: 'dist/'
                    }
                ]
            }
        },
        //karma: {
        //    options: {
        //        frameworks: ['jasmine'],
        //        files: [  //this files data is also updated in the watch handler, if updated change there too
        //            '<%= dom_munger.data.appjs %>',
        //            'bower_components/angular-mocks/angular-mocks.js',
        //            createFolderGlobs('*-spec.js')
        //        ],
        //        logLevel: 'ERROR',
        //        reporters: ['mocha'],
        //        autoWatch: false, //watching is handled by grunt-contrib-watch
        //        singleRun: true
        //    },
        //    all_tests: {
        //        browsers: ['PhantomJS', 'Chrome', 'Firefox']
        //    },
        //    during_watch: {
        //        browsers: ['PhantomJS']
        //    }
        //},
        wiredep: {
            task: {

                // Point to the files that should be updated when
                // you run `grunt wiredep`
                src: [
                    'index.html'   // .html support...
                ],

                options: {
                    // See wiredep's configuration documentation for the options
                    // you may pass:

                    // https://github.com/taptapship/wiredep#configuration
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
                        }
                    }
                }
            }
        },
        useminPrepare: {
            html: 'dist/index.html',
            options: {
                dest: 'dist',
                root: './'
            }
        },
        usemin: {
            html: 'dist/index.html'
        },
        sass: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'my-client/scss',
                    src: ['*.scss'],
                    dest: 'my-client/css/',
                    ext: '.css'
                }]
            }
        },
        shell: {
            serve: {
                command: "nodejs server.js",
                options: {
                    async: true
                }
            }
        }
    });


    grunt.registerTask('build', [
        'jshint',
        'sass',
        'clean:before',
        'copy',
        'dom_munger:update',
        'sass',
        'useminPrepare',
        'concat:generated',
        'ngAnnotate',
        'cssmin:generated',
        'uglify:generated',
        'usemin',
        'htmlmin',
        'clean:after'
    ]);

    grunt.registerTask('test', ['jshint', 'sass'/*, 'karma:all_tests'*/]);

    grunt.registerTask('serve', ['jshint', 'sass', 'shell:serve', 'watch']);

    grunt.event.on('watch', function (action, filepath) {
        //https://github.com/gruntjs/grunt-contrib-watch/issues/156

        var tasksToRun = [];

        if (filepath.lastIndexOf('.js') !== -1 && filepath.lastIndexOf('.js') === filepath.length - 3) {

            //lint the changed js file
            grunt.config('jshint.main.src', filepath);
            tasksToRun.push('jshint');

            //find the appropriate unit test for the changed file
            var spec = filepath;
            if (filepath.lastIndexOf('-spec.js') === -1 || filepath.lastIndexOf('-spec.js') !== filepath.length - 8) {
                spec = filepath.substring(0, filepath.length - 3) + '-spec.js';
            }

            //if the spec exists then lets run it
            if (grunt.file.exists(spec)) {
                var files = [].concat(grunt.config('dom_munger.data.appjs'));
                files.push('bower_components/angular-mocks/angular-mocks.js');
                files.push(spec);
                grunt.config('karma.options.files', files);
                tasksToRun.push('karma:during_watch');
            }
        }

        //if index.html changed, we need to reread the <script> tags so our next run of karma
        //will have the correct environment
        if (filepath === 'index.html') {
            tasksToRun.push('dom_munger:read');
        }

        grunt.config('watch.main.tasks', tasksToRun);

    });
};
