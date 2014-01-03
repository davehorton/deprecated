var AbstractCommand = require('./abstract-command') 
,util = require('util') ;

exports = module.exports = Gain ;

Gain.attributes = ['amt','agc','tgtlevel','maxgain'] ;
Gain.children = [] ;

function Gain( opts ) {
	AbstractCommand.call(this, 'gain', opts, Gain.attributes, Gain.children ) ;
}

util.inherits(Gain, AbstractCommand);
