var r = require('ramda')

module.exports = function ( env ) {
  var configuration;

  try {
    configuration = require('./developer-conf.json');
    return r.assoc(
      'global',
      configuration.global,
      configuration[env]);
  }
  catch ( e ) {
    // console.log('read failure! no developer.conf');
    configuration = require('./conf.json');
    return r.assoc(
      'global',
      configuration.global,
      configuration[env]);
  }
};
