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
var exec = require('child_process').exec;
var moment = require('moment');
moment().format();

// How many seconds should script wait for each interval?
var secondsInterval = 1.5;
// Path names to sync
var localPath = '/Users/serkanyersen/src/beautifulmind';
var remotePath = '/home/serkan/src/beautifulmind/';

// host name:
// if you don't have a host configuration
// hostname should include username like
// serkan@10.0.1.2
var host = 'dev';

var cmd;
// Command to get changed files
if (process.platform === 'darwin'){
    // for mac os x
    cmd = 'ls -1CloTtr $( find . -type f -ctime 0 -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, $7, $8, "-", $9 }\'';
}else{
    // for linix
    cmd = 'ls -1Clotr --time-style=long-iso $( find . -type f -ctime 0 -print ) | grep -v \'.git/\' | awk \'{ print  $5, $6, "-", $7 }\'';
}

/**
 * Cool way to show script is currently working
 */
var printDots = (function(){
    var time = 0;
    return {
        start: function(){
            this.stop();
            time = setInterval(function(){
                process.stdout.write(clc.yellow('.'));
            }, 200);
        },
        stop: function(){
            clearInterval(time);
            console.log('');
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
    process.stdout.write(clc.yellow('Changed file: ' + line[0]));
    // create scp command
    var scp = 'scp ' + line[0] + ' ' + host + ':' + line[1];
    // start printing dots
    printDots.start();
    //execute command
    exec(scp, function(e){
        // command completed, stop dots
        printDots.stop();
        // if there is an error during upload, print it otherwise give user success message
        if (e !== null) {
            console.log(clc.red('ERROR on: ' +line[1] + ' \n Message:' + e));
        }else{
            console.log(i+' - ' + clc.green(line[0]+' saved.'));
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
    var anIntervalAgo = moment().unix() - (secondsInterval + 0.5);
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
console.log('Connecting.');
printDots.start();

// Keep a connection open to make scp commands faster
exec('ssh '+host, function(){
    console.log(clc.red('Connection ended.'));
});

// wait for 2 seconds so SSH connection can have time to connect
// Currently there is no way to understand if SSH connection started or not
setTimeout(function(){
    // stop showing dots
    printDots.stop();
    // Let user know what's happening
    console.log(clc.reset);
    console.log('Started monitoring, checking every '+secondsInterval+' seconds.');
    console.log('Quit the script with CONTROL-C.');
    console.log(clc.magenta('-----------------------------------------------------------'));
    // Flag to check if an upload is in progress or not
    var running = false;

    // This interval will run the `find` command for given period of time
    // Until it's stopped by user
    setInterval(function(){
        // If an upload is in porgress don't start a new check
        if(running){
            return false;
        }
        // Execute the find command and get all recently changed files
        exec(cmd, function(error, stdout) {
            // if there is an error, print and exit
            if (error !== null) {
                console.log(clc.red('exec error: ' + error));
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
                        // Display how many files were changed
                        console.log(clc.green('>>> ') + cf.length + ' files changed');
                        // Instead of looping changed files list, create a callback loop
                        // so each iteration will start after the previous one is completed
                        // this is needed to prevent creating too many connections with `scp`
                        var uploadAll = function(){
                            // Set flag to running, so another interval won't start
                            running = true;
                            // while index is less than changed files length
                            if(i < cf.length){
                                // Upload the current file, and when it's finished
                                // switch to next one
                                uploadFile(cf[i], function(){
                                    uploadAll(++i);
                                }, ('[' +(i+1) + ' - ' + cf.length)+']'); // [1 - 25] like string to show the status of the upload
                            }else{
                                // upload is completed so set running to false
                                running = false;
                                console.log('All files are uploaded.');
                            }
                        };
                        // Start uploading files as soon as function is created
                        uploadAll();
                    }
                }
            }
        });

    }, secondsInterval * 1000);

}, 2000);
