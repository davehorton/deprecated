var AbstractCommand = require('./abstract-command') 
,Send = require('./send')
,Exit = require('./exit')
,util = require('util')

exports = module.exports = Dtmfgen ;

Dtmfgen.attributes = ['id','digits','level','dur','interval'] ;
Dtmfgen.children = [] ;

function Dtmfgen( opts ) {
	if( !opts.uri ) throw new Error('uri is required element in audio') ;

	AbstractCommand.call(this, 'audio', opts, Dtmfgen.attributes, Dtmfgen.children) ;

}

util.inherits(Dtmfgen, AbstractCommand);

// playexit only appears as a child of play
DtmfgenExit.attributes = [];
DtmfgenExit.children = [{name:'send', Klass: Send},{name:'exit', Klass: Exit}] ;

function DtmfgenExit( opts ) {
	AbstractCommand.call( this, 'dtmfgenexit', opts, DtmfgenExit.attributes, DtmfgenExit.children ) ;
}
util.inherits(DtmfgenExit, AbstractCommand);
