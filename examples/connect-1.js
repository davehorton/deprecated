var msml = require('..')
,drachtio = require('drachtio')
,app = drachtio()
,msmlApp = msml(app)
,RedisStore = require('drachtio-redis')(drachtio) 
,store = new RedisStore({host: 'localhost', prefix:''})
,config = require('./test-config')
,transform = require('sdp-transform')
,debug = require('debug')('drachtio:msml-basic-play') ;

app.use( drachtio.session({store: store}) ) ;
app.use( drachtio.dialog() ) ;
app.use( msml.msmlparser() ) ;
app.use( 'info', msml.router ) ;
app.use( app.router ) ;

app.connect( config ) ;

app.invite(function(req, res) {

	debug('body is ', req.body) ;
	var parser = new transform.Parser({ lineDelimiter: '\n'}) ;
	var sdp = parser.parse(req.body) ;
	debug('sdp: ', sdp) ;

	msmlApp.makeConnection('209.251.49.158', {
		remote: {
			sdp: req.body
			,'content-type': req.get('content-type')
		}
		,session: req.session
	})
	.pipe( res, function( err, conn ){
		if( err ) throw err ;

		conn.session.connection = conn ;
	}) ;
}) ;

app.on('sipdialog:create', function(e) {
	debug('sip dialog created');
	var dialog = e.target ;
	var session = e.session ;

}) ;

app.on('sipdialog:terminate', function(e) {
	debug('sip dialog terminated, session: ', e.session);
	var dialog = e.target ;
	var session = e.session ;

	var conn = session.connection ;
	conn.terminate() ;
}) ;
