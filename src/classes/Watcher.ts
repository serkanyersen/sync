import chokidar = require('chokidar');


export default class Watcher {
    files: chokidar.FSWatcher;

    constructor(
        private base: string = process.cwd(),
        private ignores = [],
        private noDefaultIgnores = false) {

        this.files = chokidar.watch(base, {
            ignored: [/node_modules/, /.git/, /.svn/, /bower_components/].concat(this.ignores),
            ignoreInitial: true
        });

        // Attach events
        ['all', 'add', 'change', 'unlink', 'addDir', 'unlinkDir'].forEach(method => {
            this.files.on(method, this[method]);
        });
    }

    all = (event:string, path:string) => {
        console.log(event, path);
    }

    add = (path: string) => {

    }

    change = (path: string) => {
       // console.log(`file changed ${path}`);
    }

    unlink = (path: string) => {

    }

    addDir = (path: string) => {

    }

    unlinkDir = (path: string) => {

    }
}
