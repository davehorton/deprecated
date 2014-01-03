var AbstractCommand = require('./abstract-command') 
,util = require('util')

exports = module.exports = Asn ;

Asn.attributes = ['ri','asth'] ;
Asn.children = [] ;

function Asn( opts ) {

	AbstractCommand.call(this, 'asn', opts, Asn.attributes, Asn.children) ;

}

util.inherits(Asn, AbstractCommand);
