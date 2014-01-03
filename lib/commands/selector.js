var AbstractCommand = require('./abstract-command') 
,util = require('util')

exports = module.exports = Selector ;

Selector.attributes = ['id','method','si','speakersees'] ;
Selector.children = [] ;

function Selector( opts ) {
	if( 0 == this.children.length ) {
		var Root = require('./Root') ;	//circular dependency so we require it late
		this.children.push({name: 'root', Klass: Root}) ;
	}
	AbstractCommand.call(this, 'selector', opts, Selector.attributes, Selector.children) ;

}

util.inherits(Selector, AbstractCommand);
