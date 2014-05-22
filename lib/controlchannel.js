var drachtio = require('drachtio')
,Event = require('drachtio-session').Event
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

var _terminateHandler ;

function ControlChannel( msml, sipDialog ) {
     if (!(this instanceof ControlChannel)) return new ControlChannel( msml, sipDialog ) ;

    var self = this ;

    if( typeof sipDialog === 'undefined' ) {
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
    
   this.__defineGetter__('id', function(){
        return self.sipDialog.remote.tag ;
    });

    if( !_terminateHandler ) {
        _terminateHandler = true ;
        this.msml.app.on('msml:channel:terminate', function(e){
            debug('deleting key for channel') ;
            e.session.mks.del( e.target ) ;
        }) ;
    }
}

ControlChannel.prefix = "channel:" ;

ControlChannel.prototype.terminate = function( cb) {
    var self = this ;
    if( this.sipDialog.state === SipDialog.TERMINATED ) return ;

    this.sipDialog.request('bye', function(req, res) {
        if( cb ) cb(req, res) ;

        var e = new Event( self, self.mks ) ;
        e.req = req ;
        e.res = res ;
        e.emit( req.app, 'msml:channel:terminate') ;
    }) ;
}

ControlChannel.prototype.makeConference = function( opts, callback ) {
    var self = this ;

    if( 'object' !== typeof opts ) throw new Error('ControlChannel#makeConference: invalid opts argument - must be an object') ;

    _.extend( opts, {target: self.sessionID }) ;
    opts.type = opts.type || 'application/moml+xml' ;

    var createconference = new CreateConference( opts ) ;
    var msml = new Msml({version: "1.1"}) ;
    var el = msml.toXMLNode() ;
    el.append( createconference.toXMLNode() ) ;

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
            console.error('Error creating conference: ' + err ) ;
            if( callback ) return callback( err ) ;
        }
        if( !res.msml ) {
            console.error('response to INFO request to create conference is missing msml body') ;
            if( callback ) return callback( 'response is missing msml body') ;
        }

        if( '200' !== res.msml.getChild('result').get('response' ) ) {
            return callback(res.msml.getChild['result'].getChild('description').text) ;
        }

        /* success */

        /* set dialog name */
        var conferenceId = res.msml.getChild('result').getChild('confid').text   ;
        debug('created conference with id %s', conferenceId) ;

        //TODO: confid comes back as, e.g. conf:msml.1
        //we are going to need to add in the ms address to ensure uniqueness
        var conference = new Conference( conferenceId, self ) ;
 
        conference.attachSession( self.mks ) ;
        self.mks.set( conference ) ;

        var e = new Event( conference, conference.mks ) ;
        e.req = req ;
        e.res = res ;
        e.emit( req.app, 'msml:conference:create') ;
 
        if( callback ) return callback(err, conference) ;  
    }) ;

    return request ;
}

ControlChannel.prototype.request = function( command, cb ) {
    var msml = new Msml({version: "1.1"}) ;
    var el = msml.toXMLNode() ;
    el.append( command.toXMLNode() ) ;
    var xml = new ElementTree( el ).write({
        'xml_declaration': true
        ,encoding: 'US-ASCII'
        ,indent: 3
    });    

    this.sipDialog.request('info', {
        headers: {
            'content-type': ' application/msml+xml'
        }
        ,body: xml
    }, function( err, req, res ){
        if( cb ) cb(err, req, res) ;
    }) ;
}