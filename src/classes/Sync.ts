import Config from "./Config";
import CLI from "./CLI";
import Watcher from "./Watcher";
import Uploader from "./Uploader";
import InitConfig from './InitConfig';

export default class Sync {
    config: Config;
    watch: Watcher;
    cli: CLI;
    uploader: Uploader;

    constructor() {
        this.cli = new CLI();

        if (this.cli.hasStartupCommand("init")) {
            new InitConfig(this.cli);
        } else {
            // Get config
            this.config = new Config(this.cli);

            // Get Command line interface
            this.cli.write("Connecting");
            this.cli.startProgress();

            // Setup the uploader
            this.uploader = new Uploader(this.config, this.cli);

            // Initiate file watch
            this.watch = new Watcher(this.uploader, this.config, this.cli);

            // When files are found start connection
            this.watch.ready().then(() => {
                return this.uploader.connect();
            }).then(() => {
                // All done, stop indicator and show workspace
                this.cli.stopProgress();
                this.cli.workspace();
            });
        }
    }
}