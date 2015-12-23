var gulp = require('gulp');
var ts = require('gulp-typescript');
var babel = require('gulp-babel');

var tsProject = ts.createProject('./tsconfig.json', {
    typescript: require('typescript')
});

gulp.task('default', function() {
    return gulp.src(['src/**/*.ts', 'typings/**/*.ts'])
        .pipe(ts(tsProject))
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'));
});