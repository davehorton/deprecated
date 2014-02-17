var AbstractCommand = require('./abstract-command') 
,Stream = require('./stream')
,util = require('util') ;

exports = module.exports = Join ;

Join.attributes = ['id1','id2','cascade','lenient','mark'] ;
Join.children = [{name:'stream', Klass: Stream}] ;

function Join( opts ) {
	AbstractCommand.call(this, 'join', opts, Join.attributes, Join.children ) ;
}

util.inherits(Join, AbstractCommand);
