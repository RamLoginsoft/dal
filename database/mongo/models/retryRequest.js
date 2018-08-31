var
goose = require('mongoose'),
Schema = goose.Schema,
Mixed = Schema.Types.Mixed,
r = require('ramda');

module.exports = function ( _connection ) {
  var connection = _connection || goose;

  return connection.model(
    'RetryRequest',
    (new Schema({
      count:{type:Number, required:true},
      halt:{type:Boolean, required:true},
      logs: [[Mixed]], // req / res pairs
      maxRetry:{type:Number, required:true},
      options:{type:Mixed, required:true},
      parentId:{type:String, required:true},
      product:{type:{type:String, required:true},
               name:{type:String, required:true},
               version:{type:String, required:true}},
      requestId:{type:String, required:true},
      rootRequestId:{type:String, required:true},
      success:{type:Boolean, required:true}
    })),
    'retryRequests');
};





