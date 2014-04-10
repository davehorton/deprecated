var appRemote
,assert = require('assert')
,should = require('should')
,config = require('./fixtures/config')
,async = require('async')
,appLocal
,appRemote
,siprequest ;

describe('uas', function() {
    this.timeout(2000) ;
    before(function(done){
       appRemote = require('../examples/simple-uas/app') ;
        appRemote.on('connect', function() {
            appLocal = require('drachtio')() ;
            appLocal.connect(config.connect_opts, function(err){
                done() ;
            });        
        }) ;
    }) ;
    after(function(done){
        appLocal.disconnect() ;
        appRemote.disconnect() ;
        done() ;
    }) ;

    it('must add req.session to an incoming request', function(done) {
        this.timeout(5000) ;

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

        appRemote.on('session', function(sess){
            sess.should.have.property('user','jack jones') ;
            done() ;
        }) ;               
    }) ;
}) ;
