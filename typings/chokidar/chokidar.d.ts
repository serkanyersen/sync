// Type definitions for chokidar 1.0.0
// Project: https://github.com/paulmillr/chokidar
// Definitions by: Stefan Steinhart <https://github.com/reppners/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../node/node.d.ts" />

declare module "fs"
{
    interface FSWatcher
    {
        add(fileDirOrGlob:string):void;
        add(filesDirsOrGlobs:Array<string>):void;
        unwatch(fileDirOrGlob:string):void;
        unwatch(filesDirsOrGlobs:Array<string>):void;
    }
}

declare module "chokidar"
{
    interface WatchOptions
    {
        persistent?:boolean;
        ignored?:any;
        ignoreInitial?:boolean;
        followSymlinks?:boolean;
        cwd?:string;
        usePolling?:boolean;
        useFsEvents?:boolean;
        alwaysStat?:boolean;
        depth?:number;
        interval?:number;
        binaryInterval?:number;
        ignorePermissionErrors?:boolean;
        atomic?:boolean;
    }

    import fs = require("fs");

    interface FSWatcher extends fs.FSWatcher {
        add(path:string);
        add(paths:string[]);  // (path / paths): Add files, directories, or glob patterns for tracking. Takes an array of strings or just one string.
        on(event:string, callback:Function);// Listen for an FS event. Available events: add, addDir, change, unlink, unlinkDir, ready, raw, error. Additionally all is available which gets emitted with the underlying event name and path for every event other than ready, raw, and error.
        unwatch(path:string);
        unwatch(paths:string[]); // : Stop watching files, directories, or glob patterns. Takes an array of strings or just one string.
        close(); //: Removes all listeners from watched files.
    }

    function watch( fileDirOrGlob:string, options?:WatchOptions ): FSWatcher;
    function watch( filesDirsOrGlobs:Array<string>, options?:WatchOptions ): FSWatcher;
}
