module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-jshint')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-jscs')
  grunt.loadNpmTasks('grunt-mocha-cli')
  grunt.loadNpmTasks('grunt-release')

  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: ['install.js', '{lib,test}/*.js']
    },
    jscs: {
      src: {
        options: {
          config: '.jscs.json'
        },
        files: {
          src: ['*.js', '{lib,test}/*.js']
        }
      }
    },
    watch: {
      all: {
        files: ['{lib,test}/*.js', 'test/**/*'],
        tasks: ['test']
      }
    },
    mochacli: {
      options: {
        files: 'test/*_test.js'
      },
      spec: {
        options: {
          reporter: 'spec',
          slow: 10000,
          timeout: 20000
        }
      }
    }
  })

  grunt.registerTask('default', ['test'])
  // grunt.registerTask("build", ["jshint", "jscs"]);
  grunt.registerTask('package', ['release'])
  grunt.registerTask('test', ['mochacli'])
}
