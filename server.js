#!/usr/bin/env node
/**
 * a nifty tool to sync your local folder with remote folder
 * for best usage, create a config file as ~/.ssh/config
 * and put this inside
---------- ~/.ssh/config ------------------
Host *
    ControlMaster auto
    ControlPath ~/.ssh/master-%r@%h:%p

Host dev
    HostName {HOST URL OR IP}
    User {YOUR USERNAME}
-------------------------------------------
 * so script can maintain a persisten SSH connection and be faster
 */

'use strict';

var clc = require('cli-color');
var write = process.stdout.write.bind(process.stdout);
var exec = require('child_process').exec;
var moment = require('moment');
var printf = require('underscore.string').sprintf;
moment().format();

// How many seconds should script wait for each interval?
var secondsInterval = 1.5;
// Path names to sync
var localPath = '/Users/serkanyersen/src/beautifulmind';
var remotePath = '/home/serkan/src/beautifulmind/';
var lastRun = +(new Date());
var timeDiff = 0;
// host name:
// if you don't have a host configuration
// hostname should include username like
// serkan@10.0.1.2
var host = 'dev';

var cmd;
// Command to get changed files
if (process.platform === 'darwin'){
    // for mac os x
    cmd = 'ls -1CloTtr $( find . -type f -mtime -5m -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, $7, $8, "-", $9 }\'';
}else{
    // for linix
    cmd = 'ls -1Clotr --time-style=long-iso $( find . -type f -mtime -5m -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, "-", $7 }\'';
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
    write( clc.magenta(i) + ' ' + clc.yellow(printf('Uploading file: %s', line[0])));
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
            write(clc.green('Saved.\n'));
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
            changedFiles.push([filename, remoteFile]);
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
    write(clc.red('Connection ended.'));
});

var printTitle = function(){
    write(clc.reset + '\n');
    write(printf('Started monitoring, checking every %s seconds.\n', secondsInterval));
    write('Quit the script with CONTROL-C.\n');
    write(clc.magenta('-----------------------------------------------------------\n'));
};


// Wait for SSH connection to completed
ssh.stderr.on('data', function (data) {
    // SSH initially throws an exception, when first executed from node.
    // so just ignore that
    if(data.toString().indexOf('seudo-terminal') != -1){
        return;
    }

    // stop showing dots
    printDots.stop();

    // Let user know what's happening
    printTitle();

    // Start Checking the changed files
    var startChecking = function(){
        // calculate the last time it run, so we can check back to that point and get the changes while file was uploaded
        timeDiff = (+(new Date()) - lastRun) / 1000;
        lastRun = +(new Date());
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
                        // Display how many files were changed
                        write(clc.green('>>> ') + cf.length + ' files changed' + '\n');
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
                                }, printf('[%s - %s]', i+1, cf.length)); // [1 - 25] like string to show the status of the upload
                            }else{
                                write('All files are uploaded.\n');
                                startChecking();
                            }
                        };
                        // Start uploading files as soon as function is created
                        uploadAll();
                    }else{
                        startChecking();
                    }
                }else{
                    startChecking();
                }
            }
        });
    };
    startChecking();
});
