var app = require('drachtio-client')()
,msml = require('..')
,msmlApp = msml(app)
,siprequest = app.uac
,_=require('underscore')
,config = require('./test-config')
,debug = require('debug')('drachtio:msml-basic-play') ;

var dlg, conn ;

app.connect( config, function() { debug('connected');} ) ;

app.use( msml.msmlparser() ) ;
app.use( 'info', msml.router ) ;
app.use( app.router ) ;

app.invite(function(req, res) {

	msmlApp.makeConnection('192.168.173.139', {
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

		playAndRecord() ;

	}) ;
}) ;

function onBye( req, res ) {
	conn && conn.release() ;
}

function playAndRecord() {

	debug('connected, about to send play/record command') ;

	var dialog = new conn.Dialog() ;
	dialog.add('play',{
		barge: true
		,cleardb: false
		,audio: {
			uri:'file://provisioned/4478.wav'
		}
		,playexit: {
			send: {
				target:'source'
				,event:'app.playDone'
				,namelist: 'play.amt play.end'
			}
		}
	})
	.add('send', {
		target: 'source'
		,event: 'app.playcomplete'
		,namelist: 'play.end play.amt'
	})
	.add('record', {
		dest: 'file://transient/11.wav'
		,format: 'audio/wav'
		,maxtime: '10s'
	})
	.add('send', {
		target: 'source'
		,event: 'app.recorddone'
		,namelist: 'record.end record.len'
	})
	.add('play', {
		barge: true
		,cleardb: false
		,audio: {
			uri: 'file://transient/11.wav'
		}
	})
	.add('exit', {
		namelist: 'play.end play.amt'
	}) 
	.start( function( err, req, res ) {
		if( err ) throw err ;
		console.log('dialog started successfully') ;
	}) 
	.on('recorddone', function(e){
		debug('recorddone, reason: %s, recording length: %s', e['record.end'], e['record.len']) ;
	}) 
	.on('exit', function(e){
		debug('my record dialog exited') ;
	}) ;

}
