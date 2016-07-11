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
var fs = require('fs');
var path = require('path');
var npmTestInstall = require('npm-test-install');

gulp.task('default', ['build']);
gulp.task('build', ['checks', 'build-dist', 'build-minify']);
gulp.task('checks', ['lint', 'test', 'browser-test', 'test-npm-package']);

gulp.task('lint', function () {
    return gulp.src(['src/*.js', '*.js', 'test/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('build-dist', ['lint'], function () {
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

gulp.task('test', ['lint', 'build-dist'], function (cb) {
    del.sync(['coverage']);
    return gulp.src(['dist/di.js'])
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

gulp.task('browser-test', ['build-minify'], function (cb) {

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

gulp.task('test-npm-package', ['build-dist', 'build-minify'], function (cb) {

    npmTestInstall(__dirname, true).then(function (install) {
        var mainFile = require('./package.json').main,
            miniFile = mainFile.replace(/\.js$/, '.min.js');

        var missingFiles = [ mainFile, miniFile ].filter(function (filename) {
            try {
                fs.accessSync(path.join(install.getPackageDir(), filename));
                return false;
            } catch (e) {
                return true;
            }
        });

        if (missingFiles.length > 0) {
            install.free().then(function () {
                cb('Missing files ' + missingFiles.join(', '));
            }, function (e) {
                console.warn(e);
                cb('Missing files ' + missingFiles.join(', '));
            });
            return;
        }

        console.log('No missing files');
        install.free().then(cb, function (e) {
            console.warn(e);
            cb();
        });
    }, cb);

});