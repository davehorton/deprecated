var AbstractCommand = require('./abstract-command') 
,Send = require('./send')
,Exit = require('./exit')
,Play = require('./play')
,Dtmf = require('./dtmf')
,util = require('util') ;

exports = module.exports = DialogStart ;

DialogStart.attributes = ['target','type','name','mark'] ;
DialogStart.children = [{name:'play', Klass: Play},{name: 'dtmf', Klass: Dtmf},{name:'send',Klass:Send},{name:'exit',Klass:Exit}] ;//TODO: record, videooverlay

function DialogStart( opts ) {
	if( !opts.target ) throw new Error('DialogStart: opts.target is required') ;

	AbstractCommand.call(this, 'dialogstart', opts, DialogStart.attributes, DialogStart.children) ;
}

util.inherits(DialogStart, AbstractCommand);
