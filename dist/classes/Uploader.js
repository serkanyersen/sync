"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

Object.defineProperty(exports, "__esModule", {
  value: true
});

var upath = require("upath");

var fs_1 = require("fs");

var scp2_1 = require("scp2");

var Uploader = function () {
  function Uploader(config, cli) {
    _classCallCheck(this, Uploader);

    this.config = config;
    this.cli = cli;
  }

  _createClass(Uploader, [{
    key: "connect",
    value: function connect() {
      var _this = this;

      this.client = new scp2_1.Client({
        port: this.config.port,
        host: this.config.host,
        username: this.config.username,
        password: this.config.password,
        privateKey: this.config.privateKey ? fs_1.readFileSync(this.config.privateKey).toString() : undefined
      });
      this.client.sftp(function (err, sftp) {
        if (err) {
          console.log("There was a problem with connection");
        }
      });
      return new Promise(function (resolve, reject) {
        _this.client.on("ready", function () {
          resolve("connected");
        });
      });
    }
  }, {
    key: "getRemotePath",
    value: function getRemotePath(path) {
      var normalPath = upath.normalizeSafe(path);
      var normalLocalPath = upath.normalizeSafe(this.config.localPath);
      var remotePath = normalPath.replace(normalLocalPath, this.config.remotePath);
      return upath.normalizeSafe(remotePath);
    }
  }, {
    key: "unlinkFile",
    value: function unlinkFile(fileName) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var remote = _this2.getRemotePath(fileName);

        _this2.client.sftp(function (err, sftp) {
          if (err) {
            reject('SFTP cannot be created');
          } else {
            sftp.unlink(remote, function (err) {
              if (err) {
                reject('File could not be deleted');
              } else {
                resolve(remote);
              }
            });
          }
        });
      });
    }
  }, {
    key: "unlinkFolder",
    value: function unlinkFolder(folderPath) {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        var remote = _this3.getRemotePath(folderPath);

        _this3.client.sftp(function (err, sftp) {
          if (err) {
            reject('SFTP cannot be created');
          } else {
            sftp.rmdir(remote, function (err) {
              if (err) {
                reject('Folder could not be deleted');
              } else {
                resolve(remote);
              }
            });
          }
        });
      });
    }
  }, {
    key: "uploadFile",
    value: function uploadFile(fileName) {
      var _this4 = this;

      return new Promise(function (resolve, reject) {
        var remote = _this4.getRemotePath(fileName);

        _this4.client.mkdir(upath.dirname(remote), {
          mode: _this4.config.pathMode
        }, function (err) {
          if (err) {
            reject({
              message: "Could not create ".concat(upath.dirname(remote)),
              error: err
            });
          } else {
            _this4.client.upload(fileName, remote, function (err) {
              if (err) {
                reject({
                  message: "Could not upload ".concat(remote),
                  error: err
                });
              } else {
                resolve(remote);
              }
            });
          }
        });
      });
    }
  }]);

  return Uploader;
}();

exports["default"] = Uploader;