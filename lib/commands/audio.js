var AbstractCommand = require('./abstract-command') 
,util = require('util')

exports = module.exports = Audio ;

Audio.attributes = ['uri','xml:lang'] ;
Audio.children = [] ;

function Audio( opts ) {
	if( !opts.uri ) throw new Error('uri is required element in audio') ;

	AbstractCommand.call(this, 'audio', opts, Audio.attributes, Audio.children) ;

}

util.inherits(Audio, AbstractCommand);
