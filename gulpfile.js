const { watch, series, src, dest } = require('gulp')
const ts = require("gulp-typescript")
const babel = require("gulp-babel");
const rename = require("gulp-rename");

function buildTask () {
  var tsProject = ts.createProject(__dirname + "/tsconfig.json");
  return tsProject.src()
      .pipe(tsProject())
      .pipe(babel())
      .pipe(rename(function (path) {
          path.extname = ".js";
      }))
      .pipe(dest("./dist"));
}

function watchTask () {
  watch("./src/**/*.ts", buildTask);
}

exports.build = buildTask;
exports.default = series(buildTask, watchTask);
