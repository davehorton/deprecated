# drachtio-session [![Build Status](https://secure.travis-ci.org/davehorton/drachtio-session.png)](http://travis-ci.org/davehorton/drachtio-session)

[![drachtio logo](http://www.dracht.io/images/definition_only-cropped.png)](http://dracht.io/)

drachtio-session adds session storage capability for applications built using [drachtio](https://github.com/davehorton/drachtio).

```js
var app = require('drachtio')()
,session = require('drachtio-session')
,RedisStore = require('drachtio-redis')() 
,config = require('../fixtures/config') ;

app.connect( config.connect_opts ) ;

app.use(session({store: new RedisStore({host: 'localhost'}), app:app})) ;

app.invite(function(req, res){
    req.session.user='jack jones' ;
	res.send( 200,{
		body: config.sdp
	}) ;
}) ;

app.bye(function(req, res){
    res.send(200) ;

    assert(req.session.user === 'jack jones') ;
 }) ;
```

## Establishing a session store
An application must establish a session store by using the drachtio-session middleware, as shown above.  By doing so, each SIP dialog
that gets created will have an associated session, into which the application can save variables. A session will get created for 
each incoming INVITE that establishes a SIP dialog.  This session -- and any variables stored therein -- will then be available on any
subsequent requests received within that dialog.

By default, each outgoing new INVITE that is sent by an application will also establish a new session; however, as we shall see in the 
next section, this can be overridden to enable multiple SIP dialogs to share a single unified session object.

## Using an existing session when sending a new SIP INVITE

Many sip applications act as a back-to-back user agent; receiving an incoming SIP INVITE and then generating a new outbound SIP INVITE, and managing two different SIP dialogs.  Such a scenario calls for a unified session object that can be accessible from a request or an event on either of the SIP dialogs.  To enable using an existing session when creating a new SIP INVITE, simply provide a session property on the `opts` property of the `app.siprequest` method.

```js
app.use(session({store: sessionStore, app:app})) ;

app.invite( function(req, res) {
	req.session.uasCallId = req.get('call-id') ;

	// send an INVITE but don't create a new session
	app.siprequest( config.remote_uri2, {
		body: req.body
		,session: req.session
	}, function( err, uacReq, uacRes ) {
        if( uacRes.statusCode >= 200 ) {
            uacRes.ack() ;
                       
            uacReq.session.uacCallId = uacReq.get('call-id') ;
		}
        res.send( uacRes.statusCode, {
            body: uacRes.body
        }) ;
	}) ;
}) ;

// with one session object, we can get the call-id from the opposite call
app.bye(function(req, res){
    res.send(200) ;

    var otherCallId = req.get('call-id') === req.session.uacCallId ? 
    	req.session.uasCallId : req.session.uacCallId ;

	// hang up the other leg
    app.siprequest.bye({headers:{'call-id': otherCallId}}) ;
 }) ;

```