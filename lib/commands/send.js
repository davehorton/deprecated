var AbstractCommand = require('./abstract-command') 
,util = require('util') ;

exports = module.exports = Send ;

Send.attributes = ['target','event','namelist'] ;
Send.children = [] ;

function Send( opts ) {
	AbstractCommand.call(this, 'send', opts, Send.attributes, Send.children ) ;
}

util.inherits(Send, AbstractCommand);
