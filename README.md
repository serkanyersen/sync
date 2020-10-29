[![Known Vulnerabilities](https://snyk.io/test/github/serkanyersen/sync/badge.svg)](https://snyk.io/test/github/serkanyersen/sync)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fserkanyersen%2Fsync.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fserkanyersen%2Fsync?ref=badge_shield)


(this is a fork from serkanyersen/sync)

Syncjs - Upload changed local files to remote server
----------------------------------------------------
Syncjs is an easy to use command line tool for uploading your local changes to a remote server.

It's useful in situations where your application needs to be on a remote server to run (dev machines, pubdev environments, etc.) but you still want to use your local environment for development. You can simply map you local copy of the project to the remote version and syncjs will do the rest.

![Syncjs in use](http://i.imgur.com/rLNUErv.gif, "syncjs")

This example shows usage with Visual Studio Code but since it's an external script, you can use it with any editor you want.

![Vim Example](http://i.imgur.com/drnEET1.gif, "syncjs")

Features
--------
 - Easy to setup
 - Fast and reliable
 - Runs independently from your toolchain so you can use it with anything
 - Runs on windows, osx and linux
 - detects and handles changes on folders
 - can run multiple instances at the same time


Installation
------------

Syncjs is easy to install, just execute the following

```
npm install -g Taigistal/sync
```

After this you'll have `syncjs` binary available to you.

Configuration
-------------

Syncjs comes with an init script and sets itself up for you. All you need to do is to `cd` into your projects directory and  run `syncjs init` it will ask few simple questions and create the config file called `sync-config.json` make sure you include this file in your `.gitignore` because this file might contain passwords or secrets depending on your preferences.

```
cd /my/project/folder
syncjs init
```
![Configuration](http://i.imgur.com/3VnNDc5.gif, "syncjs init")


### Questions on config
 - **Username**: your username that you use to connect to remote machine
 - **Auth method**:
    - **Password in config**: This the least secure version of auth. It will keep your password in the config file **as plain text** do not use this please
    - **Ask during connect**: This option will ask your password again every time you start `syncjs` your password will not be stored anywhere.
    - **Private Key**: Most secure option, just provide the path for your key file and syncjs will do the rest

 - **Hostname or IP of the server**: Tell syncjs where to connect
 - **Port to connect**: defaults to `22` this usually is what you want
 - **Local path**: syncjs will automatically detect this as the root of your project, but if you only want to sync one specific folder, **provide it here as full path**
 - **Remote path**: This is where copy of your local folder lives in the remote server. Make sure you type full path here as well.
[11:37] Silas Köhler
- **ignores**: An array of strings for files you want to ignore. You can can define strings for absolute paths or regular expression. Default ignores: /node_modules/, /.git/, /.svn/, /bower_components/, /sync-config.json/


License
-------
MIT


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fserkanyersen%2Fsync.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fserkanyersen%2Fsync?ref=badge_large)
