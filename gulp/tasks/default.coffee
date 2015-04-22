
gulp = require 'gulp'
bump = require 'gulp-bump'

gulp.task 'default', ['lint','build:bundle','test','uglify','docs']


gulp.task 'bump', ->
  gulp.src('./package.json')
  .pipe bump()
  .pipe gulp.dest './'

gulp.task 'bump:minor', ->
  gulp.src './package.json'
  .pipe bump type: 'minor'
  .pipe gulp.dest './'