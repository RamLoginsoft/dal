var
goose = require('mongoose'),
Schema = goose.Schema;

module.exports = {
  register: function ( _connection ) {
    var
    connection = _connection || goose,
    schemas = (function ( schemas ) {

      schemas.itemizedCharges = new Schema({
    	adjustment: {type: Number},
    	amount: {type: Number},
    	bridgeId: {type: String},
    	bridgeName: {type: String},
    	charge: {type: Number, required: true},
    	productType: {type: String},
    	volume: {type: Number, required: true},

      });

      schemas.payment = new Schema({
    	amountReceived: {type: Number, required: true},
    	notify: {type: Boolean},
    	payerId: {type: String, required: true},
    	paymentDate: {type: Date, required: true},
    	type: {type: String, required: true}

      });

      schemas.billingHistory = new Schema ({
        balanceLeft: {type: Number, required: true},
    	organizationId: {type: String, required: true},
    	billingDate: {type: Date, required: true},
    	billedFrom: {type: Date, required: false},
    	billedTo: {type: Date, required: false},
    	itemizedCharges: [schemas.itemizedCharges],
    	payment: [schemas.payment],
        previousBalance: {type: Number, required: false},
        processed: {type: Boolean, required: false},
        transactionType: {type: String, required: true}
      });

      return schemas;
    }({}));

    return connection.model('BillingHistory',
                            schemas.billingHistory,
                            'billingHistory');
  }
};
