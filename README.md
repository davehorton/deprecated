# drachtio-msml


 [![Build Status](https://secure.travis-ci.org/davehorton/drachtio-msml.png)](http://travis-ci.org/davehorton/drachtio-msml)

 drachtio-msml is [drachtio](https://github.com/davehorton/drachtio) middleware that enables applications to incorporate audio and video control from [MSML](http://en.wikipedia.org/wiki/MSML) IP media servers.

 ```js
var app = require('drachtio')()
,msml = require('drachtio-msml')
,msmlApp = msml(app)
,RedisStore = require('drachtio-redis')(drachtio) 
,siprequest = app.uac
,_=require('underscore')
,config = require('./test-config'),
,debug = require('debug') ;

var dlg, conn ;

app.connect( config ) ;

app.use( drachtio.session({store: new RedisStore({host: 'localhost'}) }) ) ;
app.use( drachtio.dialog() ) ;
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
		if( err ) throw err ;

		dialog.session.conn = connection ;

		playFile(connection) ;

	}) ;
}) ;

function playFile(conn) {

	var media_dialog = new conn.Dialog() ;
	media_dialog.add('play', {
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
app.on('sipdialog:terminate', function(e){
	console.log('caller hung up') ;

	/* terminate media server dialog */
	var dialog = e.target ;
	dialog.session.conn.terminate() ;
}); 
 ```
