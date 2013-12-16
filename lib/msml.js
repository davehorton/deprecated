var EventEmitter = require('events').EventEmitter
,Connection = require('./connection')
,_ = require('underscore')
,util = require('util')
, fs = require('fs')
, path = require('path')
, basename = path.basename
, debug = require('debug')('msml') ;

exports = module.exports = Msml;

function Msml( app ) {
    EventEmitter.call(this); 

    this.app = app ;
    this.siprequest = app.uac ;
    this.agent = app.agent ;

    this.mapConnections = {} ;

}
util.inherits(Msml, EventEmitter);

/* return a connection on a specified media server */
Msml.prototype.makeConnection = function( ms, opts, callback ) {
    var self = this ;

    if( 'string' !== typeof ms ) throw new Error('invalid mediaserver sip url') ;
    if( !opts.remote.sdp ) throw new Error('missing opts.remote.sdp') ;
    if( !opts.remote['content-type'] ) throw new Error('missing opts.remote.content-type') ;

    var msUrl = 0 == ms.indexOf('sip:msml') ? ms : 'sip:msml@' + ms ;
    var uacRequest = opts.request ;
    var type = _.isObject(opts.remote['content-type']) ? opts.remote['content-type'].type : opts.remote['content-type'] ;

    this.siprequest( msUrl, {
        headers:{
            'content-type': type
        },
        body: opts.remote.sdp
    } , function( err, req, res ) {

      if( res.statusCode === 200 ) {
            res.ack(function(err, dlg) {

                var conn = new Connection( self, dlg ) ;

                if( !uacRequest ) return callback( err, conn ) ;    

                /* the caller provided us the incoming UAC request so send responses back on it */
                if( !uacRequest.active ) {
                    conn.release() ;
                    return callback('calling party release');
                }
                uacRequest.res.send(200, {
                    headers: {
                        'Content-Type': conn['content-type']
                    }
                    ,body: conn.sdp
                }, function( err, ack, dialog ) {
                    return callback( null, conn, dialog ) ;
                }) ;
            }) ;
        }
        else if( res.statusCode > 200 ) {
            if( uacRequest && uacRequest.active ) req.res.send( res.statusCode) ;
            return callback('failed to allocate endpoint: ' + res.statusCode + " " + res.status.phrase ) ;
        }
    }) ;
}

Msml.prototype.addConnection = function( conn ) {
    this.mapConnections[conn.id] = conn ;
} 

Msml.prototype.removeConnection = function( conn ) {
    delete this.mapConnections[conn.id] ;
} 

Msml.prototype.findConnection = function( connId ) {
    if( connId in this.mapConnections ) return this.mapConnections[connId] ;
}
Msml.prototype.findDialog = function( dialogId ) {
    var pos = dialogId.indexOf('/dialog:') ;
    var connId = dialogId.slice(0, pos) ;
    var conn = this.findConnection( connId ) ;
    if( conn ) return conn.findDialog( dialogId ) ;
}

