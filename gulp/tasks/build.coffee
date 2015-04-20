
gulp = require 'gulp'
babel = require 'gulp-babel'
concat = require 'gulp-concat'
#regenerator = require 'gulp-regenerator'
sq = require 'streamqueue'
prettify = require('gulp-jsbeautifier')
wrap = require 'gulp-wrapper'
replace = require('gulp-replace')

config = require '../config'

gulp.task 'build-es5', ->
  q = for file in config.files
    gulp.src file

  sq objectMode: yes, q...
  .pipe concat config.binary + '.js'
  .pipe babel( { loose: ["es6.classes", "es6.properties.computed"] })
  .pipe replace(/"use strict";/,"")
  .pipe wrap config.umd
  .pipe replace(/\*\s?jshint\s+[-\w\d:]+\s*?\*/g, "")
  .pipe replace(/\*\s?global\s+[-\w\d\s,]+\s*?\*/g, "")
  .pipe prettify
    js:
      preserveNewlines: yes
      maxPreserveNewlines: 3
      indentSize: 2
  .pipe gulp.dest './dist'


# gulp.task 'build-es6', ->
#   q = for file in config.files
#     gulp.src file

#   sq objectMode: yes, q...
#   .pipe concat config.binary + '.es6.js'
#   .pipe wrap config.es6
#   .pipe replace(/"use strict";/,"")
#   .pipe wrap config.umd
#   .pipe replace(/\*\s?jshint\s+[-\w\d:]+\s*?\*/g, "")
#   .pipe replace(/\*\s?global\s+[-\w\d\s,]+\s*?\*/g, "")
#   .pipe prettify
#     js:
#       preserveNewlines: yes
#       maxPreserveNewlines: 3
#       indentSize: 2
#   .pipe gulp.dest './dist'

gulp.task 'build', ['build-es5','build-ext']
