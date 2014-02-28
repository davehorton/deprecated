var Msml = require('./lib/msml') 
, fs = require('fs')
, path = require('path')
, basename = path.basename 
, Router = require('./lib/router/router')
,redis = require('redis')
,Connection = require('./lib/connection')
,ControlChannel = require('./lib/controlchannel')
,Dialog = require('./lib/dialog')
,debug = require('debug')('msml') ;


exports = module.exports = createMsml;

createMsml.middleware = {};

function createMsml( app ) {

	if( createMsml.instance ) throw new Error('only a single msml instance is allowed') ;

	var msml = new Msml( app ) ;
	createMsml.instance = msml ;
	return msml;
};

/** add the classes we want to be able to rehydrate from storage */
var MultiKeySession = require('drachtio').MultiKeySession ;
MultiKeySession.addResolvers([Connection,ControlChannel,Dialog]) ;

var router = new Router(createMsml);

exports.__defineGetter__('router', function(){  
	return router.middleware ;
}) ;

createMsml.findDialog = function( id ) {
	return createMsml.instance.findDialog( id ) ;
}

/**
 * Auto-load bundled middleware with getters.
 */

fs.readdirSync(__dirname + '/lib/middleware').forEach(function(filename){
    if (!/\.js$/.test(filename)) return;
    var name = basename(filename, '.js');
    function load(){  return require('./lib/middleware/' + name); }
    exports.middleware.__defineGetter__(name, load);
    exports.__defineGetter__(name, load);
});
