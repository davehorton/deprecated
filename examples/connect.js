var app = require('drachtio-client')()
,msml = require('..')(app)
,siprequest = app.uac
,_=require('underscore')
,config = require('./test-config')
,debug = require('debug')('drachtio:msml-basic-play') ;

var dlg, ep ;

app.connect( config, function() { debug('connected');} ) ;

app.invite(function(req, res) {

	msml.endpoint('sip:msml@192.168.173.139', {
		remoteSdp: req.body
	}, function( err, endpoint ){
		if( err ) {
			console.error('Unable to allocate endpoint: ' + err) ;
			res.send(500);
			return ;
		}

		ep = endpoint ;
		if( !req.active ) {
			ep.release() ;
			return ;
		}
		res.send(200, {
			headers: {
				'Content-Type': ep['content-type']
			}
			,body: ep.sdp
		}, function( err, ack, dialog ) {

			dlg = dialog ;

			console.log('connected successfully')
			setTimeout( function() {
				dlg.request('bye') ;
				ep.release() ;
			}, 3000) ;
		}) ; 	
	}) ;
}) ;
