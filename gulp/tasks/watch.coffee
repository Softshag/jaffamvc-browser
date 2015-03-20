
gulp = require 'gulp'


gulp.task 'watch', ['build'], ->
	gulp.watch './src/**/*.*', ['build']