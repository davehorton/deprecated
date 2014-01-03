var app = require('drachtio-client')()
,msml = require('..')
,msmlApp = msml(app)
,config = require('./test-config')
,debug = require('debug')('drachtio:main') ;

app.connect( config, function() { 
	
	debug('connected');

	msmlApp.makeControlChannel('192.168.173.139', function( err, channel ){
		if( err ) {
			console.error('Unable to allocate control channel: ' + err) ;
			return ;
		}
		
		setTimeout( function(){
			channel.release() ;
		}, 3000) ;

	}) ;

}) ;

debug('started')