import * as upath from "upath";
import { writeFileSync } from 'fs';
import { SyncConfig, CONFIG_FILE_NAME } from './Config';
import inquirer, { Question } from "inquirer";

export default class InitConfig2 {

    constructor() {

        let currentConf = <SyncConfig>{};

        try {
            currentConf = require(upath.resolve(process.cwd(), CONFIG_FILE_NAME));
            console.log("Existing config found.");
        } catch (e) { }

        let questions: any[] = [
            {
                type: "input",
                name: "username",
                message: "Username to connect:",
                validate: (answer) => {
                    if (!answer) {
                        return "Username is required";
                    }
                    return true;
                },
                default: currentConf.username
            },
            {
                type: "list",
                name: "authType",
                message: "How do you want to authenticate:",
                choices: [
                    "Password in config",
                    "Ask password during connection",
                    "Private key"
                ]
            },
            {
                type: "password",
                name: "password",
                message: "Enter your password:",
                when: (answers: any) => answers.authType === "Password in config"
            },
            {
                type: "input",
                name: "privateKey",
                message: "Path to private key:",
                default: currentConf.privateKey,
                when: (answers: any) => answers.authType === "Private key",
                filter: (answer) => {
                    return upath.normalizeSafe(answer);
                }
            },
            {
                type: "input",
                name: "host",
                default: currentConf.host,
                message: "Hostname or IP to connect",
                validate: (answer) => {
                    if (!answer) {
                        return "Hostname is required";
                    }
                    return true;
                }
            },
            {
                type: "input",
                name: "port",
                message: "Port to conenct:",
                default: currentConf.port || "use default"
            },
            {
                type: "input",
                name: "localPath",
                message: "Local Path",
                filter: (answer) => {
                    return upath.normalizeSafe(answer);
                },
                default: currentConf.localPath || process.cwd()
            },
            {
                type: "input",
                name: "remotePath",
                message: "Remote Path",
                default: currentConf.remotePath,
                validate: (answer) => {
                    if (!answer) {
                        return "Remote Path is required";
                    }
                    return true;
                }
            }
        ];

        inquirer.prompt(questions)['then']((answers) => {
            let pass;
            // if default, don't put it in config
            if (answers.port == "use default") {
                delete answers.port;
            }

            // no need this in the config
            delete answers.authType;

            if (answers.password) {
                pass = answers.password;
                answers.password = "****";
            }

            inquirer.prompt({
                type: "confirm",
                name: "yes",
                message: `${JSON.stringify(answers, null, 4)}\nDoes this look good?`
            })['then']((answer) => {
                if (answer.yes) {
                    if (pass) {
                        answers.password = pass;
                    }
                    writeFileSync(CONFIG_FILE_NAME, JSON.stringify(answers, null, 4), 'utf8');
                } else {
                    console.log("No config was saved.");
                }
            })
        });
    }
}
