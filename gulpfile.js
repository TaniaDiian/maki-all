'use strict';

var gulp = require('gulp');
var pug = require('gulp-pug');
var plumber = require('gulp-plumber');
var plumberNotifier = require('gulp-plumber-notifier');
var sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var gcmq = require('gulp-group-css-media-queries');

gulp.task('serve', ['sass'], function() {


    browserSync.init({
        server: "./app"
    });

    // gulp.watch("app/*.css", ['sass']);
    gulp.watch("app/*.html").on('change', browserSync.reload);
});

gulp.task('copyImg', function(){
	 return gulp.src('dev/img/**/*').pipe(gulp.dest('app/img'));
});

gulp.task('copyJs', function(){
	 return gulp.src('dev/js*/*.*').pipe(gulp.dest('app'));
});

gulp.task('views', function () {
  return gulp.src('dev/*.pug')
 .pipe(plumber()).pipe(plumberNotifier() ).pipe(pug({
    pretty: true
  }))   
  .pipe(gulp.dest('app'));

})

gulp.task('sass', function () {
  return gulp.src('dev/scss/*.scss')
    .pipe(sass().on('error', sass.logError)).pipe(autoprefixer({
            browsers: ['last 20 versions'],
            cascade: false
        }))
    .pipe(gcmq())
    .pipe(gulp.dest('app/css')).pipe(browserSync.stream());
});


gulp.task('watcher', function(){
  gulp.watch('./dev/chunks/*.pug',['views']);
  gulp.watch('dev/img*/*.*',['copyImg']);
  gulp.watch('./dev/*.pug',['views']);
  gulp.watch('./dev/scss/*.scss',['sass']);
  gulp.watch('./dev/js/*.js',['copyJs']);
})

gulp.task('default',  [ 'copyJs','views','copyImg','sass','watcher','serve',]);