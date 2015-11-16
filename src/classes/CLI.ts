import 'colors';
import { sprintf, endsWith } from 'underscore.string';
import readline = require('readline');

export default class CLI {

    private rline: readline.ReadLine;
    private pdTime: NodeJS.Timer;
    private lastRun: number;
    private timeDiff: number;

    public paused: boolean;

    constructor(public secondsInterval: number) {
        try {
            this.rline = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
        } catch (e) {
            this.write('You need to upgrade your nodejs');
            this.write('http://slopjong.de/2012/10/31/how-to-install-the-latest-nodejs-in-ubuntu/');
            process.exit(1);
        }
    }

    write(msg: string): boolean {
        return process.stdout.write.bind(process.stdout)(msg);
    }



    /**
     * Start printing dots to screen, show script is working
     */
    startProgress() {
        this.pdTime = setInterval(() => {
            this.write('.'.yellow);
        }, 200);
    }

    /**
     * Stop printing dots when process ends
     */
    stopProgress() {
        clearInterval(this.pdTime);
    }

    workspace() {
        this.write('\n'.reset);

        if (this.paused) {
            this.write(`Currently paused, type "${ 'resume'.green }" to start again.\n`);
        } else {
            this.write(`Started monitoring, checking every ${ this.secondsInterval } seconds.\n`);
        }

        this.write(`Quit the script with CONTROL-C or type "${ 'exit'.green}".\n`);
        this.write('-----------------------------------------------------------\n'.magenta);
        this.showPrompt();
    }

    private getHelp(command, text) {
        return `${command.green}: ${text}\n`;
    }

    private showPrompt() {
        this.rline.question(">>> ", answer => {
            this.handleInput(answer);
            // as soon as a command is run, show promt again just a like a real shell
            this.showPrompt();
        });
    }

    private handleInput(input) {
        input = input.split(' ');
        let cmd = input[0];
        let arg1 = input[1];
        switch (cmd) {
            case "help":
                let helpText = "";
                helpText += this.getHelp('pause', "Stops observing file changes");
                helpText += this.getHelp('resume', "Continue checking files");
                helpText += this.getHelp('resume -u', "Continue checking files and upload all the changed files while paused.");
                helpText += this.getHelp('interval [s]', 'Sets the check interval duration. Example: "interval 2.5" check for every 2.5 seconds');
                helpText += this.getHelp('help', "Displays this text");
                helpText += this.getHelp('clear', "Clears the screen");
                helpText += this.getHelp('exit', "Exits the script");
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
                        this.write('Finding all changed files while waiting.\n');
                    }
                    // this.startChecking();
                } else {
                    this.write('Already running\n');
                }
                break;
            case "interval":
                if (arg1) {
                    this.secondsInterval = parseFloat(arg1) || this.secondsInterval;
                    this.workspace();
                }
                this.write(`Check interval is ${ this.secondsInterval } Seconds\n`);
                break;
            case "": break;
            default:
                this.write(`Unknown command: ${ cmd }\nType "help" to see commands`.red);
        }
    }
}