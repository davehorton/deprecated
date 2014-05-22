/**
 * Dialog:
 *
 * Emit sip dialog events
 *
 *     app.use(drachtio.dialog());
 *
 */

var SipDialog = require('./lib/dialog')
,drachtioSession = require('drachtio-session')
,Event = drachtioSession.Event
,_ = require('underscore')
,debug = require('debug')('drachtio:dialog') ;

drachtioSession.addClass(SipDialog) ;

const prefix = 'dlg:' ;

function attachAppToDialogs( app, sess ) {
    for( var key in sess ) {
        if( sess[key] instanceof SipDialog ) {
            Object.defineProperty( sess[key] , 'app', {value: app}) ;
        }
        else if( typeof( sess[key] ) === 'object' ) attachAppToDialogs( app, sess[key] ) ;
    }
}

module.exports = function dialog() {
 
    return function(req, res, next) {

        debug('received req, source %s, method %s', req.source, req.method) ;

        /* must be called after drachtio.session */
        if( !req.sessionStore && req.source === 'network') return next('drachtio.dialog() requires drachtio.session() middleware to be installed prior') ;
       
        if( req.isNewInvite() && req.source === 'application' && res.statusCode === 200 ) {
            var ack = _.bind(res.ack, res) ;
            res.ack = function( opts, callback ) {
                res.ack = ack ;
                var dialog = new SipDialog( req ) ;
                req.mks.set( dialog.id, dialog ) ;
                req.mks.save() ;
               
                dialog.setConnectTime( res.time ); 
                dialog.state = SipDialog.STABLE ;
                dialog.local.tag = req.get('from').tag ;
                var e = new Event({
                    target: dialog 
                    ,mks: req.mks
                    ,req: req
                    ,res: res
                }) ;
                e.emit( req.app, 'sipdialog:create') ;

                return ack( opts, callback ) ;               
            }
        }
        if( req.isNewInvite() && req.source === 'network') {
            /* proxy res.send to create dialog when sending 200 OK to INVITE */
            var send = _.bind(res.send, res) ;
            res.send = function( code, status, opts ) {
                if( code >= 200 ) res.send = send ;
 
                var reliable = false ;
                if( code > 100 && code < 200 ) {
                    var msg = opts || status || {} ;
                    var require = [] ;
                    if( msg.headers['require'] ) {
                        if( _.isArray(msg.headers['require']) ) {
                            require = _.flatten( msg.headers['require'] ) ;
                        }
                        else if( _.isString(msg.headers['require']) ) {
                            require = [ msg.headers['require'] ] ;
                        }
                    }
                    reliable = _.find( require, function(s) { return -1 !== s.indexOf('100rel');}) ;
                }
                if( 200 === code || reliable ) {
                    var dialog = new SipDialog( req, res ) ;

                    /* set dialog id as a key to the session */
                    req.mks.set( dialog.dialogId, dialog ) ;
                    req.mks.save() ;

                    var msg = opts || status || {} ;
                    msg.headers = msg.headers || {} ;
                    if( 'content-type' in msg.headers ) dialog.local['content-type'] = msg.headers['content-type'] ;
                    dialog.local.sdp = msg.body ;

                    return send( code, status, opts ) ;
                }
                else send( code, status, opts ) ;
            }
            return next() ;
        }

        /* retrieve dialog */
        if( !req.dialogId ) {
            debug('request does not have a dialog id, next..') ;
            return next() ;
        }
        var dialog = req.mks.get( req.dialogId ) ;
        if( !dialog ) {
            debug('dialog not found for id %s', req.dialogId);
            return next() ;
        }
        debug('loaded dialog ', dialog)
        req.mks.attachTo( dialog );
        attachAppToDialogs( req.app, dialog.session ) ;
 
        /* we have a dialog, see if any of these messages represent dialog events we should emit */
        Object.defineProperty( dialog, 'app', {value: req.app}) ;
        Object.defineProperty( dialog, 'sessionStore', {value: req.sessionStore}) ;

        req.dialog = dialog ;

        switch( req.method ) {
        case 'ACK':
            if( (dialog.state === SipDialog.PENDING || dialog.state === SipDialog.EARLY) && req.source === 'network') {
                dialog.setConnectTime( req.msg.time ); 
                dialog.state = SipDialog.STABLE ;
                dialog.local.tag = req.get('to').tag ;
                var e = new Event({
                    target: dialog
                    ,mks: req.mks
                    ,req: req
                    ,res: res
                }) ;
                e.emit( req.app, 'sipdialog:create') ;
             }
            break ;

        case 'PRACK':
            if( (dialog.state === SipDialog.PENDING || dialog.state === SipDialog.EARLY) && req.source === 'network') {
                dialog.setConnectTime( req.msg.time ); 
                dialog.state = SipDialog.EARLY ;
                dialog.local.tag = req.get('to').tag ;
                var e = new Event({
                    target: dialog
                    ,mks: req.mks
                    ,req: req
                    ,res: res
                }) ;
                e.emit( req.app, 'sipdialog:create-early') ;
            }
            break ;

        case 'BYE':
            dialog.setEndTime( req.msg.time ); 
            dialog.state = SipDialog.TERMINATED ;
            var e = new Event({
                target: dialog
                ,mks: req.mks
                ,reason: 'network' === req.source ? 'normal far end release' : 'normal near end release'
                ,req: req
                ,res: res
            }) ;
            e.emit( req.app, 'sipdialog:terminate') ;

            debug('removing dialog key on BYE for dialog') ;
            req.mks.del( sid ) ;

            break ;
        }
        next() ;
    }
}