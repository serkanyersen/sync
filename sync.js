'use strict';
var Sync = (function () {
    /**
    * Initiate the script
    */
    function Sync() {
        // for colored and powerful command line
        this.clc = require('cli-color');
        // shortcut to write to console
        this.write = process.stdout.write.bind(process.stdout);
        // execute a child process
        this.exec = require('child_process').exec;
        // Date Time parsing easy way
        this.moment = require('moment');
        // self explanatory sprintf method
        this.sprintf = require('underscore.string').sprintf;
        // Check if string ends with given substring
        this.endsWith = require('underscore.string').endsWith;
        // read users input, for command line
        this.readline = require('readline');
        // when was the last time script checked changes
        this.lastRun = +(new Date());
        // how many seconds it took to start checking again
        this.timeDiff = 0;
        // if true, stop checking changes
        this.paused = false;
        // time handler for print dots functions
        this.pdTime = 0;
        // initiate moment
        this.moment().format();
        this.getConfig();
        this.initReadline();

        // How many seconds should script wait for each interval?
        this.secondsInterval = this.config.interval_duration || 1.5;

        // Path names to sync
        this.localPath = this.config.local_path;
        this.remotePath = this.config.remote_path;
        this.generateFindCMD();
        this.host = this.config.host;

        // switch to project path to run commands relatively
        process.chdir(this.localPath);

        this.createMasterConection();
    }
    /**
    * Read config file and check it's existance
    */
    Sync.prototype.getConfig = function () {
        try  {
            this.config = require("./config.json");
        } catch (e) {
            console.log(this.clc.red('Please create a config file by copying the config_example.json'));
            process.exit(1);
        }

        if (!this.endsWith(this.config.remote_path, '/')) {
            this.config.remote_path += '/';
        }
    };

    /**
    * Start read line process, and check if installed nodejs compatible with it
    * @return {[type]} [description]
    */
    Sync.prototype.initReadline = function () {
        try  {
            this.rl = this.readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        } catch (e) {
            console.log('You need to upgrade your nodejs');
            console.log('http://slopjong.de/2012/10/31/how-to-install-the-latest-nodejs-in-ubuntu/');
            process.exit(1);
        }
    };

    /**
    * Start printing dots to screen, show script is working
    */
    Sync.prototype.dotsStart = function () {
        var self = this;
        this.pdTime = setInterval(function () {
            self.write(self.clc.yellow('.'));
        }, 200);
    };

    /**
    * Stop printing dots when process ends
    */
    Sync.prototype.dotsStop = function () {
        clearInterval(this.pdTime);
    };

    /**
    * Convert date time string to unix time
    */
    Sync.prototype.getSecondsOf = function (time) {
        var t = this.moment(time);
        if (t !== null) {
            return t.unix();
        }
        return 0;
    };

    /**
    * Generate a find command for both OSX and Ubuntu
    * ubuntu should cover most linux versions
    */
    Sync.prototype.generateFindCMD = function () {
        if (process.platform === 'darwin') {
            // for mac os x
            this.cmd = 'ls -1CloTtr $( find . -type f -mtime -5m -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, $7, $8, "-", $9 }\'';
        } else {
            // for linux
            this.cmd = 'ls -1Clotr --time-style=+\'%d-%b-%Y %T\' $( find . -type f -mmin -5 -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, "-", $7 }\'';
        }
    };

    /**
    * Upload given file to server then call given callback
    */
    Sync.prototype.uploadFile = function (line, callback, i) {
        var self = this;

        // notify user that upload has started
        this.write(this.clc.magenta(i) + ' ' + this.clc.yellow(this.sprintf('Uploading file: %s ', line[0])));

        // create scp command
        var scp = this.sprintf('scp %s %s:%s', line[0], this.host, line[1]);

        // start printing dots
        this.dotsStart();

        //execute command
        this.exec(scp, function (e) {
            // command completed, stop dots
            self.dotsStop();

            if (e !== null) {
                self.write(self.clc.red(self.sprintf('ERROR on: %s Message: %s\n', line[1], e)));
            } else {
                self.write(self.clc.green(' Saved.\n'));
            }

            // call callback no matter what
            callback();
        });
    };

    /**
    * Returns a list of changed files
    */
    Sync.prototype.getChangedFiles = function (lines) {
        var self = this;

        // an empty array to fill changed files
        var changedFiles = [];

        // create a unix time right before our last check
        var anIntervalAgo = this.moment().unix() - this.timeDiff;

        // loop all returned files
        lines.forEach(function (line) {
            // split the file list so that we can have the file name and changed date
            var details = line.split(' - ');

            // Convert date to seconds, so we can compare it unix time of now
            var fileSeconds = self.getSecondsOf(details[0]);

            // merge rest of the details to re-genrate the file name
            details.shift();
            var filename = details.join('');

            if (fileSeconds > anIntervalAgo) {
                // create remote file name and add to the array
                var remoteFile = filename.replace('./', self.remotePath);
                if (!self.endsWith(filename, '.swp') && !self.endsWith(filename, '.pyc') && !self.endsWith(filename, '.DS_Store')) {
                    changedFiles.push([filename, remoteFile]);
                }
            }
        });

        return changedFiles;
    };

    /**
    * Keep the script explanation at the top of the page
    */
    Sync.prototype.printTitle = function () {
        this.write(this.clc.reset + '\n');
        if (this.paused) {
            this.write('Currently paused, type "' + this.clc.green('resume') + '" to start again.\n');
        } else {
            this.write(this.sprintf('Started monitoring, checking every %s seconds.\n', this.secondsInterval));
        }
        this.write('Quit the script with CONTROL-C or type "' + this.clc.green('exit') + '".\n');
        this.write(this.clc.magenta('-----------------------------------------------------------\n'));
        this.showPrompt();
    };

    /**
    * Show prompt line so user can run commands
    */
    Sync.prototype.showPrompt = function () {
        var self = this;
        this.rl.question(">>> ", function (answer) {
            self.handleInput(answer);

            // as soon as a command is run, show promt again just a like a real shell
            self.showPrompt();
        });
    };

    /**
    * Short cut to generate a help text
    */
    Sync.prototype.getHelp = function (command, text) {
        return this.sprintf("%s: %s\n", this.clc.green(command), text);
    };

    /**
    * a little command line interface to control the script
    */
    Sync.prototype.handleInput = function (inputRaw) {
        var input = inputRaw.split(' ');
        var cmd = input[0];
        var arg1 = input[1];
        switch (cmd) {
            case "help":
                var helpText = "";
                helpText += this.getHelp('pause', "Stops observing file changes");
                helpText += this.getHelp('resume', "Continue checking files");
                helpText += this.getHelp('resume -u', "Continue checking files and upload all the changed files while paused.");
                helpText += this.getHelp('interval [s]', 'Sets the check interval duration. Example: "interval 2.5" check for every 2.5 seconds');
                helpText += this.getHelp('help', "Displays this text");
                helpText += this.getHelp('clear', "Clears the screen");
                helpText += this.getHelp('exit', "Exits the script");
                this.write(helpText);
                break;
            case "clear":
                this.printTitle();
                break;
            case "exit":
                process.exit(0);
                break;
            case "pause":
                this.paused = true;
                break;
            case "resume":
                if (this.paused) {
                    if (arg1 != "-u") {
                        this.lastRun = +(new Date());
                        this.timeDiff = 0;
                    }
                    this.paused = false;
                    this.printTitle();
                    if (arg1 == "-u") {
                        this.write('Finding all changed files while waiting.\n');
                    }
                    this.startChecking();
                } else {
                    this.write('Already running\n');
                }
                break;
            case "interval":
                if (arg1) {
                    this.secondsInterval = parseFloat(arg1) || this.secondsInterval;
                    this.printTitle();
                }
                this.write('Check interval is ' + this.secondsInterval + ' Seconds\n');
                break;
            case "":
                break;
            default:
                console.log(this.clc.red('Unknown command: "' + cmd + '"\nType "help" to see commands'));
        }
    };

    /**
    * Creates a master SSH connection, keeps the connection open
    * so `scp` commands work faster by sharing the same persisten connection
    */
    Sync.prototype.createMasterConection = function () {
        var self = this;

        // Show starting text
        this.write('Connecting.');
        this.dotsStart();

        // Keep a connection open to make scp commands faster
        this.ssh = this.exec('ssh -Mv ' + this.host, function () {
            self.write(self.clc.red('\nSSH connection failed.\n'));

            // stop showing dots
            self.dotsStop();
            process.exit(1);
        });

        // Wait for SSH connection to be connected
        this.ssh.stderr.on('data', function (data) {
            if (data.toString().indexOf('Next authentication method: password') != -1) {
                self.dotsStop();
            }

            if (data.toString().indexOf('Entering interactive session') != -1) {
                // stop showing dots
                self.dotsStop();

                // Let user know what's happening
                self.printTitle();

                // Start Checking changes
                self.startChecking();
            }
        });
    };

    /**
    * Start checking changes, since we don't use setInterval
    * this function is called for starting each loop
    */
    Sync.prototype.startChecking = function () {
        // calculate the last time it run, so we can check back to that point and get the changes while file was uploaded
        this.timeDiff = (+(new Date()) - this.lastRun) / 1000;
        this.lastRun = +(new Date());
        if (this.paused) {
            this.printTitle();
            return false;
        }

        // start again
        setTimeout(this.checkChanges.bind(this), this.secondsInterval * 1000);
    };

    /**
    * Execude find command and upload any changed file
    * @return {[type]} [description]
    */
    Sync.prototype.checkChanges = function () {
        // Execute the find command and get all recently changed files
        this.exec(this.cmd, this.onFindComplete.bind(this));
    };

    /**
    * When find command is completed, check for changed files and upload them
    * if necessary
    */
    Sync.prototype.onFindComplete = function (error, stdout, stderr) {
        if (error !== null) {
            this.write(this.clc.red('exec error: ' + error) + '\n');
        } else {
            // Get all the lines from the output
            var lines = stdout.split(/\n/);

            if (lines.length > 0) {
                // an index to gradually step changed files list
                this.cfIndex = 0;

                // Get only the files that are changed from the last time we checked
                this.cf = this.getChangedFiles(lines);

                if (this.cf.length > 0) {
                    // Clear the screen
                    this.printTitle();
                    if (this.config.visorSupport) {
                        this.exec("osascript -e 'set prev_ to name of (info for (path to frontmost application))' " + "-e 'tell application \"Terminal\" to activate' " + "-e 'delay 1' " + "-e 'tell application prev_ to activate'");
                    }

                    // Display how many files were changed
                    this.write(this.cf.length + ' file' + (this.cf.length > 1 ? 's' : '') + ' changed.' + '\n');

                    // Start uploading files as soon as function is created
                    this.uploadAll();
                } else {
                    this.startChecking();
                }
            } else {
                this.startChecking();
            }
        }
    };

    /**
    * Instead of looping changed files list, create a callback loop
    * so each iteration will start after the previous one is completed
    * this is needed to prevent creating too many connections with `scp`
    */
    Sync.prototype.uploadAll = function (index) {
        var self = this;

        if (this.cfIndex < this.cf.length) {
            // Upload the current file, and when it's finished
            // switch to next one
            this.uploadFile(this.cf[this.cfIndex], function () {
                self.uploadAll(++self.cfIndex);
            }, this.cf.length > 1 ? this.sprintf('[%s - %s]', this.cfIndex + 1, this.cf.length) : '>');
        } else {
            if (this.cf.length > 1) {
                this.write('All files are uploaded.\n');
            }
            this.showPrompt();
            this.startChecking();
        }
    };
    return Sync;
})();

// Let the games begin!!!
new Sync();
