var
async = require('async'),
Request = require('tedious').Request,
Pool = require('tedious-connection-pool'),
r = require('ramda');

var
util = require('./util'),
errorLog = util.logger,
appSettings = util.configurate(process.argv),
env = require('../../../shared/environments')
	// .emulate('test')
	.emulate('production')
	.getRestifyEnvironment(),
conf = require('../../datastore/conf.json')[env],
monitorLog = (function ( ) {
	return appSettings.debug ?
		console.log.bind(console, 'Monitor:') :
		r.identity;
}());

process.on('uncaughtException', function ( error ) {
	errorLog.error(r.compose(
		r.assoc('emittedOn', 'process'),
		r.assoc('eventType', 'uncaughtException')
		)(error));
});

(function ( appSettings, pool ) {

	pool.on('error', function ( error ) {
		errorLog.error(r.compose(
			r.assoc('emittedOn', 'pool'),
			r.assoc('eventType', 'error')
			)(error));
	});

	setInterval(function ( ) {

		pool.acquire(function ( acqError, connection ) {
			
			monitorLog('acquired connection');

			if (acqError) {
				errorLog.error(r.compose(
					r.assoc('eventType', 'acquireError'),
					r.assoc('emittedOn', '')
					)(acqError));
				return;
			}

			connection.on('errorMessage', function ( errorMessage ) {
				errorLog.error(r.compose(
					r.assoc('emittedOn', 'connection'),
					r.assoc('eventType', 'errorMessage')
					)(errorMessage));
			});

			exectue(connection);

		});

	}, appSettings.ping);

	var exectue = (function ( ) {
		var done = function ( connection, reqError, count ) {
			if (reqError) {
				errorLog.error(r.compose(
					r.assoc('emittedOn', 'connection'),
					r.assoc('eventType', 'errorMessage')
					)(reqError));
			} else { monitorLog('result ok: ' + count); }
			connection.release();
		},
		sql = "SELECT 'OK'";

		return function ( connection ) {
			monitorLog('executing sql');
			var callback = done.bind(null, connection),
			req = new Request(sql, callback);
			connection.execSql(req);
		};

	}());
	
}(appSettings,
	new Pool(r.compose(
				r.assoc('log', (appSettings.debug || false)),
				r.assoc('max', 6)
			)(conf.connectionPool),
		conf.database
	)
));