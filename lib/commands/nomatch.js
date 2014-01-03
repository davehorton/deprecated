var AbstractCommand = require('./abstract-command') 
,Send = require('./send')
,Exit = require('./exit')
,util = require('util') ;

exports = module.exports = Nomatch ;

Nomatch.attributes = [];
Nomatch.children = [{name:'send', Klass: Send},{name:'exit', Klass: Exit}] ;

function Nomatch( opts ) {
	AbstractCommand.call( this, 'nomatch', opts, Nomatch.attributes, Nomatch.children ) ;
}
util.inherits(Nomatch, AbstractCommand);
