var appRemote
,assert = require('assert')
,should = require('should')
,config = require('./fixtures/config')
,async = require('async')
,appLocal
,appRemote
,siprequest ;

describe('session tests', function() {
    this.timeout(4000) ;
    before(function(done){
       appRemote = require('../examples/simple-uas/app') ;
        appRemote.on('connect', function() {
            appLocal = require('drachtio')() ;
            siprequest = appLocal.uac ;

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
        async.parallel([
            function local( callback ){ 
                siprequest(config.request_uri, {
                    body: config.sdp
                }, function( err, req, res ) {
                    res.ack() ;

                    should.not.exist(err) ;
                    res.should.have.property('statusCode',200); 

                    setTimeout( function() {
                        siprequest.bye({headers:{'call-id': res.get('call-id')}}, function() {
                            callback() ;
                        }) ;                       
                    }, 100);
                }) ;                  
             }
            ,function remote( callback ) {
                appRemote.bye(function(req, res){
                    res.send(200) ;
                    req.session.should.have.property('user','jack jones') ;
                    callback();
                }) ;
            }
            ]
            ,function() {
                appLocal.idle.should.be.true ;
                appRemote.idle.should.be.true ;
                done() ;   
            }
        ) ;
    }) ;
}) ;
