var AbstractCommand = require('./abstract-command') 
,Audiomix = require('./audiomix')
,Videolayout = require('./videolayout')
,util = require('util') ;

exports = module.exports = Modifyconference ;

Modifyconference.attributes = ['id','control','mark'] ;
Modifyconference.children = [{name:'audiomix', Klass: Audiomix},{name:'videolayout', Klass: Videolayout}] ;

function Modifyconference( opts ) {
	if( !opts.target ) throw new Error('Modifyconference: opts.target is required') ;

	AbstractCommand.call(this, 'modifyconference', opts, Modifyconference.attributes, Modifyconference.children) ;
}

util.inherits(Modifyconference, AbstractCommand);
