var EventEmitter = require('events').EventEmitter
,Endpoint = require('./endpoint')
,_ = require('underscore')
,util = require('util')
, debug = require('debug')('msml')

exports = module.exports = Msml;

function Msml( app ) {
    EventEmitter.call(this); 

    this.app = app ;
    this.siprequest = app.uac ;
    this.agent = app.agent ;
}
util.inherits(Msml, EventEmitter);

Msml.prototype.endpoint = function( ms, opts, callback ) {

    if( 'string' !== typeof ms ) throw new Error('invalid mediaserver sip url') ;
    if( !opts.remoteSdp ) throw new Error('missing opts.remoteSdp') ;

    this.siprequest( ms, {
        headers:{
            'content-type': 'application/sdp'
        },
            body: opts.remoteSdp
    } , function( err, req, res ) {

      if( res.statusCode === 200 ) {
            res.ack(function(err, dlg) {

                var ep = new Endpoint( dlg ) ;
                return callback( err, ep ) ;                
            }) ;
        }
        else if( res.statusCode > 200 ) {
            return callback('failed to allocate endpoint: ' + res.statusCode + " " + res.status.phrase ) ;
        }
    }) ;
}