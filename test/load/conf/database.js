module.exports =  {

	connectionPool: {
		idleTimeoutMillis: 15000,
		max: 10,
		min: 1,
		name: 'default',
    retryDelay: 1000,
    acquireTimeout: 30000
    // ,
    // log: true
	},

	database: {
			userName: "SimpleAppUser@rib4rnh8e5",
			password: "(9:pA_AX\\O#v",
			server: "rib4rnh8e5.database.windows.net",
			options: {
				database: "SimpleAPI-test",
				// database: "SimpleStage",
				connectTimeout: 15000,
				requestTimeout: 15000,
				cancelTimeout: 5000,
				encrypt: true,
				tdsVersion: "7_4",
				debug: {
					"packet": false,
					"data": false,
					"token": false,
					"payload": false
				}
			}
		}
};