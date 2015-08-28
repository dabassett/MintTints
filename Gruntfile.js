module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '// MintTints v<%= pkg.version %>\n' +
        '// https://github.com/dabassett/MintTints\n'
    },

    jshint: {
      options: {
        browser: true,
        sub: true,
        globals: {
          jQuery: true
        }
      },
      all: ['minttints.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint']);

};