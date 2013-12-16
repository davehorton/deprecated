var Play = require('../lib/commands/play')
,Dtmf = require('../lib/commands/dtmf')
,DialogStart = require('../lib/commands/dialogstart')
,debug = require('debug')('command-formatting') ;

var play = new Play({
	barge: true
	,cleardb: false
	,audio: {uri: 'file://provisioned/select_language.wav'}
	,playexit: {
		send: {
			event: 'app.playDone'
			,namelist: 'play.amt play.end'
		}
	}
}) ;

var xml = play.toXML() ;

debug('play xml is %s', xml) ;


var dtmf = new Dtmf({
	cleardb:true
	,fdt: '6s'
	,idt: '4s'
	,edt: '2s'
	,pattern: {
		digits: 'min=1;max=4;rtk=#'
	}
	,dtmfexit: {
		send: {
			event: 'app.dtmfDone'
			,namelist: 'dtmf.digits dtmf.end'
		}
	}
}) ;

xml = dtmf.toXML() ;

debug('dtmf xml is %s', xml) ;

var dialogstart = new DialogStart({
			target: 'conn:foobar'
			,type: 'application/moml+xml'
			,name: 'play1'
			,play: {
				barge: true
				,cleardb: false
				,audio: {
					uri:'file://provisioned/4300.wav'
				}
				,playexit: {
					send: {
						target:'source'
						,event:'app.playDone'
						,namelist: 'play.amt play.end'
					}
				}
			}
			,dtmf: {
				fdt: '10s'
				,idt: '6s'
				,edt: '6s'
				,cleardb: false
				,pattern: {
					digits: 'min=4;max=10;rtk=#'
					,format: 'moml+digits'
				}
				,dtmfexit: {
					send: {
						target:'source'
						,event:'app.dtmfDone'
						,namelist: 'dtmf.digits dtmf.end'
					}
				}
			}
		}) ;
xml = dialogstart.toXML(true) ;
debug('dialogstart xml is %s', xml) ;