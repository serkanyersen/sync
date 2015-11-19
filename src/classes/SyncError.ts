export default class SyncError {
    constructor(public message: string) {
        this.show();
    }

    show() {
        console.error(this.message);
    }
}

