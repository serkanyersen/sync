var clc = require('cli-color');


write = process.stdout.write.bind(process.stdout);

setInterval(function(){
    write('\u0008');
    write('a');
}, 1000);
