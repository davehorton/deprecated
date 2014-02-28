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

    Resource.call(this, 'conn:' + self.sipDialog.remote.tag ); 

}
util.inherits(Connection, Resource);

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

    _.extend( opts, {target: self.sessionID }) ;
    opts.type = opts.type || 'application/moml+xml' ;

    var dialogstart = new DialogStart( opts ) ;
    var msml = new Msml({version: "1.1"}) ;
    var el = msml.toXMLNode() ;
    el.append( dialogstart.toXMLNode() ) ;

    var xml = new ElementTree( el ).write({
        'xml_declaration': true
        ,encoding: 'US-ASCII'
        ,indent: 3
    });    

    debug('sending xml %s', xml) ;
    var request = this.sipDialog.request('info', {
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
        var dialog = new Dialog( self, dialogId, dialogstart ) ;
 
        dialog.attachSession( self.mks ) ;
        self.mks.set( dialog ) ;

        var e = new Event( dialog, self.mks ) ;
        e.req = req ;
        e.res = res ;
        e.emit( req.app, 'msml:dialog:create') ;
 
        if( callback ) return callback(err, dialog) ;  
    }) ;

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

