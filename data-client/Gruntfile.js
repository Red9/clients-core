module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        clean: {
            before: ['release/'],
            after: ['.tmp/']
        },
        copy: {
            main: {
                files: [
                    // Copy assets over
                    {expand: true, src: ['src/**'], dest: 'release/'}
                ]
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            mainapp: {
                files: [
                    {
                        expand: true,
                        src: ['release/**/*.js'],
                        dest: ''
                    }
                ]
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
                        cwd: 'release/src/',
                        src: [
                            '**/*.html',
                            '!**/embeddedvideo.fcpxmldialog.html',
                            '!**/embeddedvideo.html',
                            '!**/eventdetection.session.html',
                            '!**/layouteditor.html',
                            '!**/modifyresource.html',
                            '!**/panelgraph.settings.html'
                        ],
                        dest: 'release/src/'
                    }
                ]
            }
        },
        jshint: {
            files: ['Gruntfile.js', 'src/**/*.js'],
            options: {
                // options here to override JSHint defaults
                globals: {
                    //jQuery: true,
                    console: true,
                    document: true,
                    angular: true,
                    window: true
                },
                ignores: ['src/static/js/vendor/*.js', 'src/static/js/vendor_old/*.js'],
                laxbreak: true // don't warn about putting operators on the next line.
            }
        },
        useminPrepare: {
            html: 'release/src/index.html',
            options: {
                dest: 'release/src'
            }
        },
        usemin: {
            html: 'release/src/index.html'
        },
        watch: {
            files: ['<%= jshint.files %>'],
            tasks: ['jshint']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-ng-annotate');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-usemin');
    grunt.loadNpmTasks('grunt-contrib-htmlmin');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('test', ['jshint']);

    grunt.registerTask('default',
        [
            'jshint',
            'clean:before',
            'copy',
            'ngAnnotate',
            'useminPrepare',
            'concat:generated',
            'cssmin:generated',
            'uglify:generated',
            'usemin',
            'htmlmin',
            'clean:after'
        ]);
};