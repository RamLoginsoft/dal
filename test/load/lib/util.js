(function ( util ) {

	util.configurate = function ( argv ) {
		return (require('commander'))
			.option('-n, --number-of-requests <n>',
				'Total number of database requests to make during load test',
				parseInt)
			.option('-s, --sets-of <n>',
				'Make the requests in parallel sets of this number',
				parseInt,
				5)
			.option('-u, --sets-up-to <n>',
				'Make the requests in parallel sets up to this number',
				parseInt)
			.option('-r, --retry-delay <n>',
				'The retry delay (ms)',
				parseInt)
			.option('-l --log',
				'Whether to use connection pool verbose logging')
			.parse(argv);
	};

}(module.exports));