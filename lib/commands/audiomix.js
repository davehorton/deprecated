var AbstractCommand = require('./abstract-command') 
,Asn = require('./asn')
,Fmn = require('./fmn')
,Nloudest = require('./nloudest')
,util = require('util')

exports = module.exports = Audiomix ;

Audiomix.attributes = ['id','samplerate','cvd:cascade','cvd:collocate-conn','collocate-method','segregate-conf','segregate-method'] ;
Audiomix.children = [{name: 'asn', Klass: Asn}, {name:'fmn', Klass:Fmn}, {name:'n-loudest', Klass: Nloudest}] ;

function Audiomix( opts ) {

	AbstractCommand.call(this, 'audiomix', opts, Audiomix.attributes, Audiomix.children) ;

}

util.inherits(Audiomix, AbstractCommand);
