var
Connection = require('tedious').Connection,
// ConnectionPool = require('../modules/sql-server-pool'),
ConnectionPool = require('tedious-connection-pool'),
Request = require('tedious').Request,
_ = require('underscore');

var
env = require('../../shared/environments.js').getRestifyEnvironment(),
config = require('../datastore/conf.json')[env];

var tds = {};
module.exports = tds;

tds.getConfig = function ( ) {
  return {
    env: env,
    config: config
  };
};

tds.getTypes = function() {
  return require('tedious').TYPES;
};

tds.ConnectionPool = ConnectionPool;

tds.getIsolationLevels = function() {
  return require('tedious').ISO_LVL;
};

tds.getConnection = function () {
  return new Connection(config);
};

tds.getPool = function ( poolConfig, dbConfig ) {
  poolConfig = poolConfig || config.connectionPool;
  dbConfig = dbConfig || config.database;
  return new ConnectionPool(poolConfig, dbConfig);
};

// types ['statement'|'procedure'|'batch']
tds.execute = function (type, connection, sql, params, returnMeta, done) {

  request = new Request(sql, function(err, rowCount) {
    if (err) {
      return done(err);
    } else {
      return done(null, rows, rowCount);
    }
  });

  _addParameters(request, params);

  var rows = [];

  request.on('row', function(columns) {
    var row = [];
    _.each(columns, function(e, i, l) {
      if(returnMeta)
	row.push(e);
      else
	row.push(e.value);
    });
    rows.push(row);
  });

  try {
    if(type === 'procedure')
      connection.callProcedure(request);
    else if(type === 'statement')
      connection.execSql(request);
    else if(type === 'batch')
      connection.execSqlBatch(request);
    else
      return done(new Error('Unknown execution type'), null);
  } catch(ex) {
    console.log(ex.stack);
    return done(ex, null);
  }
};

function _addParameters(request, params) {
  if(!_.isEmpty(params)) {
    _.each(params, function(e, i, l) {
      request.addParameter(params[i].name, params[i].type, params[i].value);
    });
  }
  return;
}
