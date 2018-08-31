/*jshint -W058 */

var
async = require('async'),
path = require('path'),
r = require('ramda'),
winston = require('winston');

var
database = require('../../database'),
config = require('./conf/database'),
methodParams = require('./conf/method-params').methodParameters,
MethodTest = require('./lib/objects').MethodTest,
LoadTest = require('./lib/objects').LoadTest,
userUtil = require('./lib/util'),
appSettings = userUtil.configurate(process.argv);

var logger = (function ( ) {
	var now = new Date();
	return new (winston.Logger)({
		transports: [new (winston.transports.File)({
			filename: './logs/' +
			(now.getMonth() + 1) + '.' +
			 now.getDate() + '.' +
			 now.getHours() + '.' +
			 now.getMinutes() + '.' +
			 now.getSeconds() +
			 '.test.log'
		})]
	});
}());

(function ( options,					// test options 
						db,								// db-related items
						Test,							// data report
						output,						//  .
						exit ) {					//

var begin = new Date;
var end;

	process.on('uncaughtException', function ( error ) {
		console.log('*** GLOBAL EXCEPTION ***');
		console.log(error);
		exit();
	});	

	var testQueue = r.times(function ( index ) {
		var methodName = db.nextMethod(),
		test = MethodTest({
			method: methodName,
			params: db.params[methodName],
			data: {
				retries: 0,
				retryErrors: [],
				queueIndex: index
			}
		});

		test.params.push(function ( error, data ) {
			this.success = (!error);
			this.error = error;
			// console.log('emitting complete: ', this.id);
			this.emit('complete', test);
		}.bind(test));
		
		return test;

	}, options.numberOfRequests);

	// iterate, in series, through each group of test sets
	async.eachSeries(LoadTest({
			queue: testQueue,
			setsOf: appSettings.setsOf,
			setsUpTo: appSettings.setsUpTo
		}).arrangeToSets(),
		function ( set, doneSet ) {
			// perform each test in the set in parallel
			async.each(set,
				function ( test, doneTest ) {
					test.on('complete', function ( test ) {
						test.completed = true;
						// logger.info(test);
						// console.log('done called: ', test.id);
						doneTest();
					});
					output[test.execute(db.instance)] = test;
				},
				function ( error ) {
					doneSet(error);
				});
		},
		function ( error ) {
			if (!error) {
				end = new Date;
				summarize(output, function ( ) {
					exit();	
				});
			} else { exit(); }
		});

	function summarize ( data, done ) {
		var ids = Object.keys(data);
		console.log('Total time (ms): ', end - begin, ' milliseconds');
		// ids.forEach(function ( id ) {
			// console.log(output[id].method);
			// console.log(output[id].success);
		// });
		done();
	}

}(appSettings,
	{
		instance: database
			.configure(config.connectionPool)
			.getInstance({
				name: 'default',
				onSuccess: (function ( ) {
					var counter = 0;
					return function ( context ) {
						// console.log('*** success ***');
						// console.log(' ', context.method);
						// console.log(' ', context.id);
						// console.log('***************');
						// console.log(++counter, ' / ', appSettings.numberOfRequests);
					};
				}())
			}),
		params: methodParams,
		nextMethod: (function ( params ) {
			var i = 0,
			names = Object.keys(params),
			max = names.length;
			return function ( ) {
				return names[(i++ % max)];
			};
		}(methodParams))
	},
	MethodTest,
	// results
	{},
	// exit: exits
	function ( )  {
		setTimeout(function ( ) {
			process.exit();
		}, 300);
	}
));