var AbstractCommand = require('./abstract-command') 
,Send = require('./send')
,Exit = require('./exit')
,util = require('util') ;

exports = module.exports = Noinput ;

Noinput.attributes = [];
Noinput.children = [{name:'send', Klass: Send},{name:'exit', Klass: Exit}] ;

function Noinput( opts ) {
	AbstractCommand.call( this, 'noinput', opts, Noinput.attributes, Noinput.children ) ;
}
util.inherits(Noinput, AbstractCommand);
