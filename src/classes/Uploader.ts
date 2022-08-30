import * as upath from "upath";
import { readFileSync } from "fs";
import { Client, ScpClient } from "node-scp";
import Config from "./Config";
import CLI from "./CLI";

export default class Uploader {
    client: ScpClient;

    constructor(private config: Config, private cli: CLI) { }

    connect(): Promise<string> {
        let self = this;
        return Client({
            port: this.config.port,
            host: this.config.host,
            username: this.config.username,
            password: this.config.password,
            // agentForward: true,
            privateKey: this.config.privateKey ? readFileSync(this.config.privateKey).toString() : undefined,
            // debug: true
        }).then(function (clt) {
            self.client = clt;
            return new Promise<string>((resolve, reject) => {
                //     self.client.on("ready", () => {
                //     });
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

    unlinkFile(fileName: string): Promise<string> {
        let self = this;
        return new Promise<string>((resolve, reject) => {
            let remote = this.getRemotePath(fileName);

            self.client.unlink(remote).then(function () {
                resolve(remote);
            }).catch(function () {
                reject('SFTP cannot be created');
            });
        });
    }

    unlinkFolder(folderPath: string): Promise<string> {
        let self = this;
        return new Promise<string>((resolve, reject) => {
            let remote = self.getRemotePath(folderPath);
            self.client.unlink(remote).then(function () {
                resolve(remote);
            }).catch(function () {
                reject('SFTP cannot be created');
            });
        });
    }

    uploadFile(fileName: string): Promise<string> {
        let self = this;
        return new Promise<string>((resolve, reject) => {
            let remote = this.getRemotePath(fileName);

            // Client upload also creates the folder but creates it using local mode
            // in windows it might mean we won't have permissons to save the fileName
            // So I create the folder manually here to solve that issue.
            // Mode we set can be configured from the config file
            self.client.uploadFile(fileName, remote).then(function () {
                resolve(remote);
            }).catch(function (err) {
                reject({
                    message: `Could not upload ${remote}`,
                    error: err
                });
            });
        });
    }
}
