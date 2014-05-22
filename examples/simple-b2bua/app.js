var drachtio = require('drachtio')
,session = require('../..')
,config = require('../fixtures/config') 
,assert = require('assert')
,debug = require('debug')('simple-b2bua');

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

app.use(session({app:app})) ;

app.invite( function(req, res) {
    debug('got invite, req.session: ') ;
	req.session.uasCallId = req.get('call-id') ;
    debug('set session data')

	app.siprequest( config.remote_uri2, {
		body: req.body
		,session: req.session
	}, function( err, uacReq, uacRes ) {
        if( uacRes.statusCode >= 200 ) {
            uacRes.ack() ;
                       
            uacReq.session.uacCallId = uacReq.get('call-id') ;
         }
         debug('sending response')
        res.send( uacRes.statusCode, {
            body: uacRes.body
        }) ;
	}) ;
}) ;

app.bye(function(req, res){
    res.send(200) ;
    debug('session in app.bye: ', req.session)

    //for test harness in test/acceptance/simple-b2bua.js
    app.emit('session', req.session) ;
 }) ;





