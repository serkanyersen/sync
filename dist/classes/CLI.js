"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EXIT_CODE = void 0;

var chalk = require("chalk");

var minimist = require("minimist");

var inquirer = require("inquirer");

var EXIT_CODE;

(function (EXIT_CODE) {
  EXIT_CODE[EXIT_CODE["NORMAL"] = 0] = "NORMAL";
  EXIT_CODE[EXIT_CODE["RUNTIME_FAILURE"] = 1] = "RUNTIME_FAILURE";
  EXIT_CODE[EXIT_CODE["TERMINATED"] = 130] = "TERMINATED";
  EXIT_CODE[EXIT_CODE["INVALID_ARGUMENT"] = 128] = "INVALID_ARGUMENT";
})(EXIT_CODE = exports.EXIT_CODE || (exports.EXIT_CODE = {}));

var CLI = function () {
  function CLI() {
    _classCallCheck(this, CLI);

    this.pdTime = [];
    this.ui = [];
    this.pauseEvents = [];
    this.args = minimist(process.argv.slice(2));
  }

  _createClass(CLI, [{
    key: "hasStartupCommand",
    value: function hasStartupCommand(command) {
      return this.args._.filter(function (n) {
        return n === command;
      }).length > 0;
    }
  }, {
    key: "getArgument",
    value: function getArgument(name) {
      var defaultValue = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      var value = null;

      if (name in this.args) {
        value = this.args[name];
      } else if (name[0] in this.args) {
        value = this.args[name[0]];
      }

      return value !== null ? value : defaultValue;
    }
  }, {
    key: "onPaused",
    value: function onPaused(event) {
      this.pauseEvents.push(event);
    }
  }, {
    key: "clear",
    value: function clear() {
      this.write(chalk.reset("\x1b[2J\x1b[0;0H"));
    }
  }, {
    key: "write",
    value: function write(msg) {
      return process.stdout.write.bind(process.stdout)(msg);
    }
  }, {
    key: "log",
    value: function log(message) {
      console.log(message);
    }
  }, {
    key: "read",
    value: function read(question) {
      var hidden = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var scheme = ["questions", {
        type: hidden ? "password" : "input",
        message: question,
        name: "response"
      }];
      var promise = inquirer.prompt(scheme);
      this.ui.push(promise['ui']);
      return promise.then(function (answer) {
        return answer.response;
      });
    }
  }, {
    key: "closePrompts",
    value: function closePrompts() {
      this.ui.map(function (ui) {
        if (!ui['closed']) {
          ui.close();
          ui['closed'] = true;
        } else {}
      });
    }
  }, {
    key: "startProgress",
    value: function startProgress() {
      var _this = this;

      this.pdTime.push(setInterval(function () {
        _this.write(chalk.green("."));
      }, 200));
    }
  }, {
    key: "stopProgress",
    value: function stopProgress() {
      clearInterval(this.pdTime.pop());
    }
  }, {
    key: "workspace",
    value: function workspace() {
      this.write("Started monitoring \n");
      this.write("Quit the script with CONTROL-C\".\n");
      this.write(chalk.magenta("-----------------------------------------------------------\n"));
    }
  }, {
    key: "usage",
    value: function usage() {
      var message = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
      var code = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      if (message) {
        this.write(chalk.red(message) + "\n");
      }

      this.write(chalk.yellow.underline("\nUSAGE:\n"));
      this.write("Make sure you have the config file by running.\n");
      this.write(chalk.green("syncjs init\n"));
      this.write("--------------------\n");
      this.write("For more details please visit. https://github.com/serkanyersen/sync\n");
      process.exit(code);
    }
  }, {
    key: "getHelp",
    value: function getHelp(command, text) {
      return "".concat(chalk.green(command), ": ").concat(text, "\n");
    }
  }, {
    key: "showPrompt",
    value: function showPrompt() {
      var _this2 = this;

      if (this.activePrompt) {
        this.closePrompts();
      }

      this.activePrompt = this.read(">>> ");
      this.activePrompt.then(function (answer) {
        _this2.handleInput(answer);

        _this2.activePrompt = false;

        _this2.showPrompt();
      });
    }
  }, {
    key: "handleInput",
    value: function handleInput(input) {
      var _this3 = this;

      input = input.split(" ");
      var cmd = input[0];
      var arg1 = input[1];

      switch (cmd) {
        case "help":
          var helpText = "";
          helpText += this.getHelp("pause", "Stops observing file changes");
          helpText += this.getHelp("resume", "Continue checking files");
          helpText += this.getHelp("resume -u", "Continue checking files and upload all the changed files while paused.");
          helpText += this.getHelp("help", "Displays this text");
          helpText += this.getHelp("clear", "Clears the screen");
          helpText += this.getHelp("exit", "Exits the script");
          this.write(helpText);
          break;

        case "clear":
          this.workspace();
          break;

        case "exit":
          process.exit(EXIT_CODE.NORMAL);
          break;

        case "pause":
          this.paused = true;
          this.pauseEvents.map(function (ev) {
            ev(_this3.paused);
          });
          this.workspace();
          break;

        case "resume":
          if (this.paused) {
            if (arg1 != "-u") {
              this.lastRun = +new Date();
              this.timeDiff = 0;
            }

            this.paused = false;
            this.workspace();

            if (arg1 == "-u") {
              this.write("Finding all changed files while waiting.\n");
            }

            this.pauseEvents.map(function (ev) {
              ev(_this3.paused);
            });
          } else {
            this.write("Already running\n");
          }

          break;

        case "":
          break;

        default:
          this.write(chalk.red("Unknown command: ".concat(cmd, "\nType \"help\" to see commands")));
      }
    }
  }]);

  return CLI;
}();

exports["default"] = CLI;