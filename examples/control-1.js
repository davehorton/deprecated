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
		debug('created control channel (callback) ') ;
		channel.session.user = 'daveh' ;

		setTimeout( function() {
			channel.terminate() ;
			res.send(500) ;
		}, 2000) ;
	}) ;
}) ;

app.on('msml:channel:create', function(e) {
	debug('created control channel (event)') ;
	debug('session: ', e.session) ;
}) ;

app.on('msml:channel:terminate', function(e) {
	debug('control channel terminated') ;
	debug('session: ', e.session) ;
	debug('channel: ', e.target) ;
}) ;
