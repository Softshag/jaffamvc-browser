
gulp = require 'gulp'
concat = require 'gulp-concat'
#regenerator = require 'gulp-regenerator'
sq = require 'streamqueue'
prettify = require('gulp-jsbeautifier')
wrap = require 'gulp-wrapper'
replace = require('gulp-replace')

config = require '../config'

gulp.task 'build:bundle', ['build'], ->
  q = for file in [config.binary + '.js', config.binary + '.ext.js']
    gulp.src 'dist/' + file
  sq objectMode: yes, q...
  .pipe concat config.binary + '.bundle.js'
  .pipe gulp.dest './dist'


