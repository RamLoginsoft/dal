var
goose = require('mongoose'),
Schema = goose.Schema;

// User registration access
var models = module.exports = function ( connection ) {
  connection = connection || goose;

  return connection.model('Registration',
                          new Schema(registration()),
                          'registration');
};

function registration ( ) {
  return {
    code: {type: String, required: true},
    organizationId: {type: String, required: true},
    createdDate: {type: Date, required: true},
    createdBy: {type: String, required:true},
    accessedDate: {type: Date, required: true},
    accessedBy: {type: String, required: true},
    domains: [ { value: {type: String, required: true} } ]
  };
}
