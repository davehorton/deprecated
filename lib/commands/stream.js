var AbstractCommand = require('./abstract-command') 
Clamp = require('./clamp')
Gain = require('./gain')
,util = require('util') ;

exports = module.exports = Stream ;

Stream.attributes = ['media','dir','override','display','cvd:cascade',''] ;
Stream.children = [{name: 'clamp', Klass: Clamp}, {name: 'gain', Klass: Gain}] ;

function Stream( opts ) {
	AbstractCommand.call(this, 'stream', opts, Stream.attributes, Stream.children ) ;
}

util.inherits(Stream, AbstractCommand);
