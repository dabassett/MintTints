import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import del from 'del';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import browserify from 'browserify';
import browserify_shim from 'browserify-shim';
import debowerify from 'debowerify';
import watchify from 'watchify';

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

gulp.task('styles', () => {
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['last 1 version']}))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({stream: true}));
});

function lint(files, options) {
  return () => {
    return gulp.src(files)
      .pipe(reload({stream: true, once: true}))
      .pipe($.eslint(options))
      .pipe($.eslint.format())
      .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
  };
}
const testLintOptions = {
  env: {
    mocha: true
  }
};

gulp.task('lint', lint('app/scripts/**/*.js'));
gulp.task('lint:test', lint('test/spec/**/*.js', testLintOptions));

gulp.task('html', ['views', 'styles', 'browserify'], () => {
  const assets = $.useref.assets({searchPath: ['.tmp', 'app', '.']});

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe($.if('*.css', $.minifyCss({compatibility: '*'})))
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.if('*.html', $.minifyHtml({conditionals: true, loose: true})))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.if($.if.isFile, $.cache($.imagemin({
      progressive: true,
      interlaced: true,
      // don't remove IDs from SVGs, they are often used
      // as hooks for embedding and styling
      svgoPlugins: [{cleanupIDs: false}]
    }))
    .on('error', function (err) {
      console.log(err);
      this.end();
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')({
    filter: '**/*.{eot,svg,ttf,woff,woff2}'
  }).concat('app/fonts/**/*'))
    .pipe(gulp.dest('.tmp/fonts'))
    .pipe(gulp.dest('dist/fonts'));
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*.*',
    '!app/*.html',
    '!app/*.jade'
  ], {
    dot: true
  }).pipe(gulp.dest('dist'));
});

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('serve', ['styles', 'fonts', 'browserify', 'views'], () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['.tmp', 'app'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch([
    'app/images/**/*',
    '.tmp/fonts/**/*',
    '.tmp/scripts/**/*',
    '.tmp/*.html'
  ]).on('change', reload);

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/scripts/**/*.js', ['browserify']);
  gulp.watch('app/templates/**/*.jade', ['views']);
  gulp.watch('app/fonts/**/*', ['fonts']);
  gulp.watch('bower.json', ['fonts']);
});

gulp.task('serve:dist', () => {
  browserSync({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', () => {
  browserSync({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('test/spec/**/*.js').on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

gulp.task('browserify', () => {
  const opts = {
    entries: './app/scripts/main.js',
    debug: true,
    transform: [debowerify, browserify_shim]
  };
  return browserify(opts)
    .bundle()
    .pipe($.plumber({
      errorHandler: () => { 
        $.util.log.bind($.util, 'Browserify Error');
        this.emit('end');
      }
    }))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({loadMaps: true}))
      .pipe($.uglify())
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('.tmp/scripts'));
});



// add custom browserify options here
const customOpts = {
  entries: ['./app/scripts/main.js'],
  debug: true
};
var opts = Object.assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts)); 

// transformations
b.transform(debowerify);
b.transform(browserify_shim);

gulp.task('something', bundle);
b.on('update', bundle);
b.on('log', $.util.log);

function bundle() {
  return b.bundle()
    .on('error', $.util.log.bind($.util, 'Browserify Error'))
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({loadMaps: true}))
      .pipe($.uglify())
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('.tmp/scripts'));
}


gulp.task('views', () => {
  return gulp.src('app/templates/**/*.jade')
    .pipe($.jade({
      pretty: true
    }))
    .pipe(gulp.dest('.tmp'))
    .pipe(reload({stream: true}));
}); 

gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

// deploy to origin remote (github)
gulp.task('deploy', ['build'], () => {
  return gulp.src('dist')
    .pipe($.subtree())
    .pipe($.clean());
});

gulp.task('default', ['clean'], () => {
  gulp.start('build');
});
