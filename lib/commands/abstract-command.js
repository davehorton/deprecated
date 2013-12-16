var et = require('elementtree')
,_=require('underscore') ;

var ElementTree = et.ElementTree, 
element = et.Element;

exports = module.exports = AbstractCommand ;

function AbstractCommand(tag, opts, attributes, children) {
	if( !(typeof tag === 'string') ) throw new Error('AbstractCommand: tag must be string') ;
	if( !(typeof opts === 'object') ) throw new Error('AbstractCommand: opts must be object') ;
	if( !(_.isArray( attributes ))) throw new Error('AbstractCommand: attributes must be array') ;
	if( !(_.isArray( children ))) throw new Error('AbstractCommand: children must be array') ;

	var self = this  ;

	this.tag = tag ;
	
	this.attributes = {} ;
	attributes.forEach( function( attr ) { if( attr in opts ) self.attributes[attr] = opts[attr] ; }) ;

	this.children = {} ;
	children.forEach( function( child ){
		if( child.name in opts ) {
			var data = opts[child.name] ;
			if( _.isArray( opts[child.name] ) ) {
				self.children[child.name] = [] ;
				data.forEach( function( achild ){
					self.children[child.name].push( new child.Klass( achild ) ) ;
				});
			}
			else self.children[child.name] = new child.Klass( data ) ;
		}
	}) ;
}

AbstractCommand.prototype.get = function( attr, defvalue ) {
	return this.attributes[attr] || defvalue ;
}
AbstractCommand.prototype.has = function( attr, defvalue ) {
	return attr in this.attributes ;
}

AbstractCommand.prototype.toXML = function(xmlDeclaration) {
	return new ElementTree( this.toXMLNode() ) .write({
		'xml_declaration': xmlDeclaration === true
		,encoding: 'US-ASCII'
		,indent: 3
	});
}

AbstractCommand.prototype.toXMLNode = function() {
	var root = element( this.tag );

	for( var attr in this.attributes ) {
		if( undefined !== this.attributes[attr] ) root.set( attr, this.attributes[attr] ) ;
	}

	for( var child in this.children ) {
		if( _.isArray( this.children[child] ) ) {
			this.children[child].forEach( function( achild ){
				root.append( achild.toXMLNode() ) ;
			}) ;
		}
		else {
			root.append( this.children[child].toXMLNode() ) ;
		}
	}

	return root;	
}
