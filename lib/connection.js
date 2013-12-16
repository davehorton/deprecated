var EventEmitter = require('events').EventEmitter
,DialogStart = require('./commands/dialogstart')
,Msml = require('./commands/msml')
,et = require('elementtree')
,element = et.element
,ElementTree = et.ElementTree
,_ = require('underscore')
,util = require('util')
, debug = require('debug')('msml')

exports = module.exports = Connection;

function Connection( msml, sipDialog ) {
     if (!(this instanceof Connection)) return new Connection( msml, sipDialog ) ;
    EventEmitter.call(this); 
    var self = this ;

    this.msml = msml ;
    this.sipDialog = sipDialog ;

    this.mapMsmlDialogs = {} ;

    //allow caller to do this: var d = new conn.Dialog(name, opts) ;
    this.Dialog = _.partial( Dialog, this ) ;
    
    this.__defineGetter__('id', function(){
        if( self.sipDialog.state === 'stable' ) return 'conn:' + self.sipDialog.remote.tag ;
    });
    this.__defineGetter__('sdp', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote.sdp ;
    });
   this.__defineGetter__('content-type', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote['content-type'] ;
    });

    msml.addConnection( this ) ;

}
util.inherits(Connection, EventEmitter);


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
    this.mapMsmlDialogs[dialog.id] = dialog ;
}

Connection.prototype.removeDialog = function( dialog ) {
    delete this.mapMsmlDialogs[dialog.id] ;
}

Connection.prototype.findDialog = function( dialogId ) {
    if( dialogId in this.mapMsmlDialogs ) return this.mapMsmlDialogs[dialogId] ;
}


// Dialog is only accessible through a Connection

function Dialog( connection, opts ) {
    if (!(this instanceof Dialog)) return new Dialog( connection, opts ) ;
 
    EventEmitter.call(this); 

    this.connection = connection ;
    this.dialogstart = new DialogStart( opts ) ;

    if( this.dialogstart.has('name') ) {
        this.id = connection.id + '/dialog:' + this.dialogstart.get('name') ;
    }
}
util.inherits(Dialog, EventEmitter);

Dialog.prototype.start = function(callback) {
    this.connection.startDialog( this, callback ) ;
    return this ;
}

Dialog.prototype.postEvent = function( e ) {
    var name = e.get('name') ;
    var pos = name.lastIndexOf('.') ;
    if( -1 != pos ) name = name.slice( ++pos ) ;
    
    debug('dialog event %s', name) ;

    if( 'exit' === name  ) {
        this.connection.removeDialog( this ) ;
        debug('removed dialog from active connection, count is now %d', _.size( this.connection.mapMsmlDialogs ) ) ;
    }
    var data = {} ;
    var names = e.getChildren('name') ;
    var values = e.getChildren('value') ;

    if( names && values ) {
        for( var i = 0; i < names.length && i < values.length; i++ ) {
            data[ names[i].text ] = values[i].text ;
        }
    }
    this.emit( name, data ) ;
}

    /*

     {"version":"1.1","result":{"response":"200","dialogid":{"_text":"conn:localhost.localdomain5060+1+17b0000+2e1ef75/dialog:msml.1"}}}
     {"version":"1.1","event":{"name":{"_text":"play.amt"},"id":"conn:localhost.localdomain5060+1+17b0000+2e1ef75/dialog:msml.1","value":{"_text":"5790ms"}}} 
     {"version":"1.1","event":{"name":{"_text":"dtmf.digits"},"id":"conn:localhost.localdomain5060+1+17b0000+2e1ef75/dialog:msml.1","value":{"_text":"t"}}}
     {"version":"1.1","event":{"name":"msml.dialog.exit","id":"conn:localhost.localdomain5060+1+17b0000+2e1ef75/dialog:msml.1"}}
    */


