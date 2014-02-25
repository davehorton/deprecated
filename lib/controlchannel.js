var drachtio = require('drachtio')
,Resource = drachtio.Resource 
,Event = drachtio.Event
,SipDialog = drachtio.SipDialog
,Dialog = require('./dialog')
,Conference = require('./conference')
,CreateConference = require('./commands/createconference')
,Msml = require('./commands/msml')
,Audiomix = require('./commands/audiomix')
,Videolayout = require('./commands/videolayout')
,et = require('elementtree')
,element = et.element
,ElementTree = et.ElementTree
,_ = require('underscore')
,util = require('util')
, debug = require('debug')('msml')

exports = module.exports = ControlChannel;

function ControlChannel( msml, sipDialog ) {
     if (!(this instanceof ControlChannel)) return new ControlChannel( msml, sipDialog ) ;

    var self = this ;

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

    this.mapMsmlConferences = {} ;

    this.Conference = _.partial( Conference, this ) ;
    
    msml.addControlChannel( this ) ;

   this.__defineGetter__('id', function(){
        return self.sipDialog.remote.tag ;
    });

    Resource.call(this,this.id); 
}
util.inherits(ControlChannel, Resource);

ControlChannel.prefix = "channel:" ;

ControlChannel.prototype.terminate = function( cb) {
    var self = this ;
    if( this.sipDialog.state === SipDialog.TERMINATED ) return ;

    this.msml.removeControlChannel( this ) ;

    this.sipDialog.request('bye', function(req, res) {
        if( cb ) cb(req, res) ;

        var e = new Event( self, self.mks ) ;
        e.req = req ;
        e.res = res ;
        e.emit( req.app, 'msml:channel:terminate') ;
    }) ;
}

ControlChannel.prototype.createConference = function( conference, callback ) {
    var self = this ;
    var msml = new Msml({version: "1.1"}) ;
    var el = msml.toXMLNode() ;
    el.append( conference.createConference.toXMLNode() ) ;

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

        /* set conference name if it was auto-generated */
        conference.id = conference.id || res.msml.getChild('result').getChild('conferenceid').text   ;
 
        /* add to our collection of active msml conferences on this channel */
        self.addConference( conference ) ;
 
        if( callback ) return callback(err, req, res) ;  
    }) ;
    return this ;
}

ControlChannel.prototype.addConference = function( conference ) {
    //this.mapMsmlConferences[conference.id] = conference ;
}

ControlChannel.prototype.removeConference = function( conference ) {
    delete this.mapMsmlConferences[conference.id] ;
}

ControlChannel.prototype.findConference = function( conferenceId ) {
    if( conferenceId in this.mapMsmlConferences ) return this.mapMsmlConferences[conferenceId] ;
}

