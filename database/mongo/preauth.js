var
async = require('async'),
personsSchema = require('../mongo/models/persons'),
failedLoginAttemptsSchema = require('../mongo/models/failedLoginAttempts'),
Persons = personsSchema.Persons,
FailedLoginAttempts = failedLoginAttemptsSchema.FailedLoginAttempts,
simcrypt = require('../../modules/simcrypt');

module.exports = function(user, pw, cb) {

  if (!user) {
    return console.log('Invalid input');
  }

  async.waterfall([
    function(done) {

      //build regular expression to compare for case-insensitive.
      var userRegExp = new RegExp('^' + user + '$', 'i');

      Persons.findOne({username: userRegExp}, function(err, found) {

        if (err) console.error(err);
        if (!found) {
          done(null, null, null, null, null);
        } else {
          done(null, found.id, found.username, found.passwordHash, found.locked);
        }
      });
    },

    function(id, username, passwordHash, locked, done) {
      if (id === null) {
        return done(null, null, null, null, null, null, null);
      }

      if(simcrypt.sha1(pw) === passwordHash && locked !== 'contactAdmin') {
        var valid = true;
        return done(null, id, valid, null, null, null, null);
      }

      FailedLoginAttempts.findOne({personId: id}, function(err, existing) {

        var fail = {
          _id: existing ? existing._id : null,
          personId: existing ? existing.personId : id,
          startTime: Date.now(),
          attempts: existing ? existing.attempts + 1 : 1,
          lastAttemptTime: existing ? existing.startTime : null
        };

        var loginFailure = new FailedLoginAttempts(fail);

        if (err) console.error(err);
        if (existing) {
          if (fail.attempts >= 15) {
            var contactAdmin = true;
            console.log('Locked Account');
          }
          loginFailure.update({_id: existing._id, $set: fail}, function(err, updated) {
            if (err) console.error(err);
            if (updated) console.log('Login failure added for user:' + username + ' Attempts:', existing.attempts + 1);
          });
        }
        else {
          loginFailure.save(function(err, saved) {
            if (err) console.error(err);
            if (saved) console.log('New login failure has been saved for:', username);
          });
        }
        done(null, id, null, existing, fail, locked, contactAdmin);
      });
    },

    function(id, valid, existing, fail, locked, contactAdmin, done) {

      var status = {
        valid: false,
        type: null
      };

      if (id === null) {
        status.type = 'noUser';
        return done(null, status);
      } else if (valid) {
        Persons.update({_id: id}, {$set: {lastLoginTime: Date.now()}}, function(err, update) {
          if (err) console.error(err);
        });
        status.valid = true;
        return done(null, status);
      } else if (contactAdmin) {
        Persons.update({_id: id}, {$set: {"locked": 'contactAdmin'}}, function(err, update) {
          if (err) console.error(err);
        });
        status.type = 'contactAdmin';
        return done(null, status);
      }

      if (fail.attempts === 5 || fail.attempts === 10 || fail.attempts === 15) {
        status.type = 'email';

        Persons.update({_id: id}, {$set: {"locked": 'email'}}, function(err, update) {
          if (err) console.error(err);
        });
      }
      done(null, status);
    }

  ], cb);
};
