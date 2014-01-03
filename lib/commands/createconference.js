var AbstractCommand = require('./abstract-command') 
,Audiomix = require('./audiomix')
,Videolayout = require('./videolayout')
,util = require('util') ;

exports = module.exports = Createconference ;

Createconference.attributes = ['name','deletewhen','term','control','mark'] ;
Createconference.children = [{name:'audiomix', Klass: Audiomix},{name:'videolayout', Klass: Videolayout}] ;

function Createconference( opts ) {
	if( !opts.target ) throw new Error('Createconference: opts.target is required') ;

	AbstractCommand.call(this, 'createconference', opts, Createconference.attributes, Createconference.children) ;
}

util.inherits(Createconference, AbstractCommand);
