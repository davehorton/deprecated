var AbstractCommand = require('./abstract-command') 
,DialogStart = require('./dialogstart')
,util = require('util') ;

exports = module.exports = Msml ;

Msml.attributes = ['version'] ;
Msml.children = [{name:'dialogstart', Klass: DialogStart}] ;

function Msml( opts ) {
	AbstractCommand.call(this, 'msml', opts, Msml.attributes, Msml.children ) ;
}

util.inherits(Msml, AbstractCommand);
