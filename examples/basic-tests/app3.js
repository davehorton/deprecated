var drachtio = require('drachtio')
,session = require('drachtio-session')
,dialog = require('../..')
,assert = require('assert')
,config = require('../fixtures/config')
,SipDialog = require('../../lib/dialog')
,debug = require('debug')('drachtio:dialog-b2bua') ;

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

app.use(session({app:app})) ;
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
	debug('dialog created with role: %s, ', dialog.role, dialog) ;
	e.session[dialog.role] = dialog ;
	e.session.save() ;
})
.on('sipdialog:terminate', function(e){
	var dialog = e.target ;
	debug('sip dialog %s terminated for reason: %s', dialog.role, e.reason) ;
	var other = e.session[ 'uac' === dialog.role ? 'uas' : 'uac'] ;
	debug('going to terminate the other dialog: ', other) ;

	other.terminate(function(err, req, res) {
		e.session.status = 200 === res.statusCode ? 'ok' : 'not ok' ;
		app.emit('session', e.session) ;
	}) ;
}) ;

