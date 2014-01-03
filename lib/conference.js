var EventEmitter = require('events').EventEmitter
,CreateConference = require('./commands/createconference')
,Audiomix = require('./commands/audiomix')
,Videolayout = require('./commands/videolayout')
,_ = require('underscore')
,util = require('util')
, debug = require('debug')('msml')

function Conference( channel, opts ) {
    if (!(this instanceof Conference)) return new Conference( channel, opts ) ;
 
    EventEmitter.call(this); 

    opts = opts || {} ;

    opts.target = opts.target || channel.id ;
    opts.type = opts.type || 'application/moml+xml' ;

    this.channel = channel ;
    this.createconference = new CreateConference( opts ) ;

    //TODO: conferences can have dialogs as well, need to track them as connection.js does

    this.Dialog = _.partial( Dialog, this ) ;

    if( this.createconference.has('name') ) {
        this.id = 'conf:' + this.createconference.get('name') ;
    }
}
util.inherits(Conference, EventEmitter);

Conference.prototype.create = function(callback) {
    this.channel.createConference( this, callback ) ;
    return this ;
}

Conference.prototype.postEvent = function( e ) {
    var name = e.get('name') ;
    var pos = name.lastIndexOf('.') ;
    if( -1 != pos ) name = name.slice( ++pos ) ;
    
    debug('conference event %s', name) ;

    if( 'exit' === name  ) {
        this.channel.removeConference( this ) ;
        debug('removed conference, count is now %d', _.size( this.channel.mapMsmlConferences ) ) ;
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


var commandNames = {'audiomix': Audiomix, 'videolayout': Videolayout} ;

Conference.prototype.add = function( name, opts ) {
    if( !(name in commandNames ) ) throw new Error('unknown command name in Conference#add: ' + name) ;

    var command = new commandNames[name]( opts ) ;
    this.createconference.appendChild( command ) ;
    return this ;
}

