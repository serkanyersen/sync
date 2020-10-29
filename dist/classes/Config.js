"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CONFIG_FILE_NAME = void 0;

var jsonplus_1 = require("jsonplus");

var fs_1 = require("fs");

var path_1 = require("path");

var CLI_1 = require("./CLI");

exports.CONFIG_FILE_NAME = "sync-config.json";

var Config = function () {
  function Config(cli) {
    _classCallCheck(this, Config);

    this.cli = cli;
    this.pathMode = "0755";
    this._filename = path_1.join(process.cwd(), this.cli.getArgument("config", exports.CONFIG_FILE_NAME));
  }

  _createClass(Config, [{
    key: "ready",
    value: function ready() {
      var _this = this;

      return new Promise(function (resolve) {
        _this._fetch();

        _this._expand();

        if (!_this.password && !_this.privateKey) {
          _this.cli.read("Enter password to connect:", true).then(function (answer) {
            _this.password = _this._config.password = answer;
            resolve();
          });
        } else {
          resolve();
        }
      });
    }
  }, {
    key: "_fetch",
    value: function _fetch() {
      if (fs_1.existsSync(this._filename)) {
        var configraw;

        if (configraw = fs_1.readFileSync(this._filename)) {
          try {
            this._config = jsonplus_1.parse(configraw.toString());
          } catch (e) {
            this.cli.usage("Could not parse DB file. Make sure JSON is correct", CLI_1.EXIT_CODE.RUNTIME_FAILURE);
          }
        } else {
          this.cli.usage("Cannot read config file. Make sure you have permissions", CLI_1.EXIT_CODE.INVALID_ARGUMENT);
        }
      } else {
        this.cli.usage("Config file not found", CLI_1.EXIT_CODE.INVALID_ARGUMENT);
      }
    }
  }, {
    key: "_expand",
    value: function _expand() {
      var _this2 = this;

      ["host", "port", "username", "password", "pathMode", "localPath", "remotePath", "ignores", "privateKey"].forEach(function (prop) {
        _this2[prop] = _this2._config[prop] || _this2[prop];
      });
    }
  }]);

  return Config;
}();

exports["default"] = Config;