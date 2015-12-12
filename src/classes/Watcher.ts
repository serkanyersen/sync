import * as chokidar from "chokidar";
import Uploader from "./Uploader";
import Config from "./Config";
import { FSWatcher } from "fs";

export default class Watcher {
    files: FSWatcher;

    constructor(
        private uploader: Uploader,
        private config: Config,
        private base: string = process.cwd()
        ) {

        let defaultIgnores:Array<string|RegExp> = [/node_modules/, /.git/, /.svn/, /bower_components/];

        this.files = chokidar.watch(base, {
            ignored: defaultIgnores.concat(this.config.ignores),
            ignoreInitial: true
        });

        // Attach events
        ["all", "add", "change", "unlink", "unlinkDir"].forEach(method => {
            this.files.on(method, this[method]);
        });
    }

    ready(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.files.on("ready", ()=>{});
        });
    }

    all = (event:string, path:string) => {
        console.log(event,": ", path);
    };

    add = (path: string) => {
        //console.log("add", path);
    };

    change = (path: string) => {
        this.uploader.uploadFile(path).then(remote => {
            console.log(`File uploaded ${remote}`);
        }).catch((err) => {
            console.error(err.message, err.error);
        });
    };

    unlink = (path: string) => {
        //console.log("unlink", path);
    };

    unlinkDir = (path: string) => {
        //console.log("unlinkDir", path);
    };
}
