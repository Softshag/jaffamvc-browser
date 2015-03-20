gulp = require 'gulp'
uglify = require 'gulp-uglify'
rename = require 'gulp-rename'
config = require '../config'

gulp.task 'uglify', ->
  console.log './dist/*.js'
  gulp.src './dist/*'
  .pipe uglify()
  .pipe rename extname: '.min.js'
  .pipe gulp.dest './dist'
