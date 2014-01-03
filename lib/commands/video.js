var AbstractCommand = require('./abstract-command') 
,util = require('util') ;

exports = module.exports = Video ;


Video.attributes = ['uri'] ;
Video.children = [] ;


function Video( opts ) {
	AbstractCommand.call(this, 'video', opts, Video.attributes, Video.children) ;
}
util.inherits(Video, AbstractCommand);

// recordexit only appears as a child of play
VideoExit.attributes = [];
VideoExit.children = [{name:'send', Klass: Send},{name:'exit', Klass: Exit}] ;

function VideoExit( opts ) {
	AbstractCommand.call( this, 'recordexit', opts, VideoExit.attributes, VideoExit.children ) ;
}
util.inherits(VideoExit, AbstractCommand);
