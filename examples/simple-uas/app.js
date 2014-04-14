var drachtio = require('drachtio')
,session = require('../..')
,RedisStore = require('drachtio-redis')() 
,assert = require('assert')
,config = require('../fixtures/config') ;

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

var sessionStore = new RedisStore({host: 'localhost'}) ;
//app.use(session({store: sessionStore, app:app})) ;
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


