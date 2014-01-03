var AbstractCommand = require('./abstract-command') 
,util = require('util')

exports = module.exports = Nloudest ;

Nloudest.attributes = ['n','h','tc'] ;
Nloudest.children = [] ;

function Nloudest( opts ) {

	AbstractCommand.call(this, 'n-loudest', opts, Nloudest.attributes, Nloudest.children) ;

}

util.inherits(Nloudest, AbstractCommand);
