var spawn = require('child_process').spawn
,exec = require('child_process').exec
,localServer
,remoteServer
,remoteServer2 ;

before( function(done){
    exec('pkill drachtio', function () {
        localServer = spawn('drachtio',['-f','./fixtures/drachtio.conf.local.xml'],{cwd: process.cwd() + '/test'}) ;
        remoteServer = spawn('drachtio',['-f','./fixtures/drachtio.conf.remote.xml'],{cwd: process.cwd() + '/test'}) ;
        remoteServer2 = spawn('drachtio',['-f','./fixtures/drachtio.conf.remote2.xml'],{cwd: process.cwd() + '/test'}) ;
        done() ;
     }) ;
}) ;

after( function(done) {
    setTimeout( function() {
        localServer.kill() ;
        remoteServer.kill() ;
        remoteServer2.kill() ;
        done() ;
    }, 1000 ) ;
}) ;

