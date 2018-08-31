var
uuid = require('uuid'),
simcrypt = require('../../modules/simcrypt'),
personsSchema = require('../mongo/models/persons'),
Persons = personsSchema.Persons;

module.exports = function(email, cb) {
  Persons.findOne({username: email}, function(err, result) {
    var lockedAccount = false;
    if (err) console.error(err);
    if(!result) return cb(null, 'noUser');

    result.roles.forEach(function(role) {
      if (role !== 'superAdmin' && result.locked === 'contactAdmin') lockedAccount = true;
    });

    if (lockedAccount) {
      return cb(null, 'lockedAccount');
    }

    var resetPasswordToken = simcrypt.sha1(uuid.v4());

    Persons.update({_id: result._id}, {resetPasswordToken: resetPasswordToken}, function(err, result) {
      if (err) console.error(err);
      cb(null, resetPasswordToken);
    });
  });
};
