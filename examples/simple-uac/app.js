var drachtio = require('drachtio')
,session = require('../..')
,config = require('../fixtures/config') 
,assert = require('assert')
,debug = require('debug')('simple-uac');

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

app.use(session({app:app})) ;

app.on('connect', function() {
	app.siprequest( config.remote_uri, {
		body: config.sdp
	}, function(err, req, res){
		assert(!err) ;
		if( res.statusCode === 200 ) req.session.user = 'jack jones' ;
		if( res.statusCode >= 200 ) res.ack() ;
	}) ;
}) ;

app.bye(function(req, res){
    res.send(200) ;

    assert(req.session.user === 'jack jones') ;

    //for test harness in test/acceptance/simple-uac.js
    app.emit('session', req.session) ;
 }) ;





