import * as chalk from "chalk";
import * as upath from "upath";
import { writeFileSync } from 'fs';
import CLI, { EXIT_CODE } from "./CLI";
import { SyncConfig, CONFIG_FILE_NAME } from './Config';

interface PromptOptions {
    leaveEmpty?: boolean;
    useDefault?: boolean;
    required?: boolean;
}

export default class InitConfig {

    constructor(private cli: CLI) {
        this.collectInformation();
    }

    private getPrompt(question: string, options: PromptOptions = {}): string {
        let leaveEmpty = chalk.gray(" [hit enter to leave empty]");
        let useDefault = chalk.gray(" [hit enter to use default]");
        let required = chalk.red(" [required]");
        let marker = "";

        if (options.leaveEmpty) {
            marker += leaveEmpty;
        }

        if (options.useDefault) {
            marker += useDefault;
        }

        if (options.required) {
            marker += required;
        }

        return `${question}${marker}:\n>>> `;
    }

    collectInformation(): void {
        let newConfig: SyncConfig = { localPath: null, remotePath: null, host: null };

        this.cli.read(this.getPrompt("Username to connect", { leaveEmpty: true })).then(answer => {
            if (answer) {
                newConfig.username = answer;
            }
            return this.cli.read(this.getPrompt("Password to connect", { leaveEmpty: true }));
        }).then(answer => {
            if (answer) {
                newConfig.password = answer;
            }
            return this.cli.read(this.getPrompt("Port number to connect", { leaveEmpty: true }));
        }).then(answer => {
            if (Number(answer)) {
                newConfig.port = Number(answer);
            }
            return this.cli.read(this.getPrompt("Domain or ip address to connect", { required: true }));
        }).then(answer => {
            if (answer) {
                newConfig.host = answer;
            }
            return this.cli.read(this.getPrompt(`Local Path: [${process.cwd() }]`, { useDefault: true }));
        }).then(answer => {
            if (answer) {
                newConfig.localPath = upath.normalizeSafe(answer);
            } else {
                newConfig.localPath = upath.normalizeSafe(process.cwd());
            }
            return this.cli.read(this.getPrompt("Remote Path", { required: true }));
        }).then(answer => {
            if (answer) {
                newConfig.remotePath = answer;
            }
            return this.cli.read(this.getPrompt("Path to privateKey if any", { leaveEmpty: true }));
        }).then(answer => {
            if (answer) {
                newConfig.privateKey = upath.normalizeSafe(answer);
            }
            return this.cli.read(this.getPrompt(`Does this look good?"
                                 \n${JSON.stringify(newConfig, null, 4) }
                                 \n${chalk.green("Say [yes] or [no]") }`));
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