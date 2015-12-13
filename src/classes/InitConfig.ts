import * as chalk from "chalk";
import * as upath from "upath";
import { writeFileSync } from 'fs';
import CLI, { EXIT_CODE } from "./CLI";
import { SyncConfig, CONFIG_FILE_NAME } from './Config';

export default class InitConfig {

    constructor(private cli: CLI) {
        this.collectInformation();
    }

    collectInformation () {
        let newConfig: SyncConfig = { localPath: null, remotePath: null, host: null };
        let leaveEmpty = chalk.gray("[hit enter to leave empty]");
        let useDefault = chalk.gray("[hit enter to use default]");
        let required = chalk.red("[required]");

        this.cli.read(`${chalk.green("Username to connect")} ${leaveEmpty}`).then(answer => {
            if (answer) {
                newConfig.username = answer;
            }
            return this.cli.read(`${chalk.green("Password to connect")} ${leaveEmpty}`);
        }).then(answer => {
            if (answer) {
                newConfig.password = answer;
            }
            return this.cli.read(`${chalk.green("Port number to connect")} ${leaveEmpty}`);
        })
        .then(answer => {
            if (Number(answer)) {
                newConfig.port = Number(answer);
            }
            return this.cli.read(`${chalk.green("Domain or ip address to connect")} ${required}`);
        })
        .then(answer => {
            if (answer) {
                newConfig.host = answer;
            }
            return this.cli.read(`${chalk.green("Local Path:")} [${process.cwd()}] ${useDefault}`);
        })
        .then(answer => {
            if (answer) {
                newConfig.localPath = upath.normalizeSafe(answer);
            } else {
                newConfig.localPath = upath.normalizeSafe(process.cwd());
            }
            return this.cli.read(`${chalk.green("Remote Path")} ${required}`);
        })
        .then(answer => {
            if (answer) {
                newConfig.remotePath = answer;
            }
            return this.cli.read(`${chalk.green("Path to privateKey if any")} ${leaveEmpty}`);
        })
        .then(answer => {
            if (answer) {
                newConfig.privateKey = upath.normalizeSafe(answer);
            }
            return this.cli.read(`${chalk.green("Does this look good?")}
                                 \n${JSON.stringify(newConfig, null, 4)}
                                 \n${chalk.green("Say [yes] or [no]")}`);
        }).then((answer) => {
            if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
                writeFileSync(CONFIG_FILE_NAME, JSON.stringify(newConfig, null, 4), 'utf8');
                this.cli.write(`${CONFIG_FILE_NAME} is saved.\n`);
            } else {
                this.cli.write("Operation cancelled. Exiting...");
            }

            process.exit(EXIT_CODE.NORMAL);
        });
    }
}