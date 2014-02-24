var Resource = require('drachtio').Resource 
, Msml = require('./commands/msml')
,Dialog = require('./dialog')
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

    Object.defineProperty( this, 'msml', msml ) ;
    this.sipDialog = sipDialog ;

    this.mapMsmlDialogs = {} ;

    this.Dialog = _.partial( Dialog, this ) ;
    
    this.__defineGetter__('id', function(){
        return self.sipDialog.remote.tag ;
    });
    this.__defineGetter__('sdp', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote.sdp ;
    });
   this.__defineGetter__('content-type', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote['content-type'] ;
    });

    msml.addConnection( this ) ;

    Resource.call(this, this.id); 

}
util.inherits(Connection, Resource);

Connection.prefix = "conn:" ;

Connection.prototype.release = function() {
    if( this.sipDialog.state === 'released' ) return ;

    this.sipDialog.request('bye') ;
}

Connection.prototype.startDialog = function( dialog, callback ) {
    var self = this ;
    var msml = new Msml({version: "1.1"}) ;
    var el = msml.toXMLNode() ;
    el.append( dialog.dialogstart.toXMLNode() ) ;

    var xml = new ElementTree( el ) .write({
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

Connection.prototype.addDialog = function( dialog ) {
    //this.mapMsmlDialogs[dialog.id] = dialog ;
}

Connection.prototype.removeDialog = function( dialog ) {
    delete this.mapMsmlDialogs[dialog.id] ;
}

Connection.prototype.findDialog = function( dialogId ) {
    if( dialogId in this.mapMsmlDialogs ) return this.mapMsmlDialogs[dialogId] ;
}

