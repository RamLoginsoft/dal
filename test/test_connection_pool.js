
const ConnectionPool = require('tedious-connection-pool'),
Request = require('tedious').Request,
connectionConfig = {
      "userName": "SimpleAppUser@rib4rnh8e5",
      "password": "(9:pA_AX\\O#v",
      "server": "rib4rnh8e5.database.windows.net",
      "options": {
        "database": "SimpleTest_3",
        "connectTimeout": 15000,
        "requestTimeout": 30000,
        "cancelTimeout": 5000,
        "encrypt": true,
        "tdsVersion": "7_4",
        "debug": {
          "packet": false,
          "data": false,
          "token": false,
          "payload": false
        }
      }
    },
poolConfig = {
      "max": 5,
      "min": 1,
      "idleTimeoutMillis": 30000,
      "log": true
    };

//create the pool
var pool = new ConnectionPool(poolConfig, connectionConfig);

pool.on('error', function(err) {
    console.error(err);
});

//acquire a connection
pool.acquire(function (err, connection) {
    if (err) {
        console.error(err);
        return;
    }

    //use the connection as normal
    var request = new Request('select 42', function(err, rowCount) {
        if (err) {
            console.error(err);
            return;
        }

        console.log('rowCount: ' + rowCount);

        //release the connection back to the pool when finished
        connection.release();
        pool.drain(function() {
            console.log('Done...');
        });
    });

    request.on('row', function(columns) {
        console.log('value: ' + columns[0].value);
    });

    connection.execSql(request);

});