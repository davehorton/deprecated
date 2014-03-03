var app = require('drachtio')()
,msml = require('..')
,msmlApp = msml(app)
,siprequest = app.uac
,_=require('underscore')
,config = require('./test-config')
,debug = require('debug')('drachtio:msml-basic-play') ;

var dlg, conn, controlChannel, conf;

app.connect( config ) ;

app.use( msml.msmlparser() ) ;
app.use( 'info', msml.router ) ;
app.use( app.router ) ;

app.invite(function(req, res) {

	msmlApp.makeConnection('209.251.49.158', {
		request: req
		,remote: {
			sdp: req.body
			,'content-type': req.get('content-type')
		}
	}, function( err, connection, dialog ){
		if( err ) {
			console.error('Unable to allocate endpoint: ' + err) ;
			return ;
		}

		conn = connection ;
		dlg = dialog ;

		dlg.bye(onBye) ;

		playFile() ;

	}) ;
}) ;

function onBye( req, res ) {
	conn.release() ;
}

function playFile() {

	debug('connected, about to send play command') ;

	var dialog = new conn.Dialog() ;
	dialog.add('play', {
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
	})
	.on('exit', function(e){
		debug('my play dialog exited') ;
		makeConference() ;
	}) 
	.start( function( err, req, res ) {
		if( err ) throw err ;
		console.log('dialog started successfully') ;
	}) ;
}

function makeConference() {
	msmlApp.makeControlChannel('192.168.173.139', function( err, channel ){
		if( err ) {
			console.error('Unable to allocate control channel: ' + err) ;
			return ;
		}
		controlChannel = channel ;

		conf = new channel.Conference() ;
		conf.add('audiomix', {});
		conf.create( function( err, req, res ){
			if( err ) throw error ;
			console.log('conference was successfully created') ;
		})
		.on('exit', function(e){
			debug('my conference exited'); 
		}) ;
	}) ;
}
