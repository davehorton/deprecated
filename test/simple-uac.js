var appRemote
,assert = require('assert')
,should = require('should')
,config = require('./fixtures/config')
,async = require('async')
,appLocal
,appRemote
,localAddress ;

describe('uac', function() {
    before(function(done){
        appLocal = require('drachtio')() ;
        appLocal.connect(config.connect_opts, function(obj){
            done() ;
        });        
    }) ;
    after(function(done){
        appLocal.disconnect() ;
        appRemote.disconnect() ;
        done() ;
    }) ;

    it('must add req.session to an outgoing request', function(done) {

        appLocal.invite(function(req, res){
            res.send(200) ;

            setTimeout( function() {
                appLocal.siprequest.bye({headers:{'call-id': req.get('call-id')}}) ;                       
            }, 100);
        }) ;

        appRemote = require('../examples/simple-uac/app') ;
        appRemote.on('session', function(sess){
            sess.should.have.property('user','jack jones') ;
            done() ;
        })
    }) ;
}) ;
