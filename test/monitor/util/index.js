var winston = require('winston');

(function ( util ) {

	util.configurate = function ( argv ) {
		return require('commander')
			.option('-p, --ping <n>',
				'How often to obtain a connection and query',
				parseInt)
			.option('-d, --debug',
				'Whether to log from monitor and pool activity')
			.parse(argv);
	};
	
	util.logger = (function ( ) {
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

	util.identify = function ( ) {
		console.log('-----------------------------');
		console.log('  process id: ', process.pid);
		console.log('-----------------------------');
	};

}(module.exports));