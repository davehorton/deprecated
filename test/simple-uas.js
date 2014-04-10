var appRemote
,assert = require('assert')
,should = require('should')
,config = require('./fixtures/config')
,appLocal
,appRemote ;

describe('dialog basics', function() {

    it('uas / far end release', function(done) {

        appRemote = require('../examples/simple-uas/app') ;
        appRemote.on('connect', function() {
            appLocal = require('drachtio')() ;
            appLocal.connect(config.connect_opts, function(err){
                
                appLocal.siprequest(config.request_uri, {
                    body: config.sdp
                }, function( err, req, res ) {
                    res.ack() ;

                    should.not.exist(err) ;
                    res.should.have.property('statusCode',200); 

                    setTimeout( function() {
                        appLocal.siprequest.bye({headers:{'call-id': res.get('call-id')}}) ;                       
                    }, 100);
                }) ;   
            }) ;
        }) ;

        appRemote.on('session', function(sess){
            sess.should.have.property('user','jack jones') ;
 
            setTimeout(function(){
                appLocal.disconnect() ;
                appRemote.disconnect() ;

                done() ;
               
            }, 25);
         }) ;               
    }) ;

    it('uas / near end release', function(done) {

        appRemote = require('../examples/simple-uas/app2') ;
        appRemote.on('connect', function() {
            appLocal = require('drachtio')() ;
            appLocal.connect(config.connect_opts, function(err){
                
                appLocal.siprequest(config.request_uri, {
                    body: config.sdp
                }, function( err, req, res ) {
                    res.ack() ;

                    should.not.exist(err) ;
                    res.should.have.property('statusCode',200); 
                }) ;   
            }) ;
        }) ;

        appRemote.on('session', function(sess){
            sess.should.have.property('user','jack jones') ;
 
            setTimeout(function(){
                appLocal.disconnect() ;
                appRemote.disconnect() ;

                done() ;
               
            }, 25);
         }) ;               
    }) ;

}) ;
