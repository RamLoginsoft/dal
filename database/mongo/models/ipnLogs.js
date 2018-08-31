var
goose = require('mongoose'),
Schema = goose.Schema;

module.exports = {
  register: function ( _connection ) {
    var connection = _connection || goose;
    return connection.model('IpnLog',
                            new Schema({
                              transactionType:{type: String, required: true},
                              idMessageKeyName:{type: String},
                              id:{type: String},
                              message:{type: String},
                              timestamp:{type:Number},
                              valid: {type: Boolean}
                            }),
                            'ipnLogs');
  }
};
