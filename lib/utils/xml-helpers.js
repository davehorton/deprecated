var et = require('elementtree')
Element = et.Element
_ = require('underscore');

var obj = {} ;

exports = module.exports = obj ;

obj.XmlObj = XmlObj ;

function XmlObj( el ) {
	var self = this ;

	this.tag = el.tag ;

	self.attributes = {}; self.children = [] ;

    el.keys().forEach( function( attr ) { self.attributes[attr] = el.get(attr) ; }) ;
    el.getchildren().forEach( function( child ) {
    	self.children.push( new XmlObj( child ) ) ;
    }) ;
    if( el.text && '\n' !== el.text ) self.text = el.text ;
 }

 XmlObj.prototype.get = function(attr,def) {
 	return this.attributes[attr] || def ;
 }
XmlObj.prototype.getChildren = function(name) {
 	return _.filter( this.children, function(child) {return name === child.tag;} ) ;
 }
XmlObj.prototype.getChild = function(name) {
 	var arr = this.getChildren(name);
 	if( arr ) return arr[0] ;
 }
XmlObj.prototype.hasChildren = function(name) {
 	return undefined !== _.find( this.children, function(child) {return name === child.tag;} )  ;
 }


