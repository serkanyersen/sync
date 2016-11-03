import Config from "./Config";
import CLI from "./CLI";
import Watcher from "./Watcher";
import Uploader from "./Uploader";
import InitConfig from './InitConfig';
const observatory = require("observatory");

export default class Sync {
    config: Config;
    watch: Watcher;
    cli: CLI;
    uploader: Uploader;
    task: any;

    constructor() {
        this.cli = new CLI();

        this.task = observatory.add("Initializing...");

        if (this.cli.hasStartupCommand("init")) {
            new InitConfig();
        } else {
            // Get config
            this.config = new Config(this.cli);
            this.task.status("reading config");

            this.config.ready().then(() => {
                // Get Command line interface
                //this.cli.write("Connecting");
                //this.cli.startProgress();
                this.task.status("watching files");

                // Setup the uploader
                this.uploader = new Uploader(this.config, this.cli);

                // Initiate file watch
                this.watch = new Watcher(this.uploader, this.config, this.cli);

                // When files are found start connection

                return this.watch.ready();
            }).then(() => {
                this.task.status("connecting server");
                return this.uploader.connect();
            }).then(() => {
                // All done, stop indicator and show workspace
                // this.cli.stopProgress();
                this.task.done("Connected").details(this.config.host);
                this.cli.workspace();
            });
        }
    }
}