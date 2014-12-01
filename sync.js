#!/usr/bin/env node
'use strict';
/**
 * a nifty tool to sync your local folder with remote folder
 * --------------------------------------------------------------
 * INSTALLATION, just clone this to any place on your computer
 * and cd to sync folder, then run: `npm install` and run server
 * by calling `nodejs sync.js`
 * --------------------------------------------------------------
 * For best usage, create a config file as ~/.ssh/config
 * and put this inside
 * Author: Serkan
---------- ~/.ssh/config ------------------
Host *
    ControlMaster auto
    ControlPath ~/.ssh/master-%r@%h:%p

Host dev
    HostName {HOST URL OR IP}
    User {YOUR USERNAME}
-------------------------------------------
 * so script can maintain a persistent SSH connection and be faster
 */
var sync = {
    // for colored and powerful command line
    clc: require('cli-color'),
    // shortcut to write to console
    write: process.stdout.write.bind(process.stdout),
    // execute a child process
    exec: require('child_process').exec,
    // Date Time parsing easy way
    moment: require('moment'),
    // self explanatory sprintf method
    sprintf: require('underscore.string').sprintf,
    // Check if string ends with given substring
    endsWith: require('underscore.string').endsWith,
    // read users input, for command line
    readline: require('readline'),
    // when was the last time script checked changes
    lastRun: +(new Date()),
    // how many seconds it took to start checking again
    timeDiff: 0,
    // if true, stop checking changes
    paused: false,
    // time handler for print dots functions
    pdTime: 0,
    /**
     * Read config file and check it's existance
     */
    getConfig: function(){
        // Check the existance of the config file
        try{
            this.config = require("./config.json");
        }catch(e){
            console.log(this.clc.red('Please create a config file by copying the config_example.json'));
            process.exit(1);
        }
        // Make sure remote path ends with slash
        if(!this.endsWith(this.config.remote_path, '/')){
            this.config.remote_path += '/';
        }
    },
    /**
     * Start read line process, and check if installed nodejs compatible with it
     * @return {[type]} [description]
     */
    initReadline: function(){
        // Ubuntu uses the old version of node.js and it doesn't have support for readline features
        // So check here for errors and warn user about node upgrade
        try{
            this.rl = this.readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        }catch(e){
            console.log('You need to upgrade your nodejs');
            console.log('http://slopjong.de/2012/10/31/how-to-install-the-latest-nodejs-in-ubuntu/');
            process.exit(1);
        }
    },
    /**
     * Start printing dots to screen, show script is working
     */
    dotsStart: function(){
        var self = this;
        this.pdTime = setInterval(function(){
            self.write(self.clc.yellow('.'));
        }, 200);
    },
    /**
     * Stop printing dots when process ends
     */
    dotsStop: function(){
        clearInterval(this.pdTime);
    },
    /**
     * Convert date time string to unix time
     */
    getSecondsOf: function (time) {
        var t = this.moment(new Date(time));
        if (t !== null) {
            return t.unix();
        }
        return 0;
    },
    /**
     * Generate a find command for both OSX and Ubuntu
     * ubuntu should cover most linux versions
     */
    generateFindCMD: function(){
        // ls command powered with find to get recently changed files
        // Command to get changed files
        if (process.platform === 'darwin'){
            // for mac os x
            this.cmd = 'ls -1CloTtr $( find . -type f -mtime -5m -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, $7, $8, "-", $9 }\'';
        }else{
            // for linux
            this.cmd = 'ls -1Clotr --time-style=+\'%d-%b-%Y %T\' $( find . -type f -mmin -5 -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, "-", $7 }\'';
        }
    },
    /**
     * Upload given file to server then call given callback
     */
    uploadFile: function (line, callback, i){
        var self = this;
        // notify user that upload has started
        this.write( this.clc.magenta(i) + ' ' + this.clc.yellow(this.sprintf('Uploading file: %s ', line[0])));
        // create scp command
        var scp = this.sprintf('scp %s %s:%s', line[0], this.host, line[1]);
        // start printing dots
        this.dotsStart();
        //execute command
        this.exec(scp, function(e){
            // command completed, stop dots
            self.dotsStop();
            // if there is an error during upload, print it otherwise give user success message
            if (e !== null) {
                self.write(self.clc.red(self.sprintf('ERROR on: %s Message: %s\n', line[1], e)));
            }else{
                self.write(self.clc.green(' Saved.\n'));
                self.showNotification('File uploaded');
            }
            // call callback no matter what
            callback();
        });
    },
    /**
     * Returns a list of changed files
     */
    getChangedFiles: function (lines){
        var self = this;
        // an empty array to fill changed files
        var changedFiles = [];
        // create a unix time right before our last check
        var anIntervalAgo = this.moment().unix() - this.timeDiff;
        // loop all returned files
        lines.forEach(function(line){
            // split the file list so that we can have the file name and changed date
            var details = line.split(' - ');
            // Convert date to seconds, so we can compare it unix time of now
            var fileSeconds = self.getSecondsOf(details[0]);
            // merge rest of the details to re-genrate the file name
            details.shift();
            var filename = details.join('');

            // if file changed at least an interval ago, then it is a recent change
            if (fileSeconds > anIntervalAgo) {
                // create remote file name and add to the array
                var remoteFile = filename.replace('./', self.remotePath);
                if(!self.endsWith(filename, '.swp') &&
                   !self.endsWith(filename, '.pyc') &&
                   !self.endsWith(filename, '.DS_Store')){
                    changedFiles.push([filename, remoteFile]);
                }
            }
        });

        return changedFiles;
    },
    /**
     * Keep the script explanation at the top of the page
     */
    printTitle: function(){
        this.write(this.clc.reset + '\n');
        if(this.paused){
            this.write('Currently paused, type "'+ this.clc.green('resume') + '" to start again.\n');
        }else{
            this.write(this.sprintf('Started monitoring, checking every %s seconds.\n', this.secondsInterval));
        }
        this.write('Quit the script with CONTROL-C or type "'+this.clc.green('exit')+'".\n');
        this.write(this.clc.magenta('-----------------------------------------------------------\n'));
        this.showPrompt();
    },
    /**
     * Show prompt line so user can run commands
     */
    showPrompt: function(){
        var self = this;
        this.rl.question(">>> ", function(answer) {
          self.handleInput(answer);
          // as soon as a command is run, show promt again just a like a real shell
          self.showPrompt();
        });
    },
    /**
     * Short cut to generate a help text
     */
    getHelp: function(command, text){
        return this.sprintf("%s: %s\n", this.clc.green(command), text);
    },
    /**
     * a little command line interface to control the script
     */
    handleInput: function(input){
        input = input.split(' ');
        var cmd = input[0];
        var arg1 = input[1];
        switch(cmd){
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
                if(this.paused){
                    if(arg1 != "-u"){
                        this.lastRun = +(new Date());
                        this.timeDiff = 0;
                    }
                    this.paused = false;
                    this.printTitle();
                    if(arg1 == "-u"){
                        this.write('Finding all changed files while waiting.\n');
                    }
                    this.startChecking();
                }else{
                    this.write('Already running\n');
                }
            break;
            case "interval":
                if(arg1){
                    this.secondsInterval = parseFloat(arg1) || this.secondsInterval;
                    this.printTitle();
                }
                this.write('Check interval is '+this.secondsInterval+' Seconds\n');
            break;
            case "":break;
            default:
                console.log(this.clc.red('Unknown command: "'+cmd+'"\nType "help" to see commands'));
        }
    },
    /**
     * Creates a master SSH connection, keeps the connection open
     * so `scp` commands work faster by sharing the same persisten connection
     */
    createMasterConection: function(){
        var self = this;
        // Show starting text
        this.write('Connecting.');
        this.dotsStart();

        // Keep a connection open to make scp commands faster
        this.ssh = this.exec('ssh -Mv '+this.host, function(){
            self.write(self.clc.red('\nSSH connection failed.\n'));
            // stop showing dots
            self.dotsStop();
            process.exit(1);
        });

        // Wait for SSH connection to be connected
        this.ssh.stderr.on('data', function (data) {
            // if asks for password, stop printing dots
            if(data.toString().indexOf('Next authentication method: password') != -1){
                self.dotsStop();
            }
            // SSH initially throws an exception, when first executed from node.
            // just ignoring that message is enough
            if(data.toString().indexOf('Entering interactive session') != -1){
                // stop showing dots
                self.dotsStop();

                // Let user know what's happening
                self.printTitle();

                // Start Checking changes
                self.startChecking();
            }
        });
    },
    /**
     * Start checking changes, since we don't use setInterval
     * this function is called for starting each loop
     */
    startChecking: function(){
        // calculate the last time it run, so we can check back to that point and get the changes while file was uploaded
        this.timeDiff = (+(new Date()) - this.lastRun) / 1000;
        this.lastRun = +(new Date());
        if (this.paused){
            this.printTitle();
            return false;
        }
        // start again
        setTimeout(this.checkChanges.bind(this), this.secondsInterval * 1000);
    },
    /**
     * Show a notification using mac os x notification center
     * @param  {[type]} message Message to show
     */
    showNotification: function(message) {
        if (this.config.showNotification) {
            this.exec("osascript -e 'display notification \""+message+"\" with title \"Sync.js\"'");
        }
        if (this.config.useTerminalNotifier) {
            var bin = 'terminal-notifier ';
            this.exec(bin + ["-title 'Sync.js'",
                             "-message '" + message + "'",
                             "-group 'Sync.js'",
                             "-activate " + this.config.terminalNotifierSenderID,
                             "-sender " + this.config.terminalNotifierSenderID].join(' '));
        }
    },
    /**
     * Execude find command and upload any changed file
     * @return {[type]} [description]
     */
    checkChanges: function(){
        // Execute the find command and get all recently changed files
        this.exec(this.cmd, this.onFindComplete.bind(this)); // EO exec
    },
    /**
     * When find command is completed, check for changed files and upload them
     * if necessary
     */
    onFindComplete: function(error, stdout, stderr) {
        //console.log(stdout);
        //console.log(error, stderr);
        // if there is an error, print and exit
        if (error !== null) {
            this.write(this.clc.red('exec error: ' + error) + '\n');
            this.showNotification('exec error: ' + error);
        }else{
            // Get all the lines from the output
            var lines = stdout.split(/\n/);
            // run only if there is an output
            if(lines.length > 0){
                // an index to gradually step changed files list
                this.cfIndex = 0;
                // Get only the files that are changed from the last time we checked
                this.cf = this.getChangedFiles(lines);
                // If there are changed files
                if(this.cf.length > 0){
                    // Clear the screen
                    this.printTitle();
                    if(this.config.visorSupport){
                        this.exec("osascript -e 'set prev_ to name of (info for (path to frontmost application))' " +
                                            "-e 'tell application \"Terminal\" to activate' " +
                                            "-e 'delay 1' " +
                                            "-e 'tell application prev_ to activate'");
                    }
                    // Display how many files were changed
                    var message = this.cf.length + ' file'+(this.cf.length>1? 's':'')+' changed.' + '\n';
                    this.write(message);
                    this.showNotification(message);

                    // Start uploading files as soon as function is created
                    this.uploadAll();
                }else{
                    this.startChecking(); // if no changed file found, start checking again
                }
            }else{
                this.startChecking(); // if no file returned, start checking again
            }
        }
    },
    /**
     * Instead of looping changed files list, create a callback loop
     * so each iteration will start after the previous one is completed
     * this is needed to prevent creating too many connections with `scp`
     */
    uploadAll: function(){
        var self = this;
        // while index is less than changed files length
        if(this.cfIndex < this.cf.length){
            // Upload the current file, and when it's finished
            // switch to next one
            this.uploadFile(this.cf[this.cfIndex], function(){
                self.uploadAll(++self.cfIndex);
            }, this.cf.length>1? this.sprintf('[%s - %s]', this.cfIndex+1, this.cf.length) : '>'); // [1 - 25] like string to show the status of the upload
        }else{
            if(this.cf.length > 1){
                this.write('All files are uploaded.\n');
                this.showNotification('All files are uploaded');
            }
            this.showPrompt();
            this.startChecking();
        }
    },
    /**
     * Initiate the script
     */
    init: function(){
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
};
// Let the games begin!!!
sync.init();
