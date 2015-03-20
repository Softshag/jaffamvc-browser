
gulp = require 'gulp'
jshint = require 'gulp-jshint'
config = require '../config'

gulp.task 'lint', ->
  gulp.src "src/**/*.js"
  .pipe jshint()
  .pipe jshint.reporter('jshint-stylish')
