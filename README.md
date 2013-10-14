## Sync.js - Upload changed local files to remote server
sync.js let's you keep your remote files in sync with your local copy. Whenever you make a change on your local project, sync.js uploads the changed files to remote server using `scp` command.

When configured correctly, it works really fast because sync.js leverages [openSSH master connection settings](http://protempore.net/~calvins/howto/ssh-connection-sharing/). That means instead of creating new connections for each upload, sync.js keeps one connection open and uses it for all uploads.

### Why did I do this? Aren't there already tools doing the same exact thing?
Yes there are. However, none of them fulfills my needs. I use Sublime Text 2 and occasionally VIM. ST2 has `SFTP` plugin 
~~but it doesn't have ST3 support yet~~, also it doesn't upload files when they changed via other editors.

I tried `unison` but it kills the CPU and syncs remote to local too. Configuration was too complex and it was not really customizable. As soon as I started `unison` it filled my computer with all the compressed scripts and tmp files from the server.

Other options were mostly either not working or doing so many other things that I don't need. I only want to upload files to remote server when they are changed. That's it. 

### Features

- Fast and reliable change detection
- Very light weight, doesn't use excessive CPU power
- Internal command line to control the script while it's working
- Doesn't depend on any editor, so you can use it with any application
- It's very simplistic and customizable, you can alter the script however you like
- Colorful and interactive output.
- And many more

### Installation 
Just clone this repository `anywhere` on your computer

```
git clone git@github.com:serkanyersen/sync.git
```
Go inside `sync	` folder and install dependencies

```
cd sync
npm install
```
Create a config file using the example file

```
cp config_example.json config.json
```
The config file is very self explanatory, just open it and add your own information

```json
{
    "host": "username@ssh.yourhost.com",
    "interval_duration": 1.5,
    "local_path": "/path/to/local/folder",
    "remote_path": "/path/to/remote/folder"
}
```
To leverage the openSSH master connection feature, just open `~/.ssh/config` file
and put the following in it (unless you don't have it already):

```
Host *
    ControlMaster auto
    ControlPath ~/.ssh/master-%r@%h:%p
```
Now you are ready to go, start the script by calling sync.js with either `./sync.js` or `nodejs sync.js`

That's it.

### Bonus
If you are on OSX and using `iTerm` or any other terminal other than the default `Terminal.app`, you can install [TotalTerminal](http://totalterminal.binaryage.com/) formerly known as `Visor` and start `sync.js` from it. And if you add this line to `config.json`

```
"visorSupport": true
```
sync.js will pop visor terminal on the screen for a second and hide it again, so that you'll understand script is currently uploading your change.

It works better when you place the visor at the bottom of the screen and reduce the row count.



## License
MIT, Go Crazy

