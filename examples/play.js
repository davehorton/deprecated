var app = require('drachtio-client')()
,msml = require('..')(app)
,siprequest = app.uac
,_=require('underscore')
,config = require('../test-config')
,debug = require('debug')('drachtio:msml-basic-play') ;

var dlg, ep ;

app.connect( config, function() { debug('connected');} ) ;

app.invite(function(req, res) {

	msml.endpoint('192.168.173.139', {
		remoteSdp: sdp
	}, function( err, endpoint ){
		if( err ) throw err ;
		ep = endpoint ;
		res.send(200, {
			headers: {
				'content-type': req.get('content-type')
			}
			,body: dlg.local.sdp
		}, function( err, ack, dialog ) {
			dlg = dialog ;
			playFile() ;
		}) ; 	
	}) ;
	
    /* if caller hangs up while we're connecting him, cancel our outbound request as well */
   req.cancel( function( creq, cres ){
        r.cancelRequest() ;
        cres.send(200) ;    
    }) ;

}) ;

function playFile() {

	var msDialog = ep.dialog({
		play: {
			files: [file://provisioned/4300.wav]
			,barge: true
		}
		,dtmf: {
			fdt: '10s'
			,idt: '6s'
			,edt: '6s'
			,cleardb: false
			,pattern: {
				digits: 'min=4;max=10;rtk=#'
				,format: 'moml+digits'
			}
			events: ['noinput','nomatch']
		}
		,exit: ['dtmf.digits','dtmf.end']
	}, function( err){
		if( err ) throw err ;
		debug('play started') ;
	}) ;
	
	msDialog.on('dtmf', function(digits){
	
	}) ;
	
	msDialog.on('exit', function(){
	
	}) ;
}

function onDialogInfo( req, res ) {
    debug('received INFO within a dialog ') ;
    res.send(200) ;
}
function onDialogBye( req, res ) {
    (this === uacDlg ? uasDlg : uacDlg).request('bye') ;
}



