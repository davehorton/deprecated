# drachtio-msml


 [![Build Status](https://secure.travis-ci.org/davehorton/drachtio-msml.png)](http://travis-ci.org/davehorton/drachtio-msml)

 drachtio-msml is [drachtio](https://github.com/davehorton/drachtio) middleware that enables applications to incorporate audio and video control from [MSML](http://en.wikipedia.org/wiki/MSML) IP media servers.

 ```js
var msml = require('../..')
,drachtio = require('drachtio')
,app = drachtio()
,msmlApp = msml(app)
,RedisStore = require('drachtio-redis')(drachtio) 
,store = new RedisStore({host: 'localhost', prefix:''})
,config = require('./config/config')
,debug = require('debug')('drachtio:msml-basic-play') ;

app.use( drachtio.session({store: store}) ) ;
app.use( drachtio.dialog() ) ;
app.use( msml.msmlparser() ) ;
app.use( 'info', msml.router ) ;
app.use( app.router ) ;

app.connect( config.drachtio ) ;

/* receive invites, connect call to the media server, and begin playing announcement */
app.invite(function(req, res) {	

	/**
	 * 	Number to dial:		10xy
	 * 	x = 3				media is H.263 ( .mov )
	 * 	x = 4				media is H.264 ( .mov )
	 * 	x = 5				media is H.263 ( .3gp )
	 * 	x = 6				media is H.264 ( .3gp )
	 * 	y = 1:				playfile = videoAnnc1.mov		( Skyfall )
	 * 	y = 2:				playfile = videoAnnc2.mov		( Les Mis )
	 * 	Path to media is /provision/[263||264]/videoAnn[y].[3gp||mov]
	 */
	var user = req.get('to').url.user ;
	if( !user || user.length < 2 ) return res.send(500,'Dialed number too short: ' + user) ;

	var len = user.length ;
	var clip = user.slice( len - 1 ) ;
	var codec = user.slice( len - 2, len -1) ;

	if( codec < 3 || codec > 6 ) return res.send(500, 'Invalid codec number: ' + codec) ;
	if( clip < 1 || clip > 2 ) return res.send(500, 'Invalid clip number: ' + codec) ;

	var anncFile = '/provisioned/' + ( (3 == codec || 5 == codec) ? 'H263/' : 'H264/') + 'videoAnnc' + clip + ((3 == codec || 4 == codec) ? '.mov' : '.3gp') ;

	msmlApp.makeConnection('209.251.49.158', {
		remote: {
			sdp: req.body
			,'content-type': req.get('content-type')
		}
		,session: req.session
	}).pipe( res, function(err, conn) {
		if( err ) throw( err ); 

		conn.session.msConnection = conn ;
		conn.makeDialog( assemblePlayVideo( anncFile ), function(err, dialog ) {
			if( err ) throw err ;
			debug('media dialog started, id: ', dialog.id) ;
		}) ;
	}) ;
}) ;

/* event handlers */
app.on('sipdialog:create', function(e) {
	if( e.target.role == 'uas' ) e.session.uasLeg = e.target ;
}) 
.on('sipdialog:terminate', function(e) { 
	endCall( e.session.uasLeg, e.session.msConnection ) ; 
}) 
.on('msml:dialog:terminate', function(e) { 
	endCall( e.session.uasLeg, e.session.msConnection ) ; 
}) 
.on('msml:dialog:playDone', function(e) { 
	debug('playDone, reason: %s, amount played: %s', e.data['play.end'], e.data['play.amt']) ; 
}) ;

/* some useful functions */
function endCall(uasLeg, connection) {
	uasLeg && uasLeg.terminate() ;
	connection && connection.terminate() ;
}
function assemblePlayVideo( media, iterations ) {
	return {
		play: {
			audio: {
				uri: media
				,iterations: iterations
			}
			,barge: false
			,cleardb: false
			,playexit: {
				send: {
					target:'source'
					,event:'app.playDone'
					,namelist: 'play.amt play.end'
				}
			}
		}
	} ; 
}
 ```
