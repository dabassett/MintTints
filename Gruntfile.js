module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '// MintTints v<%= pkg.version %>\n' +
        '// https://github.com/dabassett/MintTints\n'
    },

    project: {
      app: ['app'],
      assets: ['<%= project.app %>/assets'],
      css: ['<%= project.assets %>/stylesheets/style.scss'],

    },

    sass: {
      dev: {
        options: {
          style: 'expanded',
          compass: false
        },
        files: {
          '<%= project.assets %>/stylesheets/style.css': '<%= project.css %>'
        }
      }
    },

    jshint: {
      options: {
        browser: true,
        sub: true,
        globals: {
          jQuery: true
        }
      },
      all: ['main.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-coffee');

  grunt.registerTask('default', []);

};