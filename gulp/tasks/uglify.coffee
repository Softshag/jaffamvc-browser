gulp = require 'gulp'
uglify = require 'gulp-uglify'
rename = require 'gulp-rename'
config = require '../config'

gulp.task 'uglify', ->
  console.log './dist/' + config.binary + '.js'
  gulp.src './dist/' + config.binary + '.js'
  .pipe uglify()
  .pipe rename config.binary + '.min.js'
  .pipe gulp.dest './dist'
