
module.exports = Event ;

function Event( target, mks, reason ) {
	this.target = target ;
	this.mks = mks ;
	this.reason = reason ;

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