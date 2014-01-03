var AbstractCommand = require('./abstract-command') 
,util = require('util') ;

exports = module.exports = Dialogend ;

Dialogend.attributes = ['id','mark'];
Dialogend.children = [] ;

function Dialogend( opts ) {
	AbstractCommand.call( this, 'playexit', opts, Dialogend.attributes, Dialogend.children ) ;
}
util.inherits(Dialogend, AbstractCommand);
