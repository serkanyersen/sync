import {exec} from 'child_process';
import moment = require('moment');
import SyncError from './classes/SyncError';
import Config from './classes/Config';
import CLI from './classes/CLI';

export default class Sync {
    config: Config;
    cli: CLI;

    constructor() {
        this.config = new Config();
        this.cli = new CLI(
            this.config.intervalDuration
        );
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