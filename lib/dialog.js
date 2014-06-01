var drachtio = require('drachtio')
,util = require('util')
,merge = require('utils-merge')
,_ = require('underscore')
,sipMethods = drachtio.methods
,debug = require('debug')('drachtio-dialog:dialog') ;

exports = module.exports = SipDialog ;

var dialogStates = [] ;

['pending','early','stable','terminated'].forEach( function( state ){
	SipDialog[state.toUpperCase()] = state ;
	dialogStates.push( state ) ;
}) ;


SipDialog.UAC = 'uac' ;
SipDialog.UAS = 'uas' ;


/*

SipDialog( req, res); //when called as UAS

SipDialog( req ) ; //when called as UAC

SipDialog( hash ) ; //when instantiated from session store

*/
/**
 * Represents a Sip dialog.
 * The constructor is called in three scenarios: when a dialog is created as either a UAC or UAS, 
 * and also when a dialog is loaded from the session store.  
 * 
 * In the UAC scenario, the dialog is created when a 200 OK response is received.
 * In the UAS scenario the dialog is created when the ACK is received.
 * 
 * @param {request | object } request object or data hash when loaded from storage     
 * @param {[response]} res    response object
 * @param {[function]} callbacks to invoke when ACK is received in UAS scenario 
 */
function SipDialog(req, res, callbacks) {
	var self = this ;

	this.__defineGetter__('id', function(){
		return 'sipdialog:' + self.call_id + ';' + self.role ;
	});

	if( 1 === arguments.length  && req.method !== 'INVITE' ) {
		/* i.e., var x = new SipDialog( hash ); */
		_.extend( this, req ) ;
		return ;
	}
	if( 2 !== arguments.length ) throw new Error('SipDialog must be initialized with request and response') ;
	
	if( req.method !== 'INVITE' || req.method !== 'INVITE') {
		var err =  new Error('SipDialog must be initialized with an INVITE request or a properties hash') ;
		console.error(err.stack) ;
		throw err ;
	}

	/* these should not be enumerable / so it won't be persisted to session store  */
	Object.defineProperty( this, 'agent', {value: req.agent} ) ;
    Object.defineProperty( this, 'app', {value: req.app}) ;

	this.transactionId = req.transactionId ;
    this.role = req.source === 'network' ? SipDialog.UAS : SipDialog.UAC ;
	this.local = {} ;
	this.remote = {} ;
	this.times = {
		start_time: req.msg.time 
	} ;
	this.state = res.statusCode < 200 ? SipDialog.EARLY : SipDialog.STABLE ;

	var local, remote ;
	if( this.role === SipDialog.UAC ) {
		local = req ;
		remote = res ;

		this.local.tag = req.get('from').tag ;
		this.local.signaling_address = req.get('contact').url.host ;
		this.local.signaling_port = req.get('contact').url.port ;
		this.local.sdp = req.body ;
		this.local['content-type'] = req.get('content-type') ;

		this.remote.tag = res.get('to').tag ;
		this.remote.signaling_address = res.get('contact').url.host  ;
		this.remote.signaling_port = res.get('contact').url.port ;
		this.remote.sdp = res.getBody() ;
		this.remote['content-type'] = res.get('content-type')
	}
	else {
		local = res ;
		remote = req ;

		var hostport = req.app.get('sip contact address') ;
		var pos = hostport.indexOf(':') ;
		if( -1 != pos ) {
			this.local.signaling_address = hostport.slice(0,pos) ;
			this.local.signaling_port = hostport.slice(++pos); 
		}
		else {
			this.local.signaling_address = hostport ;
			this.local.signaling_port = 5060 ;
		}

		this.remote.tag = req.get('from').tag ;
		this.remote.signaling_address = req.get('contact').url.host  ;
		this.remote.signaling_port = req.get('contact').url.port || 5060 ;
		this.remote.sdp = req.body ;
		this.remote['content-type'] = req.get('content-type') ;
		this.state = SipDialog.PENDING ;

		/* set up our callbacks on receiving ACK, and add some middleware to set connect time */
		callbacks = callbacks || [] ;

    	/* bind the callbacks context to the SipDialog */
		Object.defineProperty(this, 'ackCallbacks', {value: _.map( callbacks, function( fn ){ return _.bind( fn, this ) ; }, this) });
	}

	this.call_id = req.get('call-id');
	var to = req.get('to') ;
	this.called_party = {
		user: to.url.user 
		,display: to.url.display
	} ;
	
	var cli = req.get('p_asserted_identify') || req.get('remote_party_id') || req.get('from') ;
	this.calling_party = {
		user: cli.url.user
		,display: cli.url.display
		,privacy: req.get('privacy')
	} ;
}

SipDialog.prototype.setConnectTime = function( time ) {
	this.times.connect_time = time ;
}
SipDialog.prototype.setEndTime = function( time ) {
	this.times.end_time = time ;
}

SipDialog.prototype.setRemote = function( msg ) {
	merge( this.remote, {
		sdp: msg.body
		,'content-type' : msg.get('content-type').type 
		,tag: msg.get('to').tag
		,user: msg.get('contact').url.user
		,signaling_address: msg.get('contact').url.host
		,signaling_port: msg.get('contact').url.port || 5060
	}) ;
	this.local.tag = msg.get('from').tag ;
}

SipDialog.prototype.connect = function( req ) {
	var msg = req.msg ;

	if( req.method === 'ACK' ) {
		this.local.tag = req.get('to').url.tag ;
		this.times.connect_time = req.msg.time ;	
		this.state = SipDialog.STABLE ;
	}
}

SipDialog.prototype.request = function( method, opts, callbacks ) {
	var self = this ;
	var requestMethod = method.toLowerCase() ;

	if( 'undefined' === typeof(opts) ) {
		callbacks = [] ;
		opts = {} ;
	}
	else if( typeof opts === 'function' ) {
		callbacks = _.flatten( Array.prototype.slice.call( arguments, 1) ) ;
		opts = {} ;
	}
	else callbacks = _.flatten( Array.prototype.slice.call( arguments, 2) );

	merge( opts, {
		session: this.session
		,headers: {
			'call-id': this.call_id
		}
	}) ;

	/* set up callbacks so they are called in the context of the dialog object as 'this' */
	this.app.siprequest[requestMethod]( opts, _.map( callbacks, function( fn) { return _.bind( fn, this ); }, this) ) ;
}

SipDialog.prototype.terminate = function(cb) {
	this.request('bye', cb) ;
}