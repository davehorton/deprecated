var AbstractCommand = require('./abstract-command') 
,util = require('util')

exports = module.exports = Fmn ;

Fmn.attributes = ['ri','asth'] ;
Fmn.children = [] ;

function Fmn( opts ) {

	AbstractCommand.call(this, 'fmn', opts, Fmn.attributes, Fmn.children) ;

}

util.inherits(Fmn, AbstractCommand);
