var gulp = require('gulp');
var eslint = require('gulp-eslint');
var del = require('del');

gulp.task('lint', function () {
    return gulp.src(['src/*.js', '*.js', 'test/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
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