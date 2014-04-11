var drachtio = require('drachtio')
,session = require('drachtio-session')
,dialog = require('../..')
,RedisStore = require('drachtio-redis')() 
,assert = require('assert')
,config = require('../fixtures/config')
,debug = require('debug')('drachtio:dialog-b2bua') ;

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

var sessionStore = new RedisStore({host: 'localhost'}) ;

app.use(session({store: sessionStore, app:app})) ;
app.use(dialog()) ;

app.invite( function(req, res) {
	app.siprequest( config.remote_uri2, {
		body: req.body
		,session: req.session
	})
	.pipe( res ) ;
}) ;

app.on('sipdialog:create', function(e){
	var dialog = e.target ;
	debug('dialog created with role: %s', dialog.role) ;
	e.session[dialog.role] = dialog ;
	e.session.save() ;
})
.on('sipdialog:terminate', function(e){
	var dialog = e.target ;
	debug('sip dialog %s terminated for reason: %s', dialog.role, e.reason) ;
	var other = e.session[ 'uac' === dialog.role ? 'uas' : 'uac'] ;
	debug('going to terminate the other dialog with app: ', other.app) ;
	other.terminate(function(err, req, res) {
		e.session.status = 200 === res.statusCode ? 'ok' : 'not ok' ;
		app.emit('session', e.session) ;
	}) ;
}) ;

