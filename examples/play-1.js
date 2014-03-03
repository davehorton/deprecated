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
		,session: req.session
	}).pipe( res ) ;
}) ;

app.on('sipdialog:create', function(e) {
	debug('sip dialog created');
}) ;

app.on('msml:connection:create', function(e) {
	debug('connection created') ;
	e.session.msConnection = e.target ;

	playFile(e.target) ;
}) ;

app.on('sipdialog:terminate', function(e) {
	debug('sip dialog terminated');

	e.session.msConnection.terminate() ;
}) ;

function playFile( conn ) {

	conn.makeDialog({
		'play': {
			barge: true
			,cleardb: false
			,audio: {
				uri:'file://provisioned/4300.wav'
			}
			,playexit: {
				send: {
					target:'source'
					,event:'app.playDone'
					,namelist: 'play.amt play.end'
				}
			}
		}
		,'dtmf': {
			fdt: '10s'
			,idt: '6s'
			,edt: '6s'
			,cleardb: false
			,pattern: {
				digits: 'min=4;max=10;rtk=#'
				,format: 'moml+digits'
			}
			,dtmfexit: {
				send: {
					target:'source'
					,event:'app.dtmfDone'
					,namelist: 'dtmf.digits dtmf.end'
				}
			}
		}
	}, function(err, dialog ) {
		if( err ) throw err ;
		debug('media dialog started (callback)') ;
		debug('dialog session: ', dialog.session) ;
	}) ;
}

app.on('msml:dialog:create', function(e) {
	debug('media dialog started (event): ', e.session ) ;
}) ;
app.on('msml:dialog:terminate', function(e) {
	debug('media dialog terminated') ;
}) ;
app.on('msml:dialog:playDone', function(e) {
	debug('playDone, reason: %s, amount played: %s', e.data['play.end'], e.data['play.amt']) ;
}) ;
app.on('msml:dialog:dtmfDone', function(e) {
	debug('dtmfDone, reason: %s, digits: %s', e['dtmf.end'], e['dtmf.digits']) ;
}) ;
