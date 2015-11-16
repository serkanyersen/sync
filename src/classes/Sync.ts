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
        this.watch = new Watcher();
        this.connect();
    }


    connect() {
        // Test
        this.cli.write('Connecting');
        this.cli.dotsStart();

        setTimeout(() => {
            this.cli.dotsStop();
            this.cli.printTitle();
        }, 5000);
    }
}