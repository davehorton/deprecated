var spawn = require('child_process').spawn
,exec = require('child_process').exec
,localServer
,remoteServer ;

before( function(done){
    exec('pkill drachtio', function () {
        localServer = spawn('drachtio',['-f','./fixtures/drachtio.conf.local.xml'],{cwd: process.cwd() + '/test'}) ;
        remoteServer = spawn('drachtio',['-f','./fixtures/drachtio.conf.remote.xml'],{cwd: process.cwd() + '/test'}) ;
        done() ;
     }) ;
}) ;

after( function(done) {
    this.timeout(35000) ;
    setTimeout( function() {
        localServer.kill() ;
        remoteServer.kill() ;
        done() ;
    }, 250) ;
}) ;

