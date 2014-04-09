var drachtio = require('drachtio')
,session = require('../..')
,RedisStore = require('drachtio-redis')() 
,config = require('../fixtures/config') ;

var app = module.exports = drachtio() ;

app.connect( config.connect_opts ) ;

var sessionStore = new RedisStore({host: 'localhost'}) ;
app.use(session({store: sessionStore, app:app})) ;


app.invite(function(req, res){
    req.session.user='jack jones' ;
	res.send( 200,{
		body: config.sdp
	}) ;
}) ;

