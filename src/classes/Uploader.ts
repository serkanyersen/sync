import { Client } from "scp2";
import Config from "./Config";
import upath = require("upath");

export default class Uploader {
    client: Client;

    constructor(private config: Config) {}

    connect(): Promise<string> {

        this.client = new Client({
            port: this.config.port,
            host: this.config.host,
            username: this.config.username,
            password: this.config.password,
            privateKey: require("fs").readFileSync(this.config.privateKey),
            debug: true
        });

        this.client.sftp((err, sftp) => {
            if (err) {
                console.log("There was a problem with connection");
            }
        });

        return new Promise<string>((resolve, reject) => {
            this.client.on("ready", () => {
                resolve("connected");
            });
        });
    }


    getRemotePath(path: string): string {
        let normalPath = upath.normalizeSafe(path);
        let normalLocalPath = upath.normalizeSafe(this.config.localPath);
        let remotePath = normalPath.replace(normalLocalPath, this.config.remotePath);
        return upath.normalizeSafe(remotePath);
    }

    uploadFile(fileName: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let remote = this.getRemotePath(fileName);

            // Client upload also creates the folder but creates it using local mode
            // in windows it might mean we won't have permissons to save the fileName
            // So I create the folder manually here to solve that issue.
            // Mode we set can be configured from the config file
            this.client.mkdir(upath.dirname(remote), {mode: this.config.pathMode}, err => {
                if(err) {
                    reject({
                        message: `Could not create ${ upath.dirname(remote) }`,
                        error: err
                    });
                } else {
                    // Uplad the file
                    this.client.upload(fileName, remote, err => {
                        if (err) {
                            reject({
                                message: `Could not upload ${ remote }`,
                                error: err
                            });
                        } else {
                            resolve(remote);
                        }
                    });
                }
            });
        });
    }
}
