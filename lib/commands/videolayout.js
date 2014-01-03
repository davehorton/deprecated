var AbstractCommand = require('./abstract-command') 
,Root = require('./root')
,Selector = require('./selector')
,Stream = require('./stream')
,util = require('util')

exports = module.exports = Videolayout ;

Videolayout.attributes = ['id','type','cvd:format','cvd:borderwidth','cvd:bordercolor','cvd:activeborder-width','cvd:activeborder-color'
	,'cvd:activeborder-si','cvd;activeborder-threshold','cvd:collocate-conn','cvd:collocate-method',''] ;
Videolayout.children = [{name: 'root', Klass: Root}, {name:'selector', Klass:Selector}, {name:'stream', Klass: Stream}] ;

function Videolayout( opts ) {

	AbstractCommand.call(this, 'videolayout', opts, Videolayout.attributes, Videolayout.children) ;

}

util.inherits(Videolayout, AbstractCommand);
