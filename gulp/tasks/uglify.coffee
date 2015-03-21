gulp = require 'gulp'
uglify = require 'gulp-uglify'
rename = require 'gulp-rename'
config = require '../config'

gulp.task 'uglify', ->

  gulp.src './dist/' + config.binary + '.js'
  .pipe uglify
    preserveComments: 'some'
  .pipe rename extname: '.min.js'
  .pipe gulp.dest './dist'
