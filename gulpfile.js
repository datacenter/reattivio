var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var environments = require('gulp-environments');
var browserify = require('browserify');
var babelify = require('babelify');
var watchify = require('watchify');
var notify = require('gulp-notify');

var stylus = require('gulp-stylus');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var buffer = require('vinyl-buffer');

var browserSync = require('browser-sync');
var reload = browserSync.reload;
var historyApiFallback = require('connect-history-api-fallback')

var development = environments.development;
var production = environments.production;

/*
  Styles Task
*/

gulp.task('styles', function (){
  // move over fonts

  gulp.src('css/fonts/**.*')
    .pipe(gulp.dest('build/css/fonts'))

  // Compiles CSS
  gulp.src('css/style.styl')
    .pipe(stylus())
    .pipe(autoprefixer())
    .pipe(gulp.dest('./build/css/'))
    .pipe(reload({
      stream: true
    }))
});

/*
  Images
*/
gulp.task('images', function (){
  gulp.src('css/images/**')
    .pipe(gulp.dest('./build/css/images'))
});

gulp.task('media', function (){
  gulp.src('media/**')
    .pipe(gulp.dest('./build/media'))
});

/*
  Browser Sync
*/
gulp.task('browser-sync', function (){
  browserSync({
    // we need to disable clicks and forms for when we test multiple rooms
    server: {},
    port: 8000,
    middleware: [
      historyApiFallback()
    ],
    ghostMode: false,
    open: false
  });
});

function handleErrors(){
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

function buildScript(file, watch){
  var props = {
    entries: [
      './scripts/' + file
    ],
    debug: true,
    transform: [
      [
        babelify,
        {
          presets: [
            "es2015",
            "stage-0",
            "react",
          ],
          plugins: [
            "transform-decorators-legacy",
          ],
        }
      ]
    ]
  };

  // watchify() if watch requested, otherwise run browserify() once 
  var bundler = watch ? watchify(browserify(props)) : browserify(props);

  function rebundle(){
    var stream = bundler.bundle();
    return stream
      .on('error', handleErrors)
      .pipe(source(file))
      // Minify for production
      .pipe(production(buffer()))
      .pipe(production(uglify()))
      // Pipe to build
      .pipe(gulp.dest('./build/'))
      .pipe(reload({
        stream: true
      }))
  }

  // listen for an update and run rebundle
  bundler.on('update', function (){
    rebundle();
    gutil.log('Rebundle...');
  });

  // run it once the first time buildScript is called
  return rebundle();
}

gulp.task('scripts', function (){
  return buildScript('main.js', false); // this will run once because we set watch to false
});

// run 'scripts' task first, then watch for future changes
gulp.task('default', [
  'images',
  'media',
  'styles',
  'scripts',
  'browser-sync'
], function (){
  gulp.watch('css/**/*', [
    'styles'
  ]); // gulp watch for stylus changes
  return buildScript('main.js', true); // browserify watch for JS changes
});

gulp.task('build', [
  'images',
  'media',
  'styles',
], function (){

  return buildScript('main.js', false); // browserify watch for JS changes
});
