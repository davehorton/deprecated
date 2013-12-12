var Msml = require('./lib/msml') 

exports = module.exports = createMsml;

function createMsml( app ) {
  var msml = new Msml( app ) ;
  return msml;
};
