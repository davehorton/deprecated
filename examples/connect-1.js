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

	msmlApp.makeConnection('209.251.49.158', {
		remote: {
			sdp: req.body
			,'content-type': req.get('content-type')
		}
	})
	.pipe( res, function( err, conn ){
		if( err ) throw err ;

		debug('established connection ', conn) ;

		req.session.connection = conn ;
	}) ;
}) ;

app.on('sipdialog:create', function(e) {
	debug('sip dialog created, role: ', e.target.role);
}) ;

app.on('sipdialog:terminate', function(e) {
	debug('sip dialog terminated, role: ', e.target.role);
	debug('session: ', e.session) ;

	var conn = e.session.connection ;
	conn.terminate() ;
}) ;
