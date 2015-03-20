
gulp = require 'gulp'
rimraf = require 'gulp-rimraf'


gulp.task 'clean', ->
  gulp.src ['dist','docs'], read: no
  .pipe rimraf()
