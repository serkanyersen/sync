import { parse } from "jsonplus";
import { readFileSync, existsSync } from "fs";
import { join as pathJoin } from "path";
import CLI, { EXIT_INVALID_ARGUMENT, EXIT_PARSE_ERROR } from "./CLI";

interface SyncConfig {
    "username"?: string;
    "password"?: string;
    "port"?: number;
    "host": string;
    "localPath": string;
    "remotePath": string;
    "privateKey"?: string;
    "ignores"?: Array<string|RegExp>;
    "pathMode": string;
}

const FILE_NAME = "sync-config.json";

export default class Config implements SyncConfig{
    private _filename: string;
    private _config: SyncConfig;

    // properties
    host: string;
    username: string;
    password: string;
    port: number;
    localPath: string;
    remotePath: string;
    privateKey: string;
    ignores: Array<string|RegExp>;
    pathMode: string = "0755";

    constructor(private cli: CLI) {
        this._filename = pathJoin(process.cwd(), this.cli.getArgument("config", FILE_NAME));
        this._fetch();
        this._expand();
    }

    private _fetch() {
        if (existsSync(this._filename)) {
            let configraw;
            if (configraw = readFileSync(this._filename)) {
                try {
                    this._config = parse(configraw.toString());
                } catch(e) {
                    this.cli.usage("Could not parse DB file. Make sure JSON is correct", EXIT_PARSE_ERROR);
                }
            } else {
                this.cli.usage("Cannot read config file. Make sure you have permissions", EXIT_INVALID_ARGUMENT);
            }
        } else {
            this.cli.usage("Config file not found", EXIT_INVALID_ARGUMENT);
        }
    }

    /**
     * @TODO add checks on required values
     */
    private _expand() {
        ["host", "port", "username", "password", "pathMode",
         "localPath", "remotePath", "ignores", "privateKey"].forEach(prop => {
             this[prop] = this._config[prop] || this[prop];
         });
    }
}