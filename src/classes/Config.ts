import { parse } from 'jsonplus';
import { readFileSync, existsSync } from 'fs';
import { join as pathJoin } from 'path';

interface SyncConfig {
    "host": string;
    "intervalDuration": number;
    "localPath": string;
    "remotePath": string;
}

const FILE_NAME = 'config_example.json';

export default class Config implements SyncConfig{
    private _filename: string;
    private _config: SyncConfig;

    // properties
    host: string;
    intervalDuration: number;
    localPath: string;
    remotePath: string;

    constructor() {
        this._filename = pathJoin(process.cwd(), FILE_NAME);
        this._fetch();
        this._expand();
    }

    /**
     * @TODO fail when file is not found
     * @TODO fail when file cannot be parsed
     */
    private _fetch() {
        if (existsSync(this._filename)) {
            let configraw;
            if (configraw = readFileSync(this._filename)) {
                this._config = parse(configraw.toString());
            }
        }
    }

    /**
     * @TODO add checks on required values
     * @TODO add defaults for optional values
     */
    private _expand() {
        this.host = this._config.host;
        this.intervalDuration = this._config.intervalDuration;
        this.localPath = this._config.localPath;
        this.remotePath = this._config.remotePath;
    }
}