var gulp = require('gulp');
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
var through = require('through2');
var replace = require('gulp-replace');
var exec = require('child_process').exec;
var gutil = require('gulp-util');
var jsinspect = require('gulp-jsinspect');
var tmp = require('tmp');
var glob = require('glob');
var assert = require('assert');

gulp.task('default', ['build']);
// Build is checking and then building dist files : di.js and di.min.js
gulp.task('build', ['checks', 'build-dist', 'build-minify', 'build-readme']);
// Checking is syntax check, then test raw code with code coverage, and then test on target platforms
gulp.task('checks', ['lint', 'copy-paste-check', 'test', 'browser-test', 'nodes-test', 'npm-check']);
// Checking package content, publish on NPM and building ZIP to publish on Github
gulp.task('publish', ['build', 'check-package', '_publish-npm', '_publish_github']);

gulp.task('lint', function () {
    var eslint = require('gulp-eslint');

    return gulp.src(['src/*.js', '*.js', 'test/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('npm-check', function (cb) {
    exec(path.join('node_modules', '.bin', 'npm-check'), function (e, stdout, stderr) {
        gutil.log(stdout);
        gutil.log(stderr);
        cb();
    });
});

gulp.task('build-readme', ['lint'], function (cb) {
    var cmd = path.join('node_modules', '.bin', 'jsdoc2md'),
        args = '-s name -d 3 -t README.hbs --separators src/di.js';

    exec([cmd, args, '> README.md'].join(' '), function (error, stdout, stderr) {
        gutil.log(stdout);
        gutil.log(stderr);
        if (error) {
            cb(error);
            return;
        }
        cb();
    });
});

gulp.task('test', ['lint'], function (cb) {
    del.sync(['coverage']);
    return gulp.src(['src/di.js'])
                .pipe(istanbul({includeUntested: true}))
                .pipe(istanbul.hookRequire())
                .on('end', function () {
                    return gulp.src(['test/di.js'])
                            .pipe(mocha())
                            .pipe(istanbul.writeReports({
                                dir: 'coverage',
                                reportOpts: { dir: 'coverage' }
                            }))
                            .pipe(istanbul.enforceThresholds({ thresholds: { global: 98 } }))
                            .on('error', cb);
                });
});

gulp.task('copy-paste-check', ['lint'], function (cb) {

    gulp.src('src/di.js')
        .pipe(jsinspect({
            'threshold': 30,
            'identifiers': true
        }))
        .pipe(jsinspect({
            'threshold': 50,
            'identifiers': false
        }));

});

gulp.task('nodes-test', ['build-dist'], function (cb) {
    var versions = [
        '0.12',
        '4.5',
        'lts/*'
    ];

    var buildCmd = './node_modules/.bin/gulp node-test';

    var cmd = versions.map(function (version) {
        return 'nvm use ' + version + ' && ' + buildCmd;
    }).join(' && ');

    cmd = '. ~/.nvm/nvm.sh 2>/dev/null ; ' + cmd;

    exec(cmd, function (error, stdout, stderr) {
        gutil.log(stdout);
        gutil.log(stderr);
        if (error) {
            cb(error);
            return;
        }
        cb();
    });
});

gulp.task('node-test', function () {
    return gulp.src(['test/di.js'])
            .pipe(replace(/src\/di/, 'dist/di'))
            .pipe(mocha());
});

gulp.task('browser-test', ['build-minify'], function (cb) {

    gulp.src('test/di.js')
        .pipe(replace(/var Di(.*);/, ''))
        .pipe(through.obj(function (file, enc, cb) {
            file.contents = browserify(file).bundle();
            cb(null, file);
        }))
        .pipe(rename('di.browser.js'))
        .pipe(gulp.dest('test'))
        .on('end', function () {
            return gulp.src('test/di.browser.html')
                        .pipe(mochaPhantomJS())
                        .on('error', function (e) {
                            del(['test/di.browser.js']); cb(e);
                        })
                        .on('finish', function () {
                            del(['test/di.browser.js']); cb();
                        });
        });

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

var alreadyCreatedTmpPackage = null;

var tmpPackage = function () {

    if (alreadyCreatedTmpPackage) {
        return Promise.resolve(alreadyCreatedTmpPackage);
    }

    return new Promise(function (resolve, reject) {
        exec('npm pack', function (error, stdout, stderr) {

            if (error || stderr !== '') {
                gutil.log(stderr);
                return reject(error);
            }

            var filename = stdout.trim();

            tmp.dir(function (err, tmpDir) {
                if (err) {
                    fs.unlink(filename);
                    return void reject(err);
                }

                var cmd = [
                    'tar',
                    '--strip-components=1',
                    '-xzf',
                    filename.replace(/\\/g, '\\\\'),
                    '-C',
                    tmpDir.replace(/\\/g, '\\\\')
                ].join(' ');

                exec(cmd, function (error, stdout, stderr) {
                    fs.unlink(filename);
                    if (error || stderr) {
                        gutil.log(stderr);
                        return void reject(error);
                    }

                    alreadyCreatedTmpPackage = tmpDir;
                    resolve(tmpDir);

                    process.on('exit', function () {
                        del.sync([tmpDir], {force: true});
                    });
                });

            });
        });
    });
};

gulp.task('check-package', ['build'], function (cb) {
    tmpPackage()
        .then(function (directory) {

            glob('**', {cwd: directory, nodir: true, dot: true}, function (err, files) {

                if (err) {
                    return cb(err);
                }

                var packageEntry = require('./package.json').main;
                var packageExpectation = [
                    'dist/di.js',
                    'dist/di.min.js',
                    'package.json',
                    'README.md',
                    // @see https://docs.npmjs.com/misc/developers : never ignored "README (and its variants)"
                    'README.hbs'
                ].sort();

                files = files.sort();

                try {
                    assert.deepStrictEqual(
                        packageExpectation,
                        files,
                        'Expected ' + packageExpectation.join(', ') + ' Given ' + files.join(', ')
                    );
                    assert(files.includes(packageEntry));
                    cb();
                } catch (e) {
                    cb(e);
                }
            });


        })
        .catch(cb);
});

gulp.task('_publish-npm', ['check-package'], function (cb) {
    exec('npm publish', function (error, stdout, stderr) {
        if (error) {
            gutil.log(stderr);
            return cb(error);
        }

        gutil.log('>> ' + stdout);
    });
});

gulp.task('_publish_github', ['check-package'], function (cb) {
    tmpPackage()
        .then(function (directory) {
            var packageJson = require('./package.json');

            var destSuffix = path.join(process.cwd(), packageJson.name + '-' + packageJson.version);
            var destTar = destSuffix + '.tar.gz';
            var destZip = destSuffix + '.zip';

            exec('tar --force-local -zcf ' + destTar + ' *', {cwd: directory}, function (error, stdout, stderr) {

                if (error) {
                    gutil.log(stderr);
                    return cb(error);
                }

                gutil.log('>> Ready to github publish release with package ' + destTar);

                exec('7z a -tzip ' + destZip + ' *', {cwd: directory}, function (error, stdout, stderr) {
                    if (error) {
                        gutil.log(stderr);
                        return cb(error);
                    }

                    gutil.log('>> Ready to github publish release with package ' + destZip);

                    cb();

                });

            });
        })
        .catch(cb);
});
