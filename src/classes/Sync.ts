import {exec} from 'child_process';
import moment = require('moment');
import SyncError from './SyncError';
import Config from './Config';
import CLI from './CLI';
import Watcher from './Watcher';

export default class Sync {
    config: Config;
    watch: Watcher;
    cli: CLI;

    constructor() {

        this.config = new Config();
        this.cli = new CLI(
            this.config.intervalDuration
        );

        this.cli.write('Connecting');
        this.cli.startProgress();

        this.watch = new Watcher();
        this.watch.ready().then(() => {
            return this.connect();
        }).then(() => {
            this.cli.stopProgress();
            this.cli.workspace();
        });
    }

    connect(): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            setTimeout(() => {
                resolve('connected');
            }, 5000);
        });
    }
}