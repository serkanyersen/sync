import * as chokidar from "chokidar"
import * as chalk from "chalk";
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

        let defaultIgnores: Array<string | RegExp> = [/node_modules/, /.git/, /.svn/, /bower_components/];

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

    all = (event: string, path: string) => {

        let eventToWord = {
            add: chalk.green("ADDED"),
            change: chalk.green("CHANGED"),
            unlink: chalk.red("DELETED"),
            unlinkDir: chalk.red("DELETED")
        }

        if (event in eventToWord) {
            this.cli.workspace();
            this.cli.write(`\n${eventToWord[event]} ${path}`);
            this.cli.startProgress();
        }
    };

    add = (path: string) => {
        this.uploader.uploadFile(path).then(remote => {
            this.cli.stopProgress();
            this.cli.write(`\nSAVED ${remote}`);
        }).catch((err) => {
            this.cli.stopProgress();
            console.error(err.message, err.error);
        });
    };

    change = (path: string) => {
        this.uploader.uploadFile(path).then(remote => {
            this.cli.stopProgress();
            this.cli.write(`\nSAVED ${remote}`);
        }).catch((err) => {
            this.cli.stopProgress();
            console.error(err.message, err.error);
        });
    };

    unlink = (path: string) => {
        this.uploader.unlinkFile(path).then(remote => {
            this.cli.stopProgress();
            this.cli.write(`\nSAVED ${remote}`);
        }).catch((err) => {
            this.cli.stopProgress();
            console.log(`Error deleting file ${err}`);
        });
    };

    unlinkDir = (path: string) => {
        this.uploader.unlinkFolder(path).then(remote => {
            this.cli.stopProgress();
            this.cli.write(`\nSAVED ${remote}`);
        }).catch((err) => {
            this.cli.stopProgress();
            console.log(`Error deleting folder ${err}`);
        });
    };
}
