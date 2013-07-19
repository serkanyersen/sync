#!/usr/bin/env node
/**
 * a nifty tool to sync your local folder with remote folder
 * --------------------------------------------------------------
 * INSTALLATION, just clone this to any place on your computer
 * and cd to sync folder, then run: `npm install` and run server
 * by calling `nodejs server.js`
 * --------------------------------------------------------------
 * For best usage, create a config file as ~/.ssh/config
 * and put this inside
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

'use strict';
var clc = require('cli-color');
var write = process.stdout.write.bind(process.stdout);
var exec = require('child_process').exec;
var moment = require('moment');
var printf = require('underscore.string').sprintf;
var endsWith = require('underscore.string').endsWith;
moment().format();
var readline = require('readline');

// Check the existance of the config file
try{
    var config = require("./config.json");
}catch(e){
    console.log(clc.red('Please create a config file by copying the config_example.json'));
    process.exit(1);
}

// Ubuntu uses the old version of node.js and it doesn't have support for readline features
// So check here for errors and warn user about node upgrade
try{
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
}catch(e){
    console.log('You need to upgrade your nodejs');
    console.log('http://slopjong.de/2012/10/31/how-to-install-the-latest-nodejs-in-ubuntu/');
    process.exit(1);
}

// How many seconds should script wait for each interval?
var secondsInterval = config.interval_duration || 1.5;
// Path names to sync
var localPath = config.local_path;
var remotePath = config.remote_path;
// when was the last time script checked changes
var lastRun = +(new Date());
// how many seconds it took to start checking again
var timeDiff = 0;
// host name:
// if you don't have a host configuration
// hostname should include username like
// serkan@10.0.1.2
var host = config.host;
// if true, stop checking changes
var pause = false;
// a global function to start checking changes again
var startChecking;
// ls command powered with find to get recently changed files
var cmd;
// Command to get changed files
if (process.platform === 'darwin'){
    // for mac os x
    cmd = 'ls -1CloTtr $( find . -type f -mtime -5m -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, $7, $8, "-", $9 }\'';
}else{
    // for linux
    cmd = 'ls -1Clotr --time-style=+\'%d-%b-%Y %T\' $( find . -type f -mmin -5 -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, "-", $7 }\'';
}

/**
 * Cool way to show script is currently working
 */
var printDots = (function(){
    var time = 0;
    return {
        start: function(){
            time = setInterval(function(){
                write(clc.yellow('.'));
            }, 200);
        },
        stop: function(){
            clearInterval(time);
        }
    };
})();

/**
 * Convert date time string to unix time
 */
function getSecondsOf(time) {
    var t = moment(time);
    if (t !== null) {
        return t.unix();
    }
    return 0;
}

/**
 * Upload given file to server then call given callback
 */
function uploadFile(line, callback, i){
    write( clc.magenta(i) + ' ' + clc.yellow(printf('Uploading file: %s ', line[0])));
    // create scp command
    var scp = printf('scp %s %s:%s', line[0], host, line[1]);
    // start printing dots
    printDots.start();
    //execute command
    exec(scp, function(e){
        // command completed, stop dots
        printDots.stop();
        // if there is an error during upload, print it otherwise give user success message
        if (e !== null) {
            write(clc.red(printf('ERROR on: %s Message: %s\n', line[1], e)));
        }else{
            write(clc.green(' Saved.\n'));
        }
        // call callback no matter what
        callback();
    });
}

/**
 * Returns a list of changed files
 */
function getChangedFiles(lines){
    // an empty array to fill changed files
    var changedFiles = [];
    // create a unix time right before our last check
    var anIntervalAgo = moment().unix() - timeDiff;
    // loop all returned files
    lines.forEach(function(line){
        // split the file list so that we can have the file name and changed date
        var details = line.split(' - ');
        // Convert date to seconds, so we can compare it unix time of now
        var fileSeconds = getSecondsOf(details[0]);
        // merge rest of the details to re-genrate the file name
        details.shift();
        var filename = details.join('');

        // if file changed at least an interval ago, then it is a recent change
        if (fileSeconds > anIntervalAgo) {
            // create remote file name and add to the array
            var remoteFile = filename.replace('./', remotePath);
            if(!endsWith(filename, '.swp') && !endsWith(filename, '.pyc')){
                changedFiles.push([filename, remoteFile]);
            }
        }
    });

    return changedFiles;
}

// switch to project path to run commands relatively
process.chdir(localPath);

// Show starting text
write('Connecting.');
printDots.start();

// Keep a connection open to make scp commands faster
var ssh = exec('ssh '+host, function(){
    write(clc.red('SSH Connection ended.\n'));
});

// Keep the script explanation at the top of the page
var printTitle = function(){
    write(clc.reset + '\n');
    if(pause){
        write('Currently paused, type "'+ clc.green('resume') + '" to start again.\n');
    }else{
        write(printf('Started monitoring, checking every %s seconds.\n', secondsInterval));
    }
    write('Quit the script with CONTROL-C or type "'+clc.green('exit')+'".\n');
    write(clc.magenta('-----------------------------------------------------------\n'));
    showPrompt();
};

// a little command line interface to control the script
var handleInput = function(input){
    input = input.split(' ');
    var cmd = input[0];
    var arg1 = input[1];
    switch(cmd){
        case "help":
            var helpText = "";
            helpText += printf("%s: %s\n", clc.green('pause'), "Stops observing file changes");
            helpText += printf("%s: %s\n", clc.green('resume'), "Continue checking files");
            helpText += printf("%s: %s\n", clc.green('resume -u'), "Continue checking files and upload all the changed files while paused.");
            helpText += printf("%s: %s\n", clc.green('interval [s]'), 'Sets the check interval duration. Example: "interval 2.5" check for every 2.5 seconds');
            helpText += printf("%s: %s\n", clc.green('help'), "Displays this text");
            helpText += printf("%s: %s\n", clc.green('clear'), "Clears the screen");
            helpText += printf("%s: %s\n", clc.green('exit'), "Exits the script");
            write(helpText);
        break;
        case "clear":
            printTitle();
        break;
        case "exit":
            process.exit(0);
        break;
        case "pause":
            pause = true;
        break;
        case "resume":
            if(pause){
                if(arg1 != "-u"){
                    lastRun = +(new Date());
                    timeDiff = 0;
                }
                pause = false;
                printTitle();
                if(arg1 != "-u"){
                    write('Finding all changed files while waiting.\n');
                }
                startChecking();
            }else{
                write('Already running\n');
            }
        break;
        case "interval":
            if(arg1){
                secondsInterval = parseFloat(arg1) || secondsInterval;
                printTitle();
            }
            write('Check interval is '+secondsInterval+' Seconds\n');
        break;
        case "":break;
        default:
            console.log(clc.red('Unknown command: "'+cmd+'"\nType "help" to see commands'));
    }
};
// Show prompt line so user can run commands
var showPrompt = function(){
    rl.question(">>> ", function(answer) {
      handleInput(answer);
      showPrompt();
    });
};

// Wait for SSH connection to be connected
ssh.stderr.on('data', function (data) {

    // SSH initially throws an exception, when first executed from node.
    // just ignoring that message is enough
    if(data.toString().indexOf('seudo-terminal') != -1){
        return;
    }

    // stop showing dots
    printDots.stop();

    // Let user know what's happening
    printTitle();

    // Start Checking the changed files
    startChecking = function(){
        // calculate the last time it run, so we can check back to that point and get the changes while file was uploaded
        timeDiff = (+(new Date()) - lastRun) / 1000;
        lastRun = +(new Date());
        if (pause){
            printTitle();
            return false;
        }
        // start again
        setTimeout(checkChanges, secondsInterval * 1000);
    };

    // This interval will run the `find` command for given period of time
    // Until it's stopped by user
    var checkChanges = function(){

        // Execute the find command and get all recently changed files
        exec(cmd, function(error, stdout) {
            // if there is an error, print and exit
            if (error !== null) {
                write(clc.red('exec error: ' + error) + '\n');
            }else{
                // Get all the lines from the output
                var lines = stdout.split(/\n/);
                // run only if there is an output
                if(lines.length > 0){
                    // an index to gradually step changed files list
                    var i = 0;
                    // Get only the files that are changed from the last time we checked
                    var cf = getChangedFiles(lines);
                    // If there are changed files
                    if(cf.length > 0){
                        // Clear the screen
                        printTitle();
                        if(config.visorSupport){
                            exec("osascript -e 'set prev_ to name of (info for (path to frontmost application))' " +
                                           "-e 'tell application \"Terminal\" to activate' " +
                                           "-e 'delay 1' " +
                                           "-e 'tell application prev_ to activate'");
                        }
                        // Display how many files were changed
                        write(cf.length + ' file'+(cf.length>1? 's':'')+' changed.' + '\n');
                        // Instead of looping changed files list, create a callback loop
                        // so each iteration will start after the previous one is completed
                        // this is needed to prevent creating too many connections with `scp`
                        var uploadAll = function(){
                            // while index is less than changed files length
                            if(i < cf.length){
                                // Upload the current file, and when it's finished
                                // switch to next one
                                uploadFile(cf[i], function(){
                                    uploadAll(++i);
                                }, cf.length>1? printf('[%s - %s]', i+1, cf.length) : '>'); // [1 - 25] like string to show the status of the upload
                            }else{
                                if(cf.length > 1){
                                    write('All files are uploaded.\n');
                                }
                                showPrompt();
                                startChecking();
                            }
                        };
                        // Start uploading files as soon as function is created
                        uploadAll();
                    }else{
                        startChecking(); // if no changed file found, start checking again
                    }
                }else{
                    startChecking(); // if no file returned, start checking again
                }
            }
        }); // EO exec
    }; // EO checkChanges
    startChecking(); // initially start checking changes
});
