var debug = require('debug')('msml:router') ;


exports = module.exports = Router ;

function Router(msml) {
	var self = this ;
	this.msml = msml ;
	this.middleware = function msmlrouter(req, res, next){
		self._dispatch(req, res, next);
	};
}

Router.prototype._dispatch = function(req, res, next){

	var method = req.method.toLowerCase() ;
	var event ;

	if( 'info' !== method || req.source !== 'network' || !req.msml || !(event = req.msml.getChild('event') ) ) return next() ;

	debug('dispatching %s', req.method );

	var dialogId = event.get('id') ;
	var dialog = this.msml.findDialog( dialogId ) ;
	if( !dialog ) return next() ;

	dialog.postEvent( event ) ;
}