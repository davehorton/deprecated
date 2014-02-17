var AbstractCommand = require('./abstract-command') 
,Stream = require('./stream')
,util = require('util') ;

exports = module.exports = Unjoin ;

Unjoin.attributes = ['id1','id2','cascade','lenient','mark'] ;
Unjoin.children = [{name:'stream', Klass: Stream}] ;

function Unjoin( opts ) {
	AbstractCommand.call(this, 'unjoin', opts, Unjoin.attributes, Unjoin.children ) ;
}

util.inherits(Unjoin, AbstractCommand);
