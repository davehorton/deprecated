var EventEmitter = require('events').EventEmitter
,Connection = require('./connection')
,ControlChannel = require('./controlchannel')
,_ = require('underscore')
,util = require('util')
, fs = require('fs')
, path = require('path')
, basename = path.basename
, debug = require('debug')('msml') ;
exports = module.exports = Msml;

function Msml( app ) {
    EventEmitter.call(this); 

    var self = this ;
    this.app = app ;
    this.siprequest = app.uac ;
    this.agent = app.agent ;

    //TODO: these need to be persisted to session store
    this.mapConnections = {} ;
    this.mapControlChannels = {} ;

    this.app.on('connect', function(e){
        var host = app.get('sip address') ;
        var sdp = 'v=0\no=- 1111 0 IN IP4 ' + host + '\ns=Drachtio Server Session\nc=IN IP4 ' + host + '\nt=0 0\n' ;
        app.set('msml control channel sdp', sdp) ;
    }) ;
}
util.inherits(Msml, EventEmitter);

/* return a connection on a specified media server */
Msml.prototype.makeConnection = function( ms, opts, callback ) {
    var self = this ;

    if( 'string' !== typeof ms ) throw new Error('invalid mediaserver sip url') ;
    if( !opts.remote.sdp ) throw new Error('missing opts.remote.sdp') ;
    if( !opts.remote['content-type'] ) throw new Error('missing opts.remote.content-type') ;

    var msUrl = 0 == ms.indexOf('sip:msml') ? ms : 'sip:msml@' + ms ;
    var type = _.isObject(opts.remote['content-type']) ? opts.remote['content-type'].type : opts.remote['content-type'] ;

    var headers = _.extend( opts.headers || {}, {'content-type': type} ) ;


    function handler( err, req, res ) {
       if( err ) {
            return callback( err ) ;
        }
        if( res.statusCode === 200 ) {
            res.ack(function(err, dlg) {
                var conn = new Connection( self, dlg ) ;
                return callback( null, conn);
            }) ;
        }
        else if( res.statusCode > 200 ) {
            return callback(res.status) ;
        }
    }

    var request = this.siprequest( msUrl, {
                headers: headers
                ,body: opts.remote.sdp
            }, callback ? handler : undefined ) ;

    if( !callback ) {

        /* proxy request.pipe */
        var pipe = request.pipe ;
        request.pipe = function( res, opts, cb ) {
            pipe.call( request, res, opts, function( err, dialog ){
                if( err ) return cb(err) ;
                var conn = new Connection( self, dlg ) ;
                cb( null, conn ) ;
            }) ;
        }
    }

    return request ;
}

Msml.prototype.addConnection = function( conn, cb ) {
    this.mapConnections[conn.id] = conn ;
    debug('Msml#addConnection: there are now %d connections', _.size(this.mapConnections)) ;
} 

Msml.prototype.removeConnection = function( conn ) {
    delete this.mapConnections[conn.id] ;
    debug('Msml#removeConnection: there are now %d connections', _.size(this.mapConnections)) ;
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

//TODO: cache and return existing control channel for this ms if possible
Msml.prototype.makeControlChannel = function( ms, callback ) {
    var self = this ;

    if( 'string' !== typeof ms ) throw new Error('invalid mediaserver sip url') ;
 
    var msUrl = 0 == ms.indexOf('sip:msml') ? ms : 'sip:msml@' + ms ;
    var body = this.app.get('msml control channel sdp') ; 
    this.siprequest( msUrl, {
        headers: {
            'content-type': 'application/sdp'
        }
        ,body: body
    } , function( err, req, res ) {

      if( res.statusCode === 200 ) {
            res.ack(function(err, dlg) {

                var channel = new ControlChannel( self, dlg ) ;

                return callback( err, channel ) ;    

             }) ;
        }
        else if( res.statusCode > 200 ) {
            return callback('failed to allocate conference: ' + res.statusCode + " " + res.status.phrase ) ;
        }
    }) ;
}

Msml.prototype.addControlChannel = function( channel ) {
    this.mapControlChannels[channel.id] = channel ;
    debug('Msml#addControlChannel: there are now %d control channels', _.size(this.mapControlChannels)) ;
    throw new Error('Msml#addControlChannel') ;
}
Msml.prototype.removeControlChannel = function( channel ) {
    delete this.mapControlChannels[channel.id] ;
    debug('Msml#removeControlChannel: there are now %d control channels', _.size(this.mapControlChannels)) ;
    throw new Error('Msml#removeControlChannel') ;
} 

