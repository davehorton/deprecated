# drachtio

[![Build Status](https://secure.travis-ci.org/davehorton/drachtio.png)](http://travis-ci.org/davehorton/drachtio)

drachtio is an application framework designed to let developers easily integrate [SIP](http://www.ietf.org/rfc/rfc3261.txt) call and media processing features into their applications.  It acts as a client to the [dractio](https://github.com/davehorton/drachtio) server platform, and offers [express](http://expressjs.com/)-style middleware for managing SIP requests.

```js
var drachtio = require('drachtio') ;
var app = drachtio() ;

app.connect({host:'localhost', port: 8022, secret: 'cymru'}) ;

app.use( app.router ) ;

app.invite( function( req, res ) {
    res.send(486, {
        headers: {
            'user-agent': 'Drachtio rocksz'
        }
    }) ;
}) ;
```

## Connecting to the server

Since the sip transport is implemented by drachtio-server, a connection must be established to a drachtio-server in order to control the sip messaging.  The drachtio-server process listens by default on TCP port 8022 for connections from drachtio applications.

```js
app.connect({
    host:'localhost'
    ,port: 8022
    ,secret: 'cymru'
}, function( err, hostport ) {
    if( err ) console.err('failed to connect to drachtio-server: ' + err) ;
    else console.log('drachtio-server is listening for sip messages on ' + hostport) ;
}) ;
```

A 'connect' event is emitted by the app object when the connection has been established; alternatively, a callback can be passed to the connect method, as shown above.  

The callback takes two parameters:
* an error value describing why the connection failed, or null; and
* the sip address (host:port) that drachtio-server is listening on.

## Receiving sip requests

app[verb] methods are used to receive incoming sip requests.  Request and Response objects are provided to the callback: the Request object contains information describing the incoming sip request, while the Response object contains methods that allow the application to control the generation of the sip response. 

> (Note that drachtio-server automatically sends a 100 Trying to all incoming INVITE messages, so it is not necessary for a drachtio app to do so).

```js
app.invite( function( req, res ) {
    res.send( 200, {
        body: mySdp
        headers: {
            'content-type': 'application/sdp'
        }
    }) ;
}) ;
app.register( function( req, res ) {
    res.send( 200, {
        headers: {
            expires: 1800
        }
    }) ;
}) ;
```

## Sending sip requests

SIP requests can be sent using the app.uac[verb] methods:

```js
app.connect({
    host:'localhost'
    ,port: 8022
    ,secret: 'cymru'
}) ;

/* send one OPTIONS ping after connecting */
app.once('connect', function(err) {
    if( err ) throw( err ) ;
    app.uac.options('sip:1234@192.168.173.139', function( err, req, res ) {
        if( err ) console.error( err ) ;
        else debug('received response with status is ', res.statusCode ) ;

        app.disconnect() ;
    }) ;
}) ;
```
The callback receives a Request and Response: in this case, the Request describes the sip request that was sent while the Response describes the sip response that was received.

## ACK requests

Sip INVITE messages have the additional feature of being concluded with an sip ACK request. In the case of a drachtio app sending a sip INVITE, the ACK will be automatically generated by the drachtio-server, unless the SIP request was sent with no content.  In that case, the drachtio app can generate the ACK request, specifying appropriate content, using the 'ack' method on the Response object.

> When sending an INVITE request, as a convenience the 'uac' method can be used.

```js
app.uac('sip:1234@192.168.173.139', function( err, req, res ) {
    if( err ) throw( err ) ;

    if( res.statusCode === 200 ) {
        res.ack({
            body: mySdp
            ,headers: {
                'content-type': 'application/sdp'
            }
        }) ;
    }
}) ;

```

## Middleware


Express-style middleware can be used to intercept and filter messages.  Middleware is installed using the 'use' method of the app object, as we have seen earlier with the app.router middleware, which must always be installed in order to access the app[verb] methods.  

Additional middleware can be installed in a similar fashion.  Middleware functions should have an arity of 3 (req, res, next), unless they are error-handling callback methods, in which case the signature should be (err, req, res, next)

```js
app.use( function( req, res, next ) {
    /* reject all messages except from one ip address */
    if( req.signaling_address === '192.168.1.52' ) next() ;
})
```
Middleware can also be invoked only for one type of request
```js
app.use('register', drachtio.digestAuth('dracht.io', function( realm, user, fn) {
    //here we simply return 'foobar' as password; real-world we'd hit a database or something..
    fn( null, 'foobar') ;
})) ;
```

## Session state

Middleware can also used to install session state that can be accessed through req.session.  
```js
var drachtio = require('..')
var app = drachtio()
var RedisStore = require('drachtio-redis')(drachtio) ;

app.connect({
    host: 'localhost'
    ,port: 8022
    ,secret: 'cymru'
}) ;

app.use( drachtio.session({store: new RedisStore({host: 'localhost'}) }) ) ;
app.use( app.router ) ;

app.invite(function(req, res) {
    req.session.user = 'DaveH' ;
    res.send(200, {
        headers: {
            'content-type': 'application/sdp'
        }
        ,body: d.dummySdp
    }) ;
}) ;

app.bye( function(req, res){
    console.log('user is ' + req.session.user) ;
})

```

## Sip dialog support
Sip dialogs provide an optional, higher level of abtraction.  Using sip dialogs requires using session state, as dialogs are automatically persisted to session state. Sip dialogs are installed using the drachtio.dialog middleware.
```js
var drachtio = require('..')
var app = drachtio()
var RedisStore = require('drachtio-redis')(drachtio) 

app.connect({
    host: 'localhost'
    ,port: 8022
    ,secret: 'cymru'
}) ;

app.use( drachtio.session({store: new RedisStore({host: 'localhost'}) }) ) ;
app.use( drachtio.dialog() ) ;
app.use( app.router ) ;

app.invite(function(req, res) {

    res.send(200, {
        headers: {
            'content-type': 'application/sdp'
        }
        ,body: mySdp
    }) ;
}) ;

app.on('sipdialog:create', function(e) {
    var dialog = e.target ;
})
.on('sipdialog:terminate', function(e) {
    var dialog = e.target ;
    
    debug('dialog was terminated due to %s', e.reason ) ;
}) ;

```

## SIP Header Parsing
Note that headers are already pre-parsed for you in incoming requests, making it easy to retrieve specific information elements
```js
app.invite(function(req, res) {
	console.log('remote tag on the incoming INVITE is ' + req.get('from').tag ) ;
	console.log('calling party number on the incoming INVITE is ' + req.get('from').url.user) ;
```

## Documentation

TBD



