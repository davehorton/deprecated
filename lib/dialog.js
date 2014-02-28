var Resource = require('drachtio').Resource 
,DialogStart = require('./commands/dialogstart')
,Send = require('./commands/send')
,Exit = require('./commands/exit')
,Play = require('./commands/play')
,Record = require('./commands/record')
,Dtmf = require('./commands/dtmf')
,_ = require('underscore')
,util = require('util')
, debug = require('debug')('msml')

exports = module.exports = Dialog;

function Dialog( connection, opts ) {
    if (!(this instanceof Dialog)) return new Dialog( connection, opts ) ;
 
    opts = opts || {} ;

    //TODO: handle case of loaded from storage, in which case arguments has length 1, a hash of data
    //
    //
    opts.target = opts.target || connection.sessionID ;
    opts.type = opts.type || 'application/moml+xml' ;

    this.connection = connection ;
    this.dialogstart = new DialogStart( opts ) ;

    this.__defineGetter__('id', function(){
        return self.sessionID ;
    });

    //if( this.dialogstart.has('name') ) {
    //    this.id = connection.id + '/dialog:' + this.dialogstart.get('name') ;
    //}

    Resource.call(this, this.dialogstart.get('name') ); 
}
util.inherits(Dialog, Resource);

Connection.prefix = 'dialog:' ;

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

var commandNames = {'play': Play, 'dtmf': Dtmf, 'record': Record, 'send': Send, 'exit': Exit} ;

Dialog.prototype.add = function( name, opts ) {
    if( !(name in commandNames ) ) throw new Error('unknown command name in Dialog#add') ;

    var command = new commandNames[name]( opts ) ;
    this.dialogstart.appendChild( command ) ;
    return this ;
}

