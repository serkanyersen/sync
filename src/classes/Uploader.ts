import { Client } from "scp2";
import Config from "./Config";

export default class Uploader {
    constructor(private config: Config) {}

    connect(): Promise<string> {

        let client = new Client({
            port: this.config.port,
            host: this.config.host,
            username: this.config.username,
            password: this.config.password,
            privateKey: require("fs").readFileSync(this.config.privateKey),
            debug: true
        });
        client.sftp((err, sftp) => {
            if (err) {
                console.log("There was a problem with connection");
            }
        });

        return new Promise<string>((resolve, reject) => {
            client.on("ready", () => {
                resolve("connected");
            });
        });
    }

    uploadFile(fileName: string) {
        let remote:string;

        remote = fileName.replace(this.config.localPath, this.config.remotePath);

        console.log(`local ${fileName} => remote ${remote}`);

    }
}
