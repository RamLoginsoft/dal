(function(models) {
  var
  goose = require('mongoose'),
  Schema = goose.Schema;

  // Collection for Persons
  models.register = function(existingConnection) {

    var connection = existingConnection || goose;

    models.schemas = (function(schemas) {

      schemas.failedLoginAttempts = new Schema({
        personId: {type: String},
        startTime: {type: String},
        attempts: {type: Number},
        lastAttemptTime: {type: Number}
      });

      return schemas;
    })({});

    models.FailedLoginAttempts = connection.model(
      'FailedLoginAttempts',
      models.schemas.failedLoginAttempts,
      'failedLoginAttempts');

    return models;
  };
}(module.exports));
