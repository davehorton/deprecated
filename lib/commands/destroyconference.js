var AbstractCommand = require('./abstract-command') 
,Audiomix = require('./audiomix')
,Videolayout = require('./videolayout')
,util = require('util') ;

exports = module.exports = Destroyconference ;

Destroyconference.attributes = ['id','mark'] ;
Destroyconference.children = [{name:'audiomix', Klass: Audiomix},{name:'videolayout', Klass: Videolayout}] ;

function Destroyconference( opts ) {
	if( !opts.id ) throw new Error('Destroyconference: opts.id is required') ;

	AbstractCommand.call(this, 'destroyconference', opts, Destroyconference.attributes, Destroyconference.children) ;
}

util.inherits(Destroyconference, AbstractCommand);
