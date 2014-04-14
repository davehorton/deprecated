# drachtio-dialog [![Build Status](https://secure.travis-ci.org/davehorton/drachtio-dialog.png)](http://travis-ci.org/davehorton/drachtio-dialog)

[![drachtio logo](http://www.dracht.io/images/definition_only-cropped.png)](http://dracht.io/)

drachtio-dialog is middleware that adds a higher-level abstraction of SIP dialogs to the [drachtio](https://github.com/davehorton/drachtio) library.

```js
var app = require('drachtio')()
,session = require('drachtio-session')
,dialog = require('drachtio-dialog')
,config = require('../fixtures/config')
,debug = require('debug')('drachtio:dialog-simple-uas') ;

app.connect( config.connect_opts ) ;

app.use(session({app:app})) ;
app.use(dialog()) ;

app.invite(function(req, res){
    req.session.user='jack jones' ;
	res.send( 200,{
		body: config.sdp
	}) ;
}) ;

app.on('sipdialog:create', function(e){
	var dialog = e.target ;
	debug('dialog created with role %s', dialog.role) ;

	setTimeout( function(){
		dialog.terminate() ;
	}, 2000) ;
})
app.on('sipdialog:terminate', function(e){
	debug('sip dialog terminated for reason: %s, user is %s', e.reason, e.session.user) ;
}) ;
```

## SipDialog

An application creates a SipDialog object by either responding to an incoming new INVITE with a 200 OK in an `app.invite` handler (i.e acting as a user agent server, or uas), or by generating a new INVITE request via a call to `app.siprequest` that results in a 200 OK from the far end (i.e. acting as a user agent client or uac).  In either case, a 'dialog-create' event is emitted from the app which contains the newly-created dialog in the `target` property.  

### SipDialog methods

- `request( method, opts, callbacks )` - send a sip request within a dialog; arguments are the same as for `app.siprequest`, but the 'call-id' header is set automatically.
- `terminate( callback )` - terminate a SipDialog by sending a BYE request; if provided, the callback function will be invoked when the response to the BYE is received

### SipDialog properties

- `state` - 'pending','early','stable',or 'terminated'
- `role` - 'uac', or 'uas'
- `call-id` - sip call-id for the dialog
- `calling_party` - calling party information retrieved from either P-Asserted-Identity, Remote-Party-ID, or From header (in preference order)
	- `user` - user value of the SIP url
	- `display` - display name, if any
	- `privacy` - privacy parameter, if any
- `called_party` - called party information retrieved from either P-Asserted-Identity, Remote-Party-ID, or From header (in preference order)
	- `user` - user value of the SIP url
	- `display` - display name, if any
	- `privacy` - privacy parameter, if any
- `times`
	- `start_time` - time INVITE was sent or received (integer value, seconds UTC since 1970)
	- `connect_time` - time call was answered (only populated for connected calls)
	- `end_time` - time call was terminated (for stable dialog) or final non-success response was received
- `local`
	- `tag` - local tag
	- `sdp` - local endpoint session description protocol
	- `content-type` - local sdp content type
	- `user` - local user value
	- `signaling_address` - local sip signaling address
	- `signaling_port` - local sip signaling port
- `remote`
	- `tag` - remote tag
	- `sdp` - remote endpoint session description protocol
	- `content-type` - remote sdp content type
	- `user` - remote user value
	- `signaling_address` - remote sip signaling address
	- `signaling_port` - remote sip signaling port

### SipDialog events

The following events are emitted from the app object for SipDialogs:

- `sipdialog:create` - this event is emitted when a SipDialog is created
- `sipdialog:create-early` - this event is emitted when an early dialog is created (i.e., upon receipt of PRACK for reliable provisional response)
- `sipdialog:terminate` - this event is emitted when a dialog is terminated.

An event object containing the following properties is passed to the application's event handler:

- `target` - the SipDialog this event references
- `session` - the session object associated with the dialog
- `reason` - a specific reason for the event, if appropriate (e.g., the `sipdialog:terminate` event will have a reason property indicating the reason the dialog was terminated.