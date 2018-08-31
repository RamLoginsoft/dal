var
mongoose = require('mongoose'),
Schema = mongoose.Schema;

module.exports = function ( _connection ) {
  var
  connection = _connection || mongoose;

  return connection.model(
    'TransactionBundles',
    new Schema ({
      currency:       { type: String, required: true, default: 'USD' },
      numberOfUnits:  { type: Number, required: true },
      organizationId: { type: String, required: false },
      price:          { type: Number, required: true },
      pricePerUnit:   { type: Number, required: true },
      text:           { type: String, required: true },
      value:          { type: String, required: true }
    }),
    'transactionBundles');
};
