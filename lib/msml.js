var EventEmitter = require('events').EventEmitter
,Connection = require('./connection')
,ControlChannel = require('./controlchannel')
,Event = require('drachtio').Event
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
    this.siprequest = app.siprequest ;
    this.agent = app.agent ;

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

    if( 'string' !== typeof ms ) throw new Error('Msml#makeConnection: invalid mediaserver sip url') ;
    if( 'object' !== typeof opts ) throw new Error('Msml#makeConnection: invalid opts argument - must be an object') ;

    if( !opts.remote.sdp ) throw new Error('missing opts.remote.sdp') ;
    if( !opts.remote['content-type'] ) throw new Error('missing opts.remote.content-type') ;

    var msUrl = 0 == ms.indexOf('sip:msml') ? ms : 'sip:msml@' + ms ;
    var type = 'object' === typeof(opts.remote['content-type']) ? opts.remote['content-type'].type : opts.remote['content-type'] ;

    var headers = _.extend( opts.headers || {}, {'content-type': type} ) ;


    function handler( err, req, res ) {
       if( err ) {
            debug('Msml#makeConnection: error ', err ) ;
            return callback( err ) ;
        }
        if( res.statusCode === 200 ) {
            res.ack(function(err, dlg) {
                if( err ) return callback(err) ;

                var conn = new Connection( self, dlg ) ;
                conn.attachSession( req.mks ) ;
                req.mks.set( conn ) ;

                var e = new Event({
                    target: conn
                    ,mks: req.mks
                    ,req: req
                    ,res: res
                }) ;
                e.emit( req.app, 'msml:connection:create') ;
               
                return callback( null, conn);
            }) ;
        }
        else if( res.statusCode > 200 ) {
            return callback(res.status) ;
        }
    }
    var request ;

    if( !callback ) {
        request = this.siprequest( msUrl, {
                message: {
                    headers: headers
                    ,body: opts.remote.sdp
                        
                }
                ,session: opts.session
           }) ;

         /* proxy request.pipe */
        var pipe = request.pipe ;
        request.pipe = function( res, opts, cb ) {
            if( typeof opts === 'function') {
                cb = opts ;
                opts = {} ;
            }
            pipe.call( request, res, opts, function( err, dialog ){
                if( err ) return cb(err) ;
                var conn = new Connection( self, dialog ) ;

                request.mks.attachTo( conn ) ;

                var e = new Event({
                    target: conn
                    ,mks: request.mks
                    ,req: req
                    ,res: res
                }) ;
                e.emit( res.req.app, 'msml:connection:create') ;

                if( cb ) cb( err, conn ) ;                        
            }) ;
        }
    }
    else {
        request = this.siprequest( msUrl, {
                message: {
                    headers: headers
                    ,body: opts.remote.sdp                   
                }
                 ,session: opts.session
            }, handler ) ;        
    }

    return request ;
}

Msml.prototype.makeControlChannel = function( ms, opts, callback ) {
    var self = this ;

    if( 'string' !== typeof ms ) throw new Error('invalid mediaserver sip url') ;

    if( typeof opts === 'function') {
        callback = opts ;
        opts = {} ;
    }
    else if( arguments.length === 1 ) {
        opts = {} ;
    }
 
    var msUrl = 0 == ms.indexOf('sip:msml') ? ms : 'sip:msml@' + ms ;
    var body = this.app.get('msml control channel sdp') ; 

    var request = this.siprequest( msUrl, {
        headers: {
            'content-type': 'application/sdp'
        }
        ,body: body
        ,session: opts.session
    } , function( err, req, res ) {

      if( res.statusCode === 200 ) {
            res.ack(function(err, sipDialog) {

                var channel = new ControlChannel( self, sipDialog ) ;

                channel.attachSession( req.mks ) ;
                req.mks.set( channel ) ;

                var e = new Event({
                    target: channel
                    ,mks: req.mks
                    ,req: req
                    ,res: res
                }) ;
                e.emit( req.app, 'msml:channel:create') ;

                if( callback ) callback( err, channel ) ;                        
             }) ;
        }
        else if( res.statusCode > 200 ) {
            return callback('failed to allocate control channel: ' + res.statusCode + " " + res.status.phrase ) ;
        }
    }) ;

    return request ;
}

