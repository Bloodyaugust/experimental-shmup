module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
            },
            dist: {
                files: [
                    {
                        expand: true,
                        src: [
                            'game.js',
                            'lib/SugarLab.js'
                        ],
                        dest: 'dist'
                    }
                ]
            }
        },
        shell: {
            webmake: {
                command: 'webmake res/dependencies.js res/bundle.js'
            }
        },
        compass: {
            dist: {
                options: {
                    sassDir: 'res/sass',
                    cssDir: 'res/css',
                    environment: 'production'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('default', ['uglify', 'shell:webmake', 'compass']);
};