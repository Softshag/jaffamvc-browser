
gulp = require 'gulp'
bump = require 'gulp-bump'

gulp.task 'default', ['lint','build','test','uglify','docs']


gulp.task 'bump', ->
  gulp.src('./package.json')
  .pipe bump()
  .pipe gulp.dest './'
