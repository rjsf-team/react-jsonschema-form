module.exports = function (grunt) {
    grunt.initConfig({
        "pkg": grunt.file.readJSON('package.json'),
        copy: {
          main: {
            files: [
              {expand: true, cwd: 'node_modules', src: ['awesomplete/awesomplete.css'], dest: 'public/css/', filter: 'isFile'},
            ],
          },
        },
    });
    
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('default', ['copy']);
};