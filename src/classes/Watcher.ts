import * as chokidar from "chokidar";
import { FSWatcher } from "fs";
import Uploader from "./Uploader";
import Config from "./Config";
import CLI from "./CLI";

export default class Watcher {
    files: FSWatcher;

    constructor(
        private uploader: Uploader,
        private config: Config,
        private cli: CLI,
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
            this.files.on("ready", resolve);
        });
    }

    all = (event:string, path:string) => {
        // console.log(event,": ", path);
    };

    add = (path: string) => {
        this.uploader.uploadFile(path).then(remote => {
            console.log(`File uploaded ${remote}`);
        }).catch((err) => {
            console.error(err.message, err.error);
        });
    };

    change = (path: string) => {
        this.uploader.uploadFile(path).then(remote => {
            console.log(`File uploaded ${remote}`);
        }).catch((err) => {
            console.error(err.message, err.error);
        });
    };

    unlink = (path: string) => {
        this.uploader.unlinkFile(path).then(remote => {
            console.log(`File deleted ${remote}`);
        }).catch((err) => {
            console.log(`Error deleting file ${err}`);
        });
    };

    unlinkDir = (path: string) => {
        this.uploader.unlinkFolder(path).then(remote => {
            console.log(`Folder deleted ${remote}`);
        }).catch((err) => {
            console.log(`Error deleting folder ${err}`);
        });
    };
}
