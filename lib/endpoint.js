var EventEmitter = require('events').EventEmitter
,_ = require('underscore')
,util = require('util')
, debug = require('debug')('msml')

exports = module.exports = Endpoint;

function Endpoint( sipDialog ) {
    EventEmitter.call(this); 
    var self = this ;

    this.sipDialog = sipDialog ;
    
    this.__defineGetter__('connectionId', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote.tag ;
    });
    this.__defineGetter__('sdp', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote.sdp ;
    });
   this.__defineGetter__('content-type', function(){
        if( self.sipDialog.state === 'stable' ) return self.sipDialog.remote['content-type'] ;
    });

}
util.inherits(Endpoint, EventEmitter);


Endpoint.prototype.release = function() {
    if( this.sipDialog.state === 'released' ) return ;

    this.sipDialog.request('bye') ;
}