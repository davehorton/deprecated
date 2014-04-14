var drachtio = require('drachtio')
,session = require('drachtio-session')
,dialog = require('../..')
,assert = require('assert')
,config = require('../fixtures/config')
,debug = require('debug')('drachtio:dialog-simple-uas') ;

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

app.use(session({app:app})) ;
app.use(dialog()) ;

app.invite(function(req, res){
    req.session.user='jack jones' ;
	res.send( 200,{
		body: config.sdp
	}) ;
}) ;

app.on('sipdialog:create', function(e){
	var dialog = e.target ;
	debug('dialog created: ', dialog) ;
	setTimeout(function() {
		e.target.terminate() ;
	}, 50) ;
})
.on('sipdialog:terminate', function(e){
	debug('sip dialog terminated for reason: %s', e.reason) ;

	app.emit('session', e.session) ;
}) ;

