var AbstractCommand = require('./abstract-command') 
,util = require('util')

exports = module.exports = Root ;

Root.attributes = ['size','backgroundcolor','cvd:codec','cvd:bandwidth','cvd:mpi','cvd:bpp','cvd:profile-level-id',''] ;
Root.children = [] ;

function Root( opts ) {

	AbstractCommand.call(this, 'root', opts, Root.attributes, Root.children) ;

}

util.inherits(Root, AbstractCommand);
