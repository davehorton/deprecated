var appRemote
,assert = require('assert')
,should = require('should')
,config = require('./fixtures/config')
,appLocal 
,appRemote 
,appRemote2 ;

function cleanup(done) {
    appLocal.disconnect() ;
    appRemote.disconnect() ;
    appRemote2.disconnect() ;
    done() ;        
}

describe.skip('b2bua', function() {

    it('must allow b2bua without use of Request#pipe', function(done) {
        this.timeout(10000) ;
        appLocal = require('../..')() ;
        appRemote = require('../../examples/b2bua/app') ;
        appRemote2 = require('../..')() ;

        appRemote2.connect(config.connect_opts2) ;

        appRemote.on('connect', function(obj) {
            appRemote2.on('connect', function(){
                appRemote2.invite(function(req, res){
                    res.send(200, {body: config.sdp}) ;
                }) ;
                appLocal.connect(config.connect_opts, function(obj){
                    runTest();
                });                       
            }) ;
        }) ;

        function runTest() {
            appLocal.siprequest(config.request_uri, {
                body: config.sdp
            },function( err, req, res ) {
                should.not.exist(err) ;
                res.should.have.property('statusCode',200); 

                setTimeout( function() {
                    appLocal.siprequest.bye({headers:{'call-id': res.get('call-id')}}) ;                       
                }, 100);
            });

            appRemote.on('status', function(status){
                status.success.should.be.ok ;
                cleanup(done);
            }) ;  
        }
    }) ;

   it('must allow b2bua with Request#pipe', function(done) {

        this.timeout(5000) ;

        appLocal = require('../..')() ;
        appRemote = require('../../examples/b2bua-pipe/app') ;
        appRemote2 = require('../..')() ;

        appRemote2.connect(config.connect_opts2) ;

        appRemote.on('connect', function(obj) {
            appRemote2.on('connect', function(){
                appRemote2.invite(function(req, res){
                    res.send(200, {body: config.sdp}) ;
                }) ;
                appLocal.connect(config.connect_opts, function(obj){
                    runTest();
                });                       
            }) ;
        }) ;

        function runTest() {
            appLocal.siprequest(config.request_uri, {
                body: config.sdp
            },function( err, req, res ) {
                should.not.exist(err) ;
                res.should.have.property('statusCode',200); 

                setTimeout( function() {
                    appLocal.siprequest.bye({headers:{'call-id': res.get('call-id')}}) ;                       
                }, 100);
            });

            appRemote.on('status', function(status){
                status.success.should.be.ok ;
                cleanup(done);
            }) ;  
        }
    }) ;

}) ;
