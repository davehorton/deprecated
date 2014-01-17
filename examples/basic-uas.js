var app = require('..')()
,siprequest = app.uac
,d = require('./fixtures/data')
,config = require('./test-config')
,debug = require('debug')('drachtio:example-basic-uac') ;
 
app.connect( {
    host: 'localhost'
    ,port: 8022
    ,secret: 'cymru'
} ) ;

app.invite(function(req, res) {

   req.cancel(function(creq, cres){
        debug('caller hung up before answer') ;
    }) ;
        
	req.active && res.send(183, {
        headers: {
            'Content-Type': 'application/sdp'
        }
        ,body: d.dummySdp
    }) ;

    req.active && res.send(200, {
        headers: {
            'Content-Type': 'application/sdp'
        }
        ,body: d.dummySdp
    }, function( err, ack, dlg ) {

        if( err ) {
            console.error('error sending 200 OK to INVITE, ' + err) ;
            app.disconnect() ;
            return ;
        }
 
        dlg.bye(onDialogBye) ;

        setTimeout(function(){
            dlg.request('bye') ;
        }, 5000);        
    });
}) ;


function onDialogBye( req, res ) {
    debug('caller hungup') ;
    res.send(200) ;
}





