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
		,headers: {
			require: '100rel precondition'
			,supported: 'timer'
		}
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
	.add('dtmf', {
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
	}) 
	.on('playDone', function(e){
		debug('playDone, reason: %s, amount played: %s', e['play.end'], e['play.amt']) ;
	}) 
	.on('dtmfDone', function(e){
		debug('dtmfDone, reason: %s, digits: %s', e['dtmf.end'], e['dtmf.digits']) ;
	}) 
	.on('exit', function(e){
		debug('my play dialog exited') ;
	}) 
	.start( function( err, req, res ) {
		if( err ) throw err ;
		console.log('dialog started successfully') ;
	}) ;

}
