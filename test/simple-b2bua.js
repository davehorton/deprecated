var appRemote
,assert = require('assert')
,should = require('should')
,config = require('./fixtures/config')
,async = require('async')
,appLocal 
,appRemote 
,appRemote2 
,localAddress ;

//simple uas on the other side of the b2bua

describe('b2bua', function() {
    this.timeout( 5000 ) ;
    before(function(done){
        appLocal = require('drachtio')() ;
        appRemote = require('../examples/simple-b2bua/app') ;
        appRemote2 = require('drachtio')() ;

        appRemote2.connect(config.connect_opts2) ;

        appRemote.on('connect', function(obj) {
            appRemote2.on('connect', function(){
                appRemote2.invite(function(req, res){
                    res.send(200, {body: config.sdp}) ;
                }) ;

                appLocal.connect(config.connect_opts, function(obj){
                    done() ;
                });                       
            }) ;
        }) ;
    }) ;
    after(function(done){
        appLocal.disconnect() ;
        appRemote.disconnect() ;
        appRemote2.disconnect() ;
        done() ;
    }) ;

    it('must allow one session for multiple sip dialogs', function(done) {
        appLocal.siprequest(config.request_uri, {
                body: config.sdp
            },function( err, req, res ) {
                should.not.exist(err) ;
                res.should.have.property('statusCode',200); 

                setTimeout( function() {
                    appLocal.siprequest.bye({headers:{'call-id': res.get('call-id')}}) ;                       
                }, 500);
            }
        );
        
        appRemote.on('session', function(sess){
            sess.should.have.property.uasCallId ;
            sess.should.have.property.uacCallId ;
            done() ;
        }) ;
    }) ;
}) ;
