/**
 * Dialog:
 *
 * Emit sip dialog events
 *
 *     app.use(drachtio.dialog());
 *
 */

var SipDialog = require('./lib/dialog')
,Event = require('./lib/event')
,_ = require('underscore')
,Resource = require('./lib/resource')
,debug = require('debug')('drachtio:dialog') ;

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

    var MultikeySession = require('drachtio-session').Session ;
    MultikeySession.resolvers.push(SipDialog) ;
 
    return function(req, res, next) {

        debug('received req, source %s, method %s', req.source, req.method) ;

        /* must be called after drachtio.session */
        if( !req.sessionStore && req.source === 'network') return next('drachtio.dialog() requires drachtio.session() middleware to be installed prior') ;
       
        if( req.isNewInvite() && req.source === 'application' && res.statusCode === 200 ) {
            var ack = _.bind(res.ack, res) ;
            res.ack = function( opts, callback ) {
                res.ack = ack ;
                var dialog = new SipDialog( req ) ;
                req.mks.set( dialog ) ;
                req.mks.save() ;
               
                //debug('response message is: ', res)
                dialog.setConnectTime( res.time ); 
                dialog.state = SipDialog.STABLE ;
                dialog.local.tag = req.get('from').tag ;
                debug('proxying ACK for uac INVITE which got 200 OK, dialog is ', dialog)
                var e = new Event( dialog, req.mks ) ;
                e.req = req ;
                e.res = res ;
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
                    req.mks.set( dialog ) ;
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
        var sid = SipDialog.prefix + req.dialogId ;
        var dialog = req.mks.get( sid ) ;
        if( !dialog ) {
            debug('dialog not found for id %s', sid);
            return next() ;
        }
        debug('loaded dialog ', dialog)
        dialog.attachSession( req.mks ) ;
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
                var e = new Event( dialog, req.mks ) ;
                e.req = req ;
                e.res = res ;
                e.emit( req.app, 'sipdialog:create') ;
             }
            break ;

        case 'PRACK':
            if( (dialog.state === SipDialog.PENDING || dialog.state === SipDialog.EARLY) && req.source === 'network') {
                dialog.setConnectTime( req.msg.time ); 
                dialog.state = SipDialog.EARLY ;
                dialog.local.tag = req.get('to').tag ;
                var e = new Event( dialog, req.mks ) ;
                e.req = req ;
                e.res = res ;
                e.emit( req.app, 'sipdialog:create-early') ;
            }
            break ;

        case 'BYE':
            dialog.setEndTime( req.msg.time ); 
            dialog.state = SipDialog.TERMINATED ;
            var e = new Event( dialog, req.mks, 'network' === req.source ? 'normal far end release' : 'normal near end release' ) ;
            e.req = req ;
            e.res = res ;
            e.emit( req.app, 'sipdialog:terminate') ;

            debug('removing dialog key on BYE for dialog') ;
            req.mks.del( sid ) ;

            break ;
        }
        next() ;
    }
}