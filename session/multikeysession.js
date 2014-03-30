/**
 * @namespace utils/MultiKeySession
 */
 var uuid = require('node-uuid')
 ,_ = require('underscore')
 ,merge = require('utils-merge')
 ,async = require('async')
 ,crc16 = require('crc').crc16
 ,debug = require('debug')('drachtio:mksession') ;


function hash(sess) { 
	return crc16(JSON.stringify(sess, function(key, val){
		return val;
	}));
}

/**
 * A modules that exports a session store that can be retrieved by one or more keys
 * @module utils/MultiKeySession
 */
module.exports = MultiKeySession ;

MultiKeySession.resolvers = [Date] ;

const prefix = 'mks:' ;

/**
 * A MultiKeySession represents a collection of data elements that an application needs to persist between Javascript
 * callbacks, and which are related to each other from the standpoint of the application.  Each data element in the session
 * has a name and a value, and optionally may have a globally unique string identifier (GUID).  A MultiKeySession can be 
 * retrieved from the underlying storage by providing any one of the GUIDs in the data collection (hence, "multi-keyed").
 * <br/>
 * <br/>
 * An example use of a MultiKeySession would be for an application where for each caller a SipDialog, a MediaEndpoint, and some 
 * caller-specific identification are kept.  Upon the occurrence of an event on either the SipDialog, or the MediaEndpoint, 
 * the application may need to retrieve all the relevant data (for example, when a SipDialog is terminated, the application may 
 * want to act on the MediaEndpoint object in order to release it).  The MultiKeySession in this example would include 3 data elements; 
 * two of which would have GUIDs (the SipDialog and the MediaEndpoint), and one which would not (the user data). All data could be 
 * retrieved either by using the GUID of the SipDialog, or the MediaEndpoint.
 *
 * @constructor
 * @param {Object} opts 
 * @access public
 */
function MultiKeySession(opts) {
	var self = this;

	if( !opts.store ) throw new Error('MultiKeySession: opts.store is required') ;

	opts.ttl = opts.ttl || 86400 ;

	Object.defineProperty( this, '_store', {value: opts.store}) ;

	this._uuid = opts.uuid ;

	if( !this._uuid ) {
		this._uuid = 'mks:session:' + uuid.v1() ;
		this._keyData = {} ;
		this._session = new MultiKeySession.SessionProto(this) ;	
		this._session.mks = this ;
	}
	else {
		if(!opts.uuid || !opts.keyData || !opts.session ) {
			throw new Error('MultiKeySession: opts.uuid, .keyData and .session are required when retrieving MultiKeySession from storage') ;			
		}
		this._session = new MultiKeySession.SessionProto(this) ; 
		merge( this._session, opts.session ) ;

		['_uuid','_keyData'].forEach( function(prop) {
			self[prop] = opts[prop.slice(1)] ;
		}) ;
	}
	this._lastSavedHash = hash(this._session) ;

	['_store','_client','_uuid','_keyData','_session'].forEach( function(prop) {
		self.__defineGetter__(prop.slice(1), function(){
			return self[prop] ;
		});
	});

	self.__defineGetter__('keyCount', function() { return Object.keys( this._keyData ).length ; } ) ;

	/** this allows a user to do e.session = {foo: bar}; i.e. replacing the session object entirely */
	self.__defineSetter__('session', function(val) {
		this._session = new SessionProto(self) ;
		merge( this._session, val ) ;
	}) ;

	self.__defineGetter__('keys', function(){
		return Object.keys( this._keyData ) ;
	}) ;
}


/**
 * Adds a key to the MultiKeySession
 * @param {Resource|string} resource - Resource or a globally unique identifier for the key 
 *
 * @return {MultiKeySession} for chaining
 */
MultiKeySession.prototype.set = function( resource ) {

	var isUUID = typeof resource.sessionID === 'undefined' ;
	var sid = isUUID ? prefix + resource : prefix  + resource.sessionID ;

	this._keyData[sid] = {
		saved: false
		,resource: (isUUID ? null : resource)
	} ;
}

/**
 * get the resource identified by the globally unique identifier for the key
 * @param  {string} sessionID - unique key identifier
 * @return {Resource|undefined}           the resource to return
 */
MultiKeySession.prototype.get = function( sessionID ) {
	var sid = prefix + sessionID ;
	if( sid in this._keyData ) return this._keyData[sid].resource ;
}

/**
 * remove the specified key; if there are then no more keys, remove the underlying store
 * @param {Resource|string} resource - Resource or a globally unique identifier for the key 
* @return {MultiKeySession}           for chaining
 */
MultiKeySession.prototype.del = function( resource, cb ) {
	var self = this ;
	var store = this._store ;

	var isUUID = typeof resource.sessionID === 'undefined' ;
	var sid = isUUID ? prefix + resource : prefix + resource.sessionID ;

	delete this._keyData[sid] ;
	var keyCount = this.keyCount ;
	debug('MultiKeySession#del: removing key %s associated with uuid %s, there are %d keys remaining', sid, this._uuid, keyCount) ;

	// delete key and, if necessary, underlying session
	async.parallel( [
		function destroyKey(callback) {
			store.destroy( sid, function(){
				callback(null) ;
			})
		}
		,function destroySessionIfNoKeys(callback) {
			if( 0 === keyCount ) {
				store.destroy( self._uuid, function() {
					debug('removed underlying session with uuid %s', self._uuid) ;
					callback(null) ;
				}) ;
			}
			else callback(null) ;
		}
	], function(){
		if( cb ) cb() ;
	}) ;
	return this ;
}

/**
 * return true if data has been modified since last save
 * @return {Boolean} true if data has been modified since saved
 */
MultiKeySession.prototype.isDirty = function(){

	/* have any keys been modified ? */
	if( _.find( _.values(this._keyData), function( kd ) { return false === kd.saved ; })) {
		//debug('MultiKeySession#isDirty: keys have been modified')
		return true ;
	}

	/* has session been modified */
	var now = hash(this._session) ;
	//debug('MultiKeySession#isDirty: current hash %d, previous was %d', now, this._lastSavedHash) ;
	if( now !== this._lastSavedHash ) {
		//debug('MultiKeySession#isDirty: session data has been modified')
		return true ;
	}

	return false ;
}
/**
 * This callback is invoked when a MultiKeySession is saved.
 *
 * @callback sessionCallback
 * @param {string} err - describes error, if any, or null otherwise
 * @param {string} res - response string
 */

/**
 * Saves the MultiKeySession to the underlying store
 * 
 * @param  {sessionCallback} [cb] - the callback that is invoked when the operation has completed
 * @return {MultiKeySession}      
 */		
MultiKeySession.prototype.save = function( cb ) {
	var self = this ;
	var store = this._store ;

	if( 0 === this.keyCount ) {
		debug('MultiKeySession#save: no keys have been added') ;
		if( cb ) setImmediate( function() { cb() ; }) ;
		return this;
	}

	/* don't save if the object hasn't changed since last save */
	if( !this.isDirty() ) {
		debug('not saving; not dirty') ;
		if( cb ) setImmediate(function() { cb() ; }) ;
		return this ;
	}

	debug('saving session with uuid %s and %d keys', this._uuid, this.keyCount ) ;

	/* prepare mks.session for re-hydration as well, of any embedded objects that have custom constructors */
	var liveSpecimens = {} ;

	/* ..being the opposite of hydrate */
	function dessicate( obj ) {
		if( 'function' === typeof obj ) return ;
		
		if( _.isArray( obj ) ) _.each( obj, function( el, idx ) { dessicate( el ) ; }) ;

		if( _.isObject( obj ) ) {
			_.each( obj, function( v, k, l) {
				if( _.isObject(v) && !_.isFunction(v) && v.__proto__ !== null && v.__proto__.constructor.name !== 'Object') {
					var instanceData = JSON.stringify(v) ;
					var h = hash(instanceData) ;
					liveSpecimens[h] = l[k] ;
					l[k] = {
						__constructorName__: v.__proto__.constructor.name
						,__instanceData__: instanceData
					}
				}
				else dessicate(v) ;
			}) ;
		}
		return ;
	}

	/**
	 * Once dessicated, we have changed the object in place; this restores it to its previous state
	 * so the caller doesn't get unanticipated side affects after saving
	 */

	function undessicate( obj ) {
		if( _.isFunction(obj) ) return ;
		if( _.isArray( obj ) ) _.each( obj, function( el, idx ) { undessicate( el ) ; }) ;

		if( _.isObject( obj ) ) {
			_.each( obj, function( v, k, l ) {
				if( _.isObject(v) && '__constructorName__' in v && '__instanceData__' in v ) {
					var h = hash(v['__instanceData__']) ;
					l[k] = liveSpecimens[h] ;
				} 
				else undessicate(v) ;
			}) ;
		}
	}

	/* create an array of key updates */
	var inserts = [] ;
	_.each( this._keyData, function( value, key, list ) {
		if( !value.saved ) {
			inserts.push( function(callback) {
				store.set( key, self._uuid, function() {
					callback(null);
				}) ;
			}) ;
			value.saved = true ;
		}
	}) ;

	/* create the object to save that uuid points to */
	var size = 0 ;
	var mks = Object.create(null) ;
	mks.keys = {} ;
	_.each( self._keyData, function( value, key, list ){
		mks.keys[key] = {} ;
		if( value.resource ) {
			mks.keys[key].constructorName = value.resource.__proto__.constructor.name ;
			mks.keys[key].instanceData = JSON.stringify( value.resource );
		}
	}) ;

	mks.session = this._session ;
	size = Object.keys(mks.session).length ;
	if( size > 0 ) dessicate(mks.session) ;

	var arr = inserts.concat( function(callback) {
		store.set( self._uuid, mks, function() {
			callback(null);
		}) ;
	}) ;

	async.parallel( arr, function() {
		if( cb ) cb(null);
	}) ;

	if( size > 0 ) undessicate(mks.session) ;

	this._lastSavedHash = hash(this._session) ;

	return this ;
}


/**
 * Removes all data from the underlying storage
 * @param  {sessionCallback} cb - callback 
 */
MultiKeySession.prototype.destroy = function(cb) {
	var self = this ;
	var store = this._store ;

	/* remove the keys */
	var array = _.map( this._keyData, function( obj, sessionID ) {return _.extend({}, obj, {sessionID: sessionID});}) ;
	async.each( array, function(key, callback) {
		store.destroy( prefix + key.sessionID ) ;
	}) ;
	this._keyData = {} ;

	store.destroy( this._uuid, cb ) ;
}

/**
 * Removes all stored data and closes the client connection 
 * @param  {sessionCallback} cb - callback
 */
MultiKeySession.prototype.close = function( cb ) {
	var self = this ;
	this.destroy( function(err, res) {
		if( cb ) cb() ;
	}) ;
}

/**
 * This callback is invoked when a MultiKeySession is retrieved.
 *
 * @callback sessionRetrieveCallback
 * @param {string} err - describes error, if any, or null otherwise
 * @param {MultiKeySession} session - the MultiKeySession that was retrieved
 */

/**
 * @memberOf MultiKeySession
 * @static
 *
 * Retrieves a session given the GUID of any one of the data members
 *
 * @param {String} id - GUID of one of the data objects contained in the MultiKeySession
 * @param {sessionRetrieveCallback} cb - the callback that returns the MultiKeySession
 */
MultiKeySession.loadFromStorage = function( opts, id, cb ) {
	if( !opts.store ) throw new Error('MultiKeySession#loadFromStorage opts.store is required') ;
	var store = opts.store ;
	var resolvers = _.uniq( (opts.resolvers || []).concat( MultiKeySession.resolvers ) );

	var resolverMap = {}
	resolvers.forEach( function( ctor ){
		resolverMap[ ctor.name ] = ctor ;
	}) ;

	function hydrate( obj ) {
		if( _.isFunction(obj) ) return ;
		
		if( _.isArray( obj ) ) _.each( obj, function( el, idx ) { hydrate( el ) ; }) ;

		if( _.isObject( obj ) ) {
			_.each( obj, function( v, k, l ) {
				if( _.isObject(v) && '__constructorName__' in v && '__instanceData__' in v ) {
					var object = JSON.parse( v['__instanceData__']);
					if( v['__constructorName__'] in resolverMap ) {
						var F = resolverMap[v['__constructorName__']] ;
						object = new F(object) ;
					}
					l[k] = object ;
				} 
				else hydrate(v) ;
			}) ;
		}
	}

	store.get( prefix + id, function(err, uuid) {
		if( err ) return cb(err) ;
		if( !uuid ) return cb('MultiKeySession#loadFromStorage: uuid not found for key: ' + (prefix + id)) ;

		var keyData = {} ;

		store.get( uuid, function( err, mks ) {
			if( err ) return cb(err) ;
			if( !mks ) return cb('MultiKeySession#loadFromStorage: session not found for uuid ' + uuid) ;

			_.each( mks.keys, function( v, k ){
				/* re-hydrate the object, if we can */
				var F = v.constructorName in resolverMap ? resolverMap[v.constructorName] : null ;
				keyData[k] = {} ;
				if( v.instanceData ) {
					keyData[k].resource = F ? new F(JSON.parse(v.instanceData)) : JSON.parse(v.instanceData);
					keyData[k].saved = true ;
				}
			}) ;

			hydrate( mks.session ) ;

			var mks =  new MultiKeySession({
				keyData: keyData
				,session: mks.session
				,uuid: uuid
				,store: store
			}) ;

			/* for every object that inherits from Resource -- whether a key or session data -- attach mks */
			_.each( mks.keys, function( key ) {
				var obj = mks.keyData[key].resource ;
				if( obj && typeof obj.attachSession === 'function' ) obj.attachSession(mks) ;
			}) ;

			function attachSession( obj ) {
				for( key in obj ) {
					if( obj.hasOwnProperty(key) ) {
						if( typeof obj[key].attachSession === 'function' ) obj[key].attachSession(mks) ;
						if( typeof obj[key] === 'object' ) attachSession( obj[key]) ;
					}
				}
			}

			attachSession( mks.session ) ;

			cb( null, mks) ;
		})
	}) ;
}

MultiKeySession.addResolvers = function( resolvers ) {
	MultiKeySession.resolvers = _.uniq( MultiKeySession.resolvers.concat( _.isArray(resolvers) ? resolvers : [ resolvers ] ) );
}


MultiKeySession.SessionProto = SessionProto ;

function SessionProto(mks) {
	Object.defineProperty(this,'mks',{
		get: function() { return mks; }
	}) ;
}

SessionProto.prototype.save = function(cb) {
	this.mks.save( cb ) ;
}



