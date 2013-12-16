var app = require('drachtio-client')()
,msml = require('..')(app)
,siprequest = app.uac
,_=require('underscore')
,config = require('./test-config')
,debug = require('debug')('drachtio:msml-basic-play') ;

var dlg, conn ;

app.connect( config, function() { debug('connected');} ) ;

app.invite(function(req, res) {

	msml.makeConnection('192.168.173.139', {
		remote: {
			sdp: req.body
			,'content-type': req.get('content-type')
		}
	}, function( err, connection ){
		if( err ) {
			console.error('Unable to allocate endpoint: ' + err) ;
			res.send(500);
			return ;
		}

		conn = connection ;
		if( !req.active ) {
			ep.release() ;
			return ;
		}
		res.send(200, {
			headers: {
				'Content-Type': conn['content-type']
			}
			,body: conn.sdp
		}, function( err, ack, dialog ) {

			dlg = dialog ;

			console.log('connected successfully')
			setTimeout( function() {
				dlg.request('bye') ;
				conn.release() ;
			}, 3000) ;
		}) ; 	
	}) ;
}) ;
