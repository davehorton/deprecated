var AbstractCommand = require('./abstract-command') 
,Stream = require('./stream')
,util = require('util') ;

exports = module.exports = Modifystream ;

Modifystream.attributes = ['id1','id2','mark'] ;
Modifystream.children = [{name:'stream', Klass: Stream}] ;

function Modifystream( opts ) {
	if( !opts.target ) throw new Error('Modifystream: opts.target is required') ;

	AbstractCommand.call(this, 'modifystream', opts, Modifystream.attributes, Modifystream.children) ;
}

util.inherits(Modifystream, AbstractCommand);
