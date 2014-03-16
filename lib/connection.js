var ControlChannel = require('./controlchannel')
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

var _terminateHandler ;

function Connection( msml, sipDialog ) {
    var self = this ;

     if (!(this instanceof Connection)) return new Connection( msml, sipDialog ) ;

    ControlChannel.call( this, msml, sipDialog ) ;
 
    this.Dialog = _.partial( Dialog, this ) ;
    
    this.__defineGetter__('sdp', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote.sdp ;
    });
   this.__defineGetter__('content-type', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote['content-type'] ;
    });

    if( !_terminateHandler ) {
        _terminateHandler = true ;
        this.msml.app.on('msml:connection:terminate', function(e){
            debug('deleting key for connection') ;
            e.session.mks.del( e.target ) ;
        }) ;
    }

}
util.inherits(Connection, ControlChannel);

Connection.prefix = "conn:" ;

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
        var dialog = new Dialog( dialogId, self ) ;
 
        dialog.attachSession( req.mks ) ;
        req.mks.set( dialog ) ;

        var e = new Event( dialog, dialog.mks ) ;
        e.req = req ;
        e.res = res ;
        e.emit( req.app, 'msml:dialog:create') ;
 
        if( callback ) return callback(err, dialog) ;  

    }) ;

    return request ;
}
