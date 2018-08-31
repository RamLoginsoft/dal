var
personsSchema = require('../mongo/models/persons'),
Persons = personsSchema.Persons,
failedLoginAttemptsSchema = require('../mongo/models/failedLoginAttempts'),
FailedLogin = failedLoginAttemptsSchema.FailedLoginAttempts,
simcrypt = require('../../modules/simcrypt');

module.exports = function(token, pw, cb) {

  Persons.findOne({resetPasswordToken: token}, function(err, result) {
    var setPassword = {};
    var lockedAdmin = false;
    if (err) console.error(err);

    if(!token || !pw) {
      console.log('No token or password provided');
      cb('Fail', null);
    }

    result.roles.forEach(function(role) {
      if (role === 'superAdmin') {

        FailedLogin.findOne({"personId": result._id}, function(err, found) {
          if (err) console.error(err);
          FailedLogin.update({"_id": found._id}, {$set: {"attempts": 0}}, function(err, result) {
            if (err) console.error(err);
          });
        });
        return setPassword.locked = null;
      }
    });

    setPassword.passwordHash = simcrypt.sha1(pw);
    setPassword.resetPasswordToken = null;

    Persons.update({_id: result._id}, {$set: setPassword}, function(err, result) {
      if (err) console.error(err);
      cb(null, result);
    });
  });
};
