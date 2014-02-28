var Resource = require('drachtio').Resource 
, Msml = require('./commands/msml')
,Dialog = require('./dialog')
,SipDialog = require('drachtio').SipDialog
,DialogStart = require('./commands/dialogstart')
,et = require('elementtree')
,element = et.element
,ElementTree = et.ElementTree
,_ = require('underscore')
,util = require('util')
, debug = require('debug')('msml')

exports = module.exports = Connection;

function Connection( msml, sipDialog ) {
     if (!(this instanceof Connection)) return new Connection( msml, sipDialog ) ;

    var self = this ;
    var msml = msml ;

    if( arguments.length === 1 ) {
        /* hash of values read from storage */
        var args = msml ;
        this.sipDialog = new SipDialog( args.sipDialog ) ;
    }
    else {

        this.sipDialog = sipDialog ;
    }

    var msmlApp = require('..'); 
    Object.defineProperty( this, 'msml', {
        get: function() { return msmlApp.instance; }
    }) ;

    this.mapMsmlDialogs = {} ;

    this.Dialog = _.partial( Dialog, this ) ;
    
    this.__defineGetter__('id', function(){
        return self.sessionID ;
    });
    this.__defineGetter__('sdp', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote.sdp ;
    });
   this.__defineGetter__('content-type', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote['content-type'] ;
    });

    this.msml.addConnection( this ) ;

    Resource.call(this, self.sipDialog.remote.tag ); 

}
util.inherits(Connection, Resource);

Connection.prefix = 'conn:' ;

Connection.prototype.terminate = function( cb ) {
    if( this.sipDialog.state === SipDialog.TERMINATED ) return ;

    this.sipDialog.request('bye', function(req, res) {
        if( cb ) cb(req, res) ;
    }) ;
}

Connection.prototype.startDialog = function( dialog, callback ) {
    var self = this ;
    var msml = new Msml({version: "1.1"}) ;
    var el = msml.toXMLNode() ;
    el.append( dialog.dialogstart.toXMLNode() ) ;

    var xml = new ElementTree( el ).write({
        'xml_declaration': true
        ,encoding: 'US-ASCII'
        ,indent: 3
    });    

    debug('sending xml %s', xml) ;
    this.sipDialog.request('info', {
        headers: {
            'content-type': ' application/msml+xml'
        }
        ,body: xml
    }, function( err, req, res ){
        debug('response to info message was: ', res.statusCode) ;

        if( err ) return callback( err ) ;
        if( !res.msml ) return callback( 'response is missing msml body') ;
        if( '200' !== res.msml.getChild('result').get('response' ) ) return callback(res.msml.getChild['result'].getChild('description').text) ;

        /* set dialog name if it was auto-generated */
        dialog.id = dialog.id || res.msml.getChild('result').getChild('dialogid').text   ;
 
        /* add to our collection of active msml dialogs on this connection */
        self.addDialog( dialog ) ;
 
        if( callback ) return callback(err, req, res) ;  
    }) ;
    return this ;
}

Connection.prototype.makeDialog = function( opts, callback ) {
    var self = this ;

    if( 'object' !== typeof opts ) throw new Error('Connection#makeDialog: invalid opts argument - must be an object') ;

    var dialogStart = new DialogStart( opts ) ;
    var msml = new Msml({version: "1.1"}) ;
    var el = msml.toXMLNode() ;
    el.append( dialogstart.toXMLNode() ) ;

    var xml = new ElementTree( el ).write({
        'xml_declaration': true
        ,encoding: 'US-ASCII'
        ,indent: 3
    });    

    debug('sending xml %s', xml) ;
    this.sipDialog.request('info', {
        headers: {
            'content-type': ' application/msml+xml'
        }
        ,body: xml
        ,session: opts.session
    }, function( err, req, res ){
        debug('response to info message was: ', res.statusCode) ;

        /* various failure cases */
        if( err ) {
            console.error('Error creating dialog: ' + err ) ;
            if( callback ) return callback( err ) ;
        }
        if( !res.msml ) {
            console.error('response to INFO request to start dialog is missing msml body') ;
            if( callback ) return callback( 'response is missing msml body') ;
        }

        if( '200' !== res.msml.getChild('result').get('response' ) ) {
            return callback(res.msml.getChild['result'].getChild('description').text) ;
        }

        /* success */

        /* set dialog name */
        var dialogId = res.msml.getChild('result').getChild('dialogid').text   ;
        var dialog = new Dialog( self, dialogId, dialogStart ) ;
 
        dialog.attachSession( req.mks ) ;
        req.mks.set( dialog ) ;

        var e = new Event( dialog, req.mks ) ;
        e.req = req ;
        e.res = res ;
        e.emit( req.app, 'msml:dialog:create') ;
 
        if( callback ) return callback(err, dialog) ;  
    }) ;


    function handler( err, req, res ) {
       if( err ) {
            return callback( err ) ;
        }
        if( res.statusCode === 200 ) {
            res.ack(function(err, dlg) {
                if( err ) return callback(err) ;

                var conn = new Connection( self, dlg ) ;
                conn.attachSession( req.mks ) ;
                req.mks.set( conn ) ;

                var e = new Event( conn, req.mks ) ;
                e.req = req ;
                e.res = res ;
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
                headers: headers
                ,body: opts.remote.sdp
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

                var mks = request.mks ;
                conn.attachSession( mks ) ;
                mks.set( conn ) ;

                var e = new Event( conn, mks ) ;
                e.req = request ;
                e.res = res ;
                e.emit( res.req.app, 'msml:connection:create') ;

                if( callback ) callback( err, connection ) ;                        
            }) ;
        }
    }
    else {
        request = this.siprequest( msUrl, {
                headers: headers
                ,body: opts.remote.sdp
            }, handler ) ;        
    }

    return request ;
}

Connection.prototype.addDialog = function( dialog ) {
    //this.mapMsmlDialogs[dialog.id] = dialog ;
}

Connection.prototype.removeDialog = function( dialog ) {
    delete this.mapMsmlDialogs[dialog.id] ;
}

Connection.prototype.findDialog = function( dialogId ) {
    if( dialogId in this.mapMsmlDialogs ) return this.mapMsmlDialogs[dialogId] ;
}

