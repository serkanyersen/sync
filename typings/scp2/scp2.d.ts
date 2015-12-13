
declare module "scp2" {

    interface ScpOptions {
        port?: number;
        host?: string;
        username?: string;
        password?: string;
        paths?: string;
        privateKey?: string;
        debug?: boolean;
    }

    interface attrs {
        size?: number;
        uid?: number;
        gid?: number;
        mode?: number | string;
        atime?: number;
        mtime?: number;
    }

    interface writeOptions {
        destination: string;
        content?: string;
        attrs?: attrs;
        source?: string;
    }

    export class Client {
        constructor(options: ScpOptions);
        sftp(callback: (err: string, sftp: any) => void);
        close(): void;
        mkdir(dir: string, attrs: attrs, callback: (err: string) => void);
        mkdir(dir: string, callback: (err: string) => void);
        write(options: writeOptions, callback: (err: string) => void);
        upload(src: string, destination: string, callback: (err: string) => void);
        download(src: string, destination: string, callback: (err: string) => void);
        on(eventName: string, callback: () => void);
    }

    export interface client {
        defaults(options: ScpOptions);
        scp(fileName: string, options: ScpOptions | string, errCallback?: (err: string) => void);
        scp(fileName: string, options: ScpOptions | string, glob: string, errCallback?: (err: string) => void);
        Client: Client;
    }
}