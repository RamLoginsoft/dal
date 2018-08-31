var
async = require('async'),
personsSchema = require('../mongo/models/persons'),
Persons = personsSchema.Persons,
failedLoginAttemptsSchema = require('../mongo/models/failedLoginAttempts'),
FailedLogin = failedLoginAttemptsSchema.FailedLoginAttempts;

module.exports = function(userid, cb) {
  if (!userid)  {
    console.error('No user id provided');
  }

  Persons.findOne({"_id": userid}, function(err, found) {
    if (err) console.error(err);
    if (!found) return cb('notFound', false);
    if (found.locked === 'contactAdmin') {
      async.parallel([
        function(done) {
          Persons.update({"_id": userid}, {$set: {"locked": null}}, function(err, result) {
            if (err) console.error(err);
            if (!result) return done('updateFailed', false);
            done(null);
          });
        },
        function(done) {
          FailedLogin.findOne({"personId": userid}, function(err, found) {
            if (err) console.error(err);
            FailedLogin.update({"_id": found._id}, {$set: {"attempts": 0}}, function(err, result) {
              if (err) console.error(err);
              done(null);
            });
          });
        }
      ], function(err, results) {
        if (err) console.error(err);
        return cb(null, true);
      });
    } else return cb('notLocked', false);
  });
};
