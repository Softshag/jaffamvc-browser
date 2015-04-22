
gulp = require 'gulp'


gulp.task 'watch', ['build', 'build:ext'], ->
	gulp.watch './src/**/*.*', ['build', 'build:ext']