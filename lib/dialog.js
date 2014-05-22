var DialogStart = require('./commands/dialogstart')
,Send = require('./commands/send')
,Exit = require('./commands/exit')
,Play = require('./commands/play')
,Record = require('./commands/record')
,Dtmf = require('./commands/dtmf')
,Event = require('drachtio').Event
,_ = require('underscore')
,util = require('util')
, debug = require('debug')('msml')

exports = module.exports = Dialog;

var _terminateHandler ;

function Dialog( id, connection ) {
    if (!(this instanceof Dialog)) return new Dialog( connection, opts ) ;

    var self = this ;
 
    //TODO: dialog could be on a conference, instead of a connection
    
    if( arguments.length === 1 ) {
        var opt = id ;
        var Connection = require('./connection') ;
        this.connection = new Connection( opt.connection ) ;
        id = opt.id ;
    }
    else {
        this.connection = connection ;
    }

    if( !_terminateHandler ) {
        _terminateHandler = true ;
        this.connection.msml.app.on('msml:dialog:terminate', function(e){
            debug('deleting key for msml dialog') ;
            e.session.mks.del( e.target ) ;
            e.session.save() ;
        }) ;
        this.connection.msml.app.on('msml:dialog:create', function(e){
            debug('adding key for msml dialog') ;
            e.session.mks.set( e.target, true ) ;
            e.session.save() ;
        }) ;
    }
}


Dialog.prototype.postEvent = function( e, app, mks, req, res ) {
    var name = e.get('name') ;
    var pos = name.lastIndexOf('.') ;
    if( -1 != pos ) name = name.slice( ++pos ) ;
    
    debug('dialog event %s', name) ;

    var data = {} ;
    var names = e.getChildren('name') ;
    var values = e.getChildren('value') ;

    if( names && values ) {
        for( var i = 0; i < names.length && i < values.length; i++ ) {
            data[ names[i].text ] = values[i].text ;
        }
    }

    var eventname = 'msml:dialog:' + ('exit' === name ? 'terminate' : name) ;
    
    var event = new Event( this, mks, eventname ) ;
    event.req = req ;
    event.res = res ;
    event.data = data ;

    event.emit( app, eventname, function() {
        if( 'exit' === name ) {
            //TODO: remove dialog
        }
    }) ;
}
