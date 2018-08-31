const Connection = require('tedious').Connection,
config = {
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
connection = new Connection(config)
.on('connect', function(err) {
  if(err) { throw err; }
  console.log('Connection opened...');
  connection.close();
})
.on('end', function() {
  console.log('Closed connection...');
});

