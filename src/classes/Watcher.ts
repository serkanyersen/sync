import * as chokidar from "chokidar"
import * as chalk from "chalk";
import { FSWatcher } from "fs";
import Uploader from "./Uploader";
import Config from "./Config";
import CLI from "./CLI";

interface PausedChanges {
    event: string;
    path: string;
}

export default class Watcher {
    files: FSWatcher;
    private paused = false;
    private changes: PausedChanges[] = [];

    constructor(
        private uploader: Uploader,
        private config: Config,
        private cli: CLI,
        private base: string = config.localPath
    ) {

        let defaultIgnores: Array<string | RegExp> = [/node_modules/, /.git/, /.svn/, /bower_components/];

        this.files = chokidar.watch(base, {
            ignored: defaultIgnores.concat(this.config.ignores),
            ignoreInitial: true
        });

        // Attach events
        ["all", "add", "change", "unlink", "unlinkDir"].forEach(method => {
            this.files.on(method, this.pauseHandler(method));
        });
    }

    ready(): Promise<void> {
        return new Promise<void>((resolve) => {
            this.files.on("ready", resolve);
        });
    }

    pause() {
        this.paused = true;
    }

    resume(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.cli.write(`${ this.changes.length } files had changed while paused.`);
            this.changes.forEach((change) => {
                this.cli.write(`${ this.eventToWord[change.event] }: ${ change.path } `);
                this.cli.read('Do you want to make these uploads? [Y/N] ').then((answer) => {
                    if (answer[0].toUpperCase() === 'Y') {
                        this.cli.write('Uploading.');
                        resolve();
                    } else {
                        reject();
                        this.cli.write('Resuming.');
                    }
                    // Set pause false the last thing. Even if changes happen
                    // during this prompt is on screen. They are still caught
                    this.paused = false;
                });
            });
        });
    }

    eventToWord = {
        add: chalk.green("ADDED"),
        change: chalk.green("CHANGED"),
        unlink: chalk.red("DELETED"),
        unlinkDir: chalk.red("DELETED")
    };


    private pauseHandler(method: string): Function {
        return (...args: string[]) => {
            let path: string,
                event = method;

            // Handle argument difference
            if (method === 'all') {
                path = args[1];
                event = args[0]
            } else {
                path = args[0];
            }

            // If paused store the values
            if (this.paused ) {
                this.changes.push({ event, path });
            } else {
                // If not, continue as ususal
                this[method](...args);
            }
        }
    }


    private all = (event:string, path:string) => {
        if (event in this.eventToWord) {
            this.cli.workspace();
            this.cli.write(`\n${ this.eventToWord[event]} ${path}`);
            this.cli.startProgress();
        }
    };

    private add = (path: string) => {
        this.uploader.uploadFile(path).then(remote => {
            this.cli.stopProgress();
            this.cli.write(`\nSAVED ${remote}`);
        }).catch((err) => {
            this.cli.stopProgress();
            console.error(err.message, err.error);
        });
    };

    private change = (path: string) => {
        this.uploader.uploadFile(path).then(remote => {
            this.cli.stopProgress();
            this.cli.write(`\nSAVED ${remote}`);
        }).catch((err) => {
            this.cli.stopProgress();
            console.error(err.message, err.error);
        });
    };

    private unlink = (path: string) => {
        this.uploader.unlinkFile(path).then(remote => {
            this.cli.stopProgress();
            this.cli.write(`\nSAVED ${remote}`);
        }).catch((err) => {
            this.cli.stopProgress();
            console.log(`Error deleting file ${err}`);
        });
    };

    private unlinkDir = (path: string) => {
        this.uploader.unlinkFolder(path).then(remote => {
            this.cli.stopProgress();
            this.cli.write(`\nSAVED ${remote}`);
        }).catch((err) => {
            this.cli.stopProgress();
            console.log(`Error deleting folder ${err}`);
        });
    };
}
