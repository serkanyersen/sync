import chalk = require("chalk");
import * as minimist from "minimist";
import inquirer = require("inquirer");

export enum EXIT_CODE {
    /**
     * Exit normally
     */
    NORMAL = 0,

    /**
     * Any kind exit with error
     */
    RUNTIME_FAILURE = 1,

    /**
     * If user terminates with ctrl-c use this
     */
    TERMINATED = 130,

    /**
     * Tell user that arguments were wrong
     */
    INVALID_ARGUMENT = 128
}

export default class CLI {

    private pdTime: Array<NodeJS.Timer> = [];
    private lastRun: number;
    private timeDiff: number;
    private args: minimist.ParsedArgs;
    private ui: any[] = []; // inquirer.ui.Prompt
    private activePrompt;
    private pauseEvents: Function[] = [];
    public paused: boolean;

    constructor() {
        // Parse arguments
        this.args = minimist(process.argv.slice(2));
        // this.ui = new inquirer.ui.BottomBar();
    }

    /**
     * Checks if a command has been passed or not
     * @param command string name of the command
     */
    hasStartupCommand(command: string): boolean {
        return this.args._.filter(n => n === command).length > 0;
    }

    /**
     * Gets requested argument
     * @param name string name of the argument
     */
    getArgument(name: string, defaultValue: any = null): any {
        let value = null;

        if (name in this.args) {
            value = this.args[name];
        } else if (name[0] in this.args) {
            value = this.args[name[0]];
        }

        return value !== null ? value : defaultValue;
    }

    onPaused(event) {
        this.pauseEvents.push(event);
    }

    /**
     * Clear the terminal
     */
    clear() {
        this.write(chalk.reset("\x1b[2J\x1b[0;0H"));
    }

    /**
     * Write something to terminal
     */
    write(msg: string): boolean {
        return process.stdout.write.bind(process.stdout)(msg);
    }

    log(message: string) {
        // this.ui.updateBottomBar(message);
        console.log(message);
        // this.showPrompt();
    }

    read(question: string, hidden = false): Promise<any> {
        let scheme = ["questions", {
            type: hidden? "password" : "input",
            message: question,
            name: "response",
        }];

        // Bad type definition
        let promise = <any>inquirer.prompt(scheme);
        this.ui.push(promise['ui']);

        return promise.then((answer) => {
            return answer.response;
        });
    }

    closePrompts() {
        this.ui.map((ui) => {
            if (!ui['closed']) {
                ui.close();
                ui['closed'] = true;
                //console.log("closed now")
            } else {
                //console.log("closed Already")
            }
        });
    }

    /**
     * Start printing dots to screen, show script is working
     */
    startProgress() {
        this.pdTime.push(setInterval(() => {
            this.write(chalk.green("."));
        }, 200));
    }

    /**
     * Stop printing dots when process ends
     */
    stopProgress() {
        clearInterval(this.pdTime.pop());
    }

    /**
     * Display the workspace for syncjs
     */
    workspace() {
        // this.clear();

        this.write(`Started monitoring \n`);
        this.write(`Quit the script with CONTROL-C".\n`);
        this.write(chalk.magenta("-----------------------------------------------------------\n"));
        // this.showPrompt();
    }

    usage(message: string = null, code: number = 0): void {
        if (message) {
            this.write(chalk.red(message) + "\n");
        }
        this.write(chalk.yellow.underline("\nUSAGE:\n"));
        this.write("Make sure you have the config file by running.\n");
        this.write(chalk.green("syncjs init\n"));
        this.write("--------------------\n");
        this.write("For more details please visit. https://github.com/serkanyersen/sync\n");
        process.exit(code);
    }

    /**
     * Shorthand command to print help text
     */
    private getHelp(command, text) {
        return `${ chalk.green(command) }: ${text}\n`;
    }

    /**
     * Display the prompt that asks for input
     */
    private showPrompt() {
        if (this.activePrompt) {
            this.closePrompts();
        }

        this.activePrompt = this.read(">>> ");
        this.activePrompt.then(answer => {
            this.handleInput(answer);
            this.activePrompt = false;
            // as soon as a command is run, show promt again just a like a real shell
            this.showPrompt();
        });
    }

    /**
     * Handle given input
     */
    private handleInput(input) {
        input = input.split(" ");
        let cmd = input[0];
        let arg1 = input[1];
        switch (cmd) {
            case "help":
                let helpText = "";
                helpText += this.getHelp("pause", "Stops observing file changes");
                helpText += this.getHelp("resume", "Continue checking files");
                helpText += this.getHelp("resume -u", "Continue checking files and upload all the changed files while paused.");
                helpText += this.getHelp("help", "Displays this text");
                helpText += this.getHelp("clear", "Clears the screen");
                helpText += this.getHelp("exit", "Exits the script");
                this.write(helpText);
                break;
            case "clear":
                this.workspace();
                break;
            case "exit":
                process.exit(EXIT_CODE.NORMAL);
                break;
            case "pause":
                this.paused = true;
                this.pauseEvents.map((ev) => {
                    ev(this.paused);
                });
                this.workspace();
                break;
            case "resume":
                if (this.paused) {
                    if (arg1 != "-u") {
                        this.lastRun = +(new Date());
                        this.timeDiff = 0;
                    }
                    this.paused = false;
                    this.workspace();
                    if (arg1 == "-u") {
                        this.write("Finding all changed files while waiting.\n");
                    }
                    this.pauseEvents.map((ev) => {
                        ev(this.paused);
                    });
                } else {
                    this.write("Already running\n");
                }
                break;
            case "": break;
            default:
                this.write(chalk.red(`Unknown command: ${ cmd }\nType "help" to see commands`));
        }
    }
}

