var msml = require('..')
,drachtio = require('drachtio')
,app = drachtio()
,msmlApp = msml(app)
,RedisStore = require('drachtio-redis')(drachtio) 
,store = new RedisStore({host: 'localhost', prefix:''})
,config = require('./test-config')
,debug = require('debug')('drachtio:msml-example') ;

app.use( drachtio.session({store: store}) ) ;
app.use( drachtio.dialog() ) ;
app.use( msml.msmlparser() ) ;
app.use( 'info', msml.router ) ;
app.use( app.router ) ;

app.connect( config ) ;

app.once('connect', function() {
	msmlApp.makeControlChannel('209.251.49.158', function(err, channel){
		debug('made control channel: ', channel) ;

		channel.makeConference( {
			deletewhen: 'nocontrol'
			,audiomix: {
				id: 1
				,samplerate: 8000
				,'n-loudest': {
					n: 3
				}
			}
		}, function(err, conference){
			if( err ) throw err ;
			debug('made conference: ', conference) ;
			conference.session.channel = channel ;
		}) ;
	}) ;	
}) ;

app.on('msml:channel:create', function(e){
	debug('control channel created') ;
	e.session.user = 'daveh'
})
.on('msml:channel:terminate', function(e){
	debug('control channel terminated, user: ', e.session.user) ;
})
.on('msml:conference:create', function(e) {
	debug('conference created, user: ', e.session.user) ;
	var conference = e.target
	,channel = e.session.channel ;

	setTimeout( function() {
		debug('terminating conference') ;
		conference.terminate( function() {
			debug('terminating control channel') ;
			channel.terminate( function() {
				app.disconnect() ;			
			}) ;	
		}) ;
	}, 2000) ;

})
.on('msml:conference:terminate', function(e){
	debug('conference terminated, user: ', e.session.user) ;
	e.session.user = 'bill' ;
})

