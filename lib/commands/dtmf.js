var AbstractCommand = require('./abstract-command') 
,Send = require('./send')
,Exit = require('./exit')
,util = require('util') ;

exports = module.exports = Dtmf ;

Dtmf.attributes = ['id','cleardb','fdt','idt','edt','iterate','ldd'] ;
Dtmf.children = [{name: 'pattern', Klass: Pattern},{name:'dtmfexit', Klass: DtmfExit}] ;

function Dtmf( opts ) {
	AbstractCommand.call(this, 'dtmf', opts, Dtmf.attributes, Dtmf.children) ;
}

util.inherits(Dtmf, AbstractCommand);

// pattern only appears as child of dtmf
Pattern.attributes = ['digits','format'] ;
Pattern.children = [{name:'send', Klass: Send},{name:'exit', Klass: Exit}] ;

function Pattern( opts ) {
	if( !opts.digits ) throw new Error('pattern.digits is required') ;

	AbstractCommand.call(this, 'pattern', opts, Pattern.attributes,  Pattern.children) ;
}

util.inherits(Pattern, AbstractCommand);

// dtmfexit only appears as a child of dtmf
DtmfExit.attributes = [];
DtmfExit.children = [{name:'send', Klass: Send},{name:'exit', Klass: Exit}] ;

function DtmfExit( opts ) {
	AbstractCommand.call( this, 'dtmfexit', opts, DtmfExit.attributes, DtmfExit.children ) ;
}
util.inherits(DtmfExit, AbstractCommand);
