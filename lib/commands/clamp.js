var AbstractCommand = require('./abstract-command') 
,util = require('util') ;

exports = module.exports = Clamp ;

Clamp.attributes = ['dtmf','tone'] ;
Clamp.children = [] ;

function Clamp( opts ) {
	AbstractCommand.call(this, 'clamp', opts, Clamp.attributes, Clamp.children ) ;
}

util.inherits(Clamp, AbstractCommand);
