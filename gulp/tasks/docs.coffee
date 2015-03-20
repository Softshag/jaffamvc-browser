
gulp = require 'gulp'
jsdoc = require 'gulp-jsdoc'
config = require '../config'
{exec} = require('child_process')
gulp.task 'docs', (done)  ->
  exec 'node ./node_modules/.bin/jsdoc -R ./README.md -p -t ./node_modules/ink-docstrap/template -c ./jsdoc.conf -d ./docs src', done

