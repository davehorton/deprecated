var Audio = require('./audio') 
,AbstractCommand = require('./abstract-command') 
,Send = require('./send')
,Exit = require('./exit')
,util = require('util') ;

exports = module.exports = Record ;


Record.attributes = ['id','append','dest','format','maxtime','cvd:pre-speech','cvd:post-speech','termkey','cvd:bitrate','cvd:mpi','picture-size'] ;
Record.children = [{name: 'recordexit', Klass: RecordExit}] ;


function Record( opts ) {
	AbstractCommand.call(this, 'record', opts, Record.attributes, Record.children) ;
}
util.inherits(Record, AbstractCommand);

// recordexit only appears as a child of play
RecordExit.attributes = [];
RecordExit.children = [{name:'send', Klass: Send},{name:'exit', Klass: Exit}] ;

function RecordExit( opts ) {
	AbstractCommand.call( this, 'recordexit', opts, RecordExit.attributes, RecordExit.children ) ;
}
util.inherits(RecordExit, AbstractCommand);
