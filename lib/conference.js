var Resource = require('drachtio').Resource 
,Event = require('drachtio').Event 
,DestroyConference = require('./commands/destroyconference')
,et = require('elementtree')
,element = et.element
,ElementTree = et.ElementTree
,Msml = require('./commands/msml')
,_ = require('underscore')
,util = require('util')
,debug = require('debug')('msml')

exports = module.exports = Conference;

function Conference( id, channel ) {
    if (!(this instanceof Conference)) return new Conference( id, channel ) ;
 
    if( arguments.length === 1 ) {
        var opt = id ;
        var Channel = require('./channel') ;
        this.channel = new Channel( opt.channel ) ;
        id = opt.id ;
    }
    else {
        this.channel = channel ;
    }
 
    Resource.call(this, id );  

}
util.inherits(Conference, Resource);

Conference.prototype.terminate = function( cb ) {
    var self = this ;
    var destroyconference = new DestroyConference({id: this.id}) ;
    this.channel.request( destroyconference, function(err, req, res){
 
        var e = new Event( self, self.mks ) ;
        e.req = req ;
        e.res = res ;
        e.emit( req.app, 'msml:conference:terminate') ;

       if( cb ) cb(err) ;
   }) ;
 }

Conference.prototype.postEvent = function( e, app, mks, req, res ) {
    var name = e.get('name') ;
    var pos = name.lastIndexOf('.') ;
    if( -1 != pos ) name = name.slice( ++pos ) ;
    
    debug('conference event %s', name) ;

    var data = {} ;
    var names = e.getChildren('name') ;
    var values = e.getChildren('value') ;

    if( names && values ) {
        for( var i = 0; i < names.length && i < values.length; i++ ) {
            data[ names[i].text ] = values[i].text ;
        }
    }

    var eventname = 'msml:conference:' + name ;
    
    var event = new Event( this, mks, eventname ) ;
    event.req = req ;
    event.res = res ;
    event.data = data ;

    event.emit( app, eventname, function() {
        if( 'exit' === name ) {
            //TODO: remove conference
        }
    }) ;
}
