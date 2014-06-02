var drachtio = require('drachtio')
,session = require('../..')
,assert = require('assert')
,config = require('../fixtures/config')
,debug = require('debug')('simple-uas') ;

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

app.use(session({app:app})) ;

app.invite(function(req, res){
    req.session.user='jack jones' ;
	res.send( 200,{
		body: config.sdp
	}) ;
}) ;

app.bye(function(req, res){
    res.send(200) ;

    assert(req.session.user === 'jack jones') ;

    //for test harness in test/acceptance/simple-uas.js
    app.emit('session', req.session) ;
 }) ;


