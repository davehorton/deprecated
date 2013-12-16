var AbstractCommand = require('./abstract-command') 
,util = require('util') ;

exports = module.exports = Exit ;

Exit.attributes = ['target','event','namelist'] ;
Exit.children = [] ;

function Exit( opts ) {
	AbstractCommand.call(this, 'exit', opts, Exit.attributes, Exit.children ) ;
}

util.inherits(Exit, AbstractCommand);
