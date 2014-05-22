
var MKSession = require('./lib/multikeysession')
  , debug = require('debug')('drachtio:session')
  , MemoryStore = require('./lib/memory')
  , Store = require('./lib/store') 
  , Event = require('./lib/event')
  , _ = require('underscore') ;
 
var env = process.env.NODE_ENV;

exports = module.exports = session ;

exports.Store = Store;
exports.Session = MKSession;
exports.MemoryStore = MemoryStore;
exports.Event = Event ;

exports.addClass = function( klass ) {
    MKSession.resolvers.push( klass ) ;
}

/**
 * Warning message for `MemoryStore` usage in production.
 */

var warning = 'Warning: drachtio-session() MemoryStore is not\n'
  + 'designed for a production environment, as it will leak\n'
  + 'memory, and will not scale past a single process.';

// monkey-patch Request#send to use existing session (if provided) when sending sip request
var Request = require('drachtio').Request ;

var originalSend = Request.prototype.send ;
Request.prototype.send = function(opts, callbacks) {
    if( this.method === 'INVITE' && this.session && this.session instanceof MKSession.SessionProto ) {
        debug('defining mks on outgoing request, uuid: %s', this.session.mks.uuid) ;
        Object.defineProperty(this,'mks', {value: this.session.mks}) ;
        delete this['session'] ;

        var originalPrepare = this.dispatchRequest.prepareRequest ;
        this.dispatchRequest.prepareRequest = function( uac, req ) {
            if( uac.mks ) {
                delete req['session'] ;
                uac.mks.attachTo( req )  ;
            }   
            originalPrepare.apply( this, arguments) ;     
        }
    }

    originalSend.apply( this, arguments ) ;
}

function session(options){
    var options = options || {}
    , store = options.store || new MemoryStore
    , app = options.app
    , resolvers = _.uniq( (options.resolvers || []).concat( Date ) )
    , storeReady = true;

    MKSession.addResolvers( (options.resolvers || []).concat( Date ) ) ;

    // notify user that this store is not
    // meant for a production environment
    if ('production' == env && store instanceof MemoryStore) console.warn(warning);

    // generates the new session
    store.generate = function(req){
        if( req.mks ) return  ;
        var mks = req.mks || new MKSession({store:store}) ;
        mks.set( req.id ) ;
        mks.attachTo( req ) ;
    };

    store.on('disconnect', function(){ storeReady = false; });
    store.on('connect', function(){ storeReady = true; });

    return function session(req, res, next) {

        debug('method: %s, source: %s, has session: %s, response source: %s, response status: %s', 
            req.method, req.source, req.hasOwnProperty('session'), res.source, res.statusCode ) ;

        // self-awareness
        if (req.session) return debug('already have req.session, continuing...'), next() ;

        // Handle connection as if there is no session if
        // the store has temporarily disconnected etc
        if (!storeReady) return debug('store is disconnected'), next();

        // generate the session
        function generate() {
            store.generate(req);
        }

        // proxy res.send and save session on final response
        function proxySend( destroy ) {
            var send = res.send.bind( res );

            res.send = function( code, status, opts ) {
                debug('sending response')
                if( req.canceled ) {
                    res.send = send ;
                    debug('session#proxySend: not sending because request has been canceled') ;
                }
                else if( code >= 200 ) {
                    res.send = send;
                    if( destroy ) {
                       req.mks && req.mks && req.mks.del( req.sessionID, function(){
                            send(code, status, opts);
                        }) ;
                    }
                    else {
                        req.active && req.mks && req.mks.save( function() {
                            send(code, status, opts);                   
                        }) ;           
                    }
                }
                else send( code, status, opts ) ;
            }                                
        }
        function proxyAck() {
            var ack = res.ack.bind( res ) ;
            res.ack = function(opts) {
                res.ack = ack ;
                if( req.mks ) {
                    req.mks.save( function() {
                        ack(opts);                   
                    }) ;          
                }
                else ack(opts) ;
            }
        }

        // expose store
        req.sessionStore = store;
        req.resolvers = resolvers ;

        if( req.source === 'network') {

            if( req.canFormDialog ) {
                generate() ;
                req.mks.save( function(err){ 
                    proxySend() ;
                    next() ;
                }) ;
                return ;
            }
            else if( req.method === 'BYE' || req.method === 'CANCEL' ) {
                proxySend(true) ;
             }
        }

        /* load session from storage and attach to request */
        debug('fetching session for req.sessionID %s', req.id);
        MKSession.loadFromStorage({store: store}, req.id, function(err, mks) {
            // error handling
            if (err) {
                debug('error: ', err);
                if ('ENOENT' == err.code) {
                    generate();
                    if( req.source === 'network' ) proxySend() ;
                    next();
                } else {
                    next(err);
                }
            // no session
            } else if (!mks) {
                debug('no session found');
                generate();
                if( req.source === 'network' ) proxySend() ;
                else if( req.isNewInvite ) proxyAck() ;
                next();
                // populate req.session
            } else {
                debug('loaded session from storage');
                mks.attachTo( req ) ;
                if( req.source === 'network' ) proxySend() ;
                else if( req.isNewInvite ) proxyAck() ;
                else if( req.method === 'BYE') {
                    debug('deleting session id upon receiving response to our BYE for call-id: %s', req.sessionID) ;
                    req.mks.del( req.sessionID, function() { next(); }) ;
                    return ;
                }
                next();
            }
        }) ;
        return ;
    };
} ;

