import SyncError from "./SyncError";
import Config from "./Config";
import CLI from "./CLI";
import Watcher from "./Watcher";
import Uploader from "./Uploader";

export default class Sync {
    config: Config;
    watch: Watcher;
    cli: CLI;
    uploader: Uploader;

    constructor() {
        // Get config
        this.config = new Config();

        // Get Command line interface
        this.cli = new CLI();
        this.cli.write("Connecting");
        this.cli.startProgress();

        // Setup the uploader
        this.uploader = new Uploader(this.config);

        // Initiate file watch
        this.watch = new Watcher(this.uploader, this.config);

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