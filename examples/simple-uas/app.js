var drachtio = require('drachtio')
,session = require('drachtio-session')
,dialog = require('../..')
,RedisStore = require('drachtio-redis')() 
,assert = require('assert')
,config = require('../fixtures/config')
,debug = require('debug')('drachtio:dialog-simple-uas') ;

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

var sessionStore = new RedisStore({host: 'localhost'}) ;

app.use(session({store: sessionStore, app:app})) ;
app.use(dialog()) ;

app.invite(function(req, res){
    req.session.user='jack jones' ;
	res.send( 200,{
		body: config.sdp
	}) ;
}) ;

app.on('sipdialog:terminate', function(e){
	debug('sip dialog terminated for reason: %s', e.reason) ;

	app.emit('session', e.session) ;
}) ;

