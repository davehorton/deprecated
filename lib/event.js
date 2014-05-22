var merge = require('utils-merge')
,MultiKeySession = require('./multikeysession')

module.exports = Event ;

function Event( obj ) {

	if( !obj.mks || !(obj.mks instanceof MultiKeySession) ) throw new Error('Event: obj.mks is a required parameter') ;
	if( !obj.target ) throw new Error('Event: obj.target is a required parameter') ;

	merge( this, obj ) ;

	this.__defineGetter__('session', function(){
		return this.mks.session ;
	});
	this.__defineSetter__('session', function(val){
		this.mks.session = val ;
	});
}

Event.prototype.emit = function( app, name, cb ) {
	var rc = app.emit( name, this ) ;
	cb && cb() ;
	return rc ;
}