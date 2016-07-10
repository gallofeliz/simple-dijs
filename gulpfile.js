var gulp = require('gulp');
var eslint = require('gulp-eslint');
var del = require('del');
var istanbul = require('gulp-istanbul');
var mocha = require('gulp-mocha');
var mkdirp = require('mkdirp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var mochaPhantomJS = require('gulp-mocha-phantomjs');

gulp.task('lint', function () {
    return gulp.src(['src/*.js', '*.js', 'test/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('clean', function () {
    return del([
        'coverage'
    ]);
});

gulp.task('build-dist', function () {
    mkdirp.sync('dist');

    return browserify(
        ['src/di.js'],
        { standalone: 'Di' }
    ).bundle()
     .pipe(source('di.js'))
     .pipe(gulp.dest('dist'));

});

gulp.task('build-minify', ['build-dist'], function () {
    gulp.src('dist/di.js')
        .pipe(rename('di.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('dist'));
});

gulp.task('test', ['lint', 'clean'], function (cb) {
    return gulp.src(['dist/*.js'])
                .pipe(istanbul({includeUntested: true}))
                .pipe(istanbul.hookRequire())
                .on('end', function () {
                    return gulp.src(['test/*.js'])
                            .pipe(mocha())
                            .pipe(istanbul.writeReports({
                                dir: 'coverage',
                                reportOpts: { dir: 'coverage' }
                            }))
                            .pipe(istanbul.enforceThresholds({ thresholds: { global: 70 } }))
                            .on('error', cb);
                });
});

gulp.task('browser-test', function (cb) {

    browserify(
        ['test/di.js']
    ).bundle()
     .pipe(source('di.js'))
     .pipe(gulp.dest('test/browser'))
     .on('end', function () {
         return gulp.src('test/browser/browser.html')
                    .pipe(mochaPhantomJS())
                    .on('error', function (e) {
                        del(['test/browser/di.js']); cb(e);
                    })
                    .on('finish', function () {
                        del(['test/browser/di.js']); cb();
                    });
     });

});

gulp.task('test-npm-package', function (cb) {

    var exec = require('child_process').exec,
        mainFile = require('./package.json').main,
        fs = require('fs'),
        path = require('path'),
        dir = fs.mkdtempSync(process.env.TEMP + path.sep + 'tnp-'),
        source = __dirname,
        finish = function (e) {
            del(dir).then(function () { cb(e); }, function () { cb(e); });
        };

    exec('npm install --ignore-scripts ' + source, {cwd: dir}, function (error, stdout, stderr) {

        console.log(stdout);
        console.error(stderr);

        if (error) {
            finish(error);
            return;
        }

        fs.access(path.join(dir, 'node_modules', 'simple-dijs', mainFile), function (e) {
            if (!e) {
                console.log(mainFile + ' checked');
            }

            finish(e);
        });

    });
});