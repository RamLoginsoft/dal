(function(models) {
  var
  goose = require('mongoose'),
  Schema = goose.Schema;

  // Collection for Persons
  models.register = function(existingConnection) {

    var connection = existingConnection || goose;

    models.schemas = (function( schemas ) {

      schemas.persons = new Schema({
        name: {type: String},
        type: [String],
        roles: [String],
        organizationId: {type: String},
        phone: {type: String},
        phoneExt: {type: String},
        mobile: {type: String},
        email: {type: String},
        passwordHash: {type: String},
        lastLoginTime: {type: Date},
        username: {type: String},
        emulatedOrg: {type: String},
        resetPasswordToken: {type: String},
        locked: {type: String},
        delete: {type: Boolean}
      },
      {
        versionKey: false
      });

      return schemas;
    })({});

    models.Persons = connection.model(
      'Persons',
      models.schemas.persons,
      'persons');

    return models;
  };

}(module.exports));
