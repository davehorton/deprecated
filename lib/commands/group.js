var AbstractCommand = require('./abstract-command') 
,Play = require('./play')
,Record = require('./record')
,Dtmf = require('./ftmf')
,Send = require('./send')
,Exit = require('./exit')
//TODO: speech
,util = require('util') ;

exports = module.exports = Group ;

Group.attributes = ['topology'] ;
Group.children = [{name:'play', Klass: Play}, {name:'record', Klass: Record},{name: 'groupexit', Klass: GroupExit}] ;

function Group( opts ) {
	AbstractCommand.call(this, 'group', opts, Group.attributes, Group.children ) ;
}

util.inherits(Group, AbstractCommand);

// groupexit appears only as child of group
Groupexit.attributes = [] ;
Groupexit.children = [{name:'exit', Klass: Exit}, {name:'send', Klass: Send}] ;

function Group( opts ) {
	AbstractCommand.call(this, 'groupexit', opts, Groupexit.attributes, Groupexit.children ) ;
}

util.inherits(Groupexit, AbstractCommand);
