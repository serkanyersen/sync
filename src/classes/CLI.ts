import chalk = require("chalk");
import readline = require("readline");

export default class CLI {

    private rline: readline.ReadLine;
    private pdTime: NodeJS.Timer;
    private lastRun: number;
    private timeDiff: number;

    public paused: boolean;

    constructor() {
        try {
            this.rline = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        } catch (e) {
            this.write("You need to upgrade your nodejs");
            this.write("http://slopjong.de/2012/10/31/how-to-install-the-latest-nodejs-in-ubuntu/");
            process.exit(1);
        }
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
    write(msg: string | Chalk.ChalkChain): boolean {
        return process.stdout.write.bind(process.stdout)(msg);
    }

    /**
     * Start printing dots to screen, show script is working
     */
    startProgress() {
        this.pdTime = setInterval(() => {
            this.write(chalk.green("."));
        }, 200);
    }

    /**
     * Stop printing dots when process ends
     */
    stopProgress() {
        clearInterval(this.pdTime);
    }

    /**
     * Display the workspace for syncjs
     */
    workspace() {
        this.clear();

        if (this.paused) {
            this.write(`Currently paused, type "${ chalk.green("resume") }" to start again.\n`);
        } else {
            this.write(`Started monitoring \n`);
        }

        this.write(`Quit the script with CONTROL-C or type "${ chalk.green("exit") }".\n`);
        this.write(chalk.magenta("-----------------------------------------------------------\n"));
        this.showPrompt();
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
        this.rline.question(">>> ", answer => {
            this.handleInput(answer);
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
                process.exit(0);
                break;
            case "pause":
                this.paused = true;
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
                    // this.startChecking();
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