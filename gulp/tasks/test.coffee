
gulp = require 'gulp'

phantom = require 'gulp-jasmine-phantom'

config = require '../config'

gulp.task 'test',  ->
  gulp.src 'specs/*.spec.js'
  .pipe phantom
    vendor: [
      "specs/shims/*.js"
      "node_modules/exoskeleton/exoskeleton.js"
      "node_modules/es6-shim/es6-shim.js"
      'node_modules/jquery/dist/jquery.js'
      'node_modules/jasmine-jquery/lib/jasmine-jquery.js'
      "dist/#{config.binary}.js"
    ]
    integration: yes
    keepRunner: './'
