var et = require('elementtree'),
debug = require('debug')('msml:msmlparser'), 
XmlObj = require('../utils/xml-helpers').XmlObj ;

exports = module.exports = function msmlParser(opts){

    var opts = opts || {} ;

    return function msmlParser(req, res, next) {

        var parseRequest, parseResponse ;

        if( req.body && !req.msml && 'network' == req.source && 'application/msml+xml' === req.get('content-type').type ) parseRequest = true ;
        else if( res.body && !res.msml && 'network' == res.source && 'application/msml+xml' === res.get('content-type').type ) parseResponse = true ;

        if( !parseRequest && !parseResponse ) return next() ;

        var parseable = parseRequest ? req : res ;

        debug('we are going to parse %s', parseRequest ? 'request' : 'response') ;

        try {
            var etree = et.parse( parseable.body ) ;
            var root = etree.getroot() ;
            var json = {} ;
 
            json[root.tag] = new XmlObj( root ) ;      
            parseable.msml = json.msml ;
            debug('parsed body as %s', JSON.stringify( parseable.msml ) ) ;

        } catch( error ) {
            console.log('error parsing msml body: ' + error ) ;
        }

        next() ;
    } 

}