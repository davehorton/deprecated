var Audio = require('./audio') 
,AbstractCommand = require('./abstract-command') 
,Send = require('./send')
,Exit = require('./exit')
,util = require('util') ;

exports = module.exports = Play ;


Play.attributes = ['id','interval','iterate','maxtime','offset','barge','cleardb','xml:lang','region','override'
	,'gain','agc','tgtlvl','maxgain','vo-id','start','end','aof'] ;
Play.children = [{ name: 'audio' ,Klass: Audio },{name: 'playexit', Klass: PlayExit}] ;


function Play( opts ) {
	AbstractCommand.call(this, 'play', opts, Play.attributes, Play.children) ;
}
util.inherits(Play, AbstractCommand);

// playexit only appears as a child of play
PlayExit.attributes = [];
PlayExit.children = [{name:'send', Klass: Send},{name:'exit', Klass: Exit}] ;

function PlayExit( opts ) {
	AbstractCommand.call( this, 'playexit', opts, PlayExit.attributes, PlayExit.children ) ;
}
util.inherits(PlayExit, AbstractCommand);

// var only appears as a child of play
Var.attributes = ['type','subtype','value','xml:lang']; //TODO: need to handle primary tag and subtag, which are ISO codes
Var.children = [] ;

function Var( opts ) {
	AbstractCommand.call( this, 'var', opts, Var.attributes, Var.children ) ;
}
util.inherits(Var, AbstractCommand);


