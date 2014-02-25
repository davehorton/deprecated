var msml = require('..')
,drachtio = require('drachtio')
,app = drachtio()
,msmlApp = msml(app)
,RedisStore = require('drachtio-redis')(drachtio) 
,store = new RedisStore({host: 'localhost', prefix:''})
,config = require('./test-config')
,debug = require('debug')('drachtio:msml-basic-play') ;

app.use( drachtio.session({store: store}) ) ;
app.use( drachtio.dialog() ) ;
app.use( msml.msmlparser() ) ;
app.use( 'info', msml.router ) ;
app.use( app.router ) ;

app.connect( config ) ;

app.invite(function(req, res) {

	msmlApp.makeControlChannel('209.251.49.158', {
		session: req.session
	}, function(err, channel){
		if( err ) throw err ;
		debug('created control channel (callback) ', channel) ;
		channel.user = 'daveh' ;
	}) ;
}) ;

app.on('sipdialog:create', function(e) {
	debug('sip dialog created');
	var dialog = e.target ;
	var session = e.session ;

}) ;

app.on('sipdialog:terminate', function(e) {
	debug('sip dialog terminated');
	var dialog = e.target ;
	var session = e.session ;

	var conn = session.connection ;
	conn.terminate() ;
}) ;

app.on('msml:channel:create', function(e) {
	debug('control channel created') ;
	debug('session: ', e.session) ;
	debug('channel: ', e.target) ;
}) ;

app.on('msml:channel:terminate', function(e) {
	debug('control channel terminated') ;
	debug('session: ', e.session) ;
	debug('channel: ', e.target) ;
}) ;
