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

	msml.makeConnection('192.168.173.139', {
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
	setTimeout( function(){
		debug('time to tear down call') ;
		e.target.terminate() ;
		e.session.connection.terminate() ;
	}, 3000) ;
}) ;
