var gulp = require("gulp");
var ts = require("gulp-typescript");
var babel = require("gulp-babel");
var rename = require("gulp-rename");

gulp.task("build", function () {
    var tsProject = ts.createProject(__dirname + "/tsconfig.json");
    return tsProject.src()
        .pipe(ts(tsProject))
        .pipe(babel())
        .pipe(rename(function (path) {
            path.extname = ".js";
        }))
        .pipe(gulp.dest("./dist"));
});

gulp.task("watch", function() {
    gulp.watch("./src/**/*.ts", ["build"]);
});

gulp.task("default", ["build", "watch"])