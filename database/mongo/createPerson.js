var
personsSchema = require('../mongo/models/persons'),
Persons = personsSchema.Persons,
async = require('async'),
simcrypt = require('../../modules/simcrypt');

module.exports = function(user, cb) {
  if (!user) console.log('No user data to save');

  if (user['main-contact-name']) {
    async.waterfall([
      function(done) {
        var newMainContact = {
          name: user['main-contact-name'],
          type: ['main'],
          roles: user['roles'],
          organizationId: user.organizationid,
          phone: user['main-contact-phone'],
          phoneExt: user['main-contact-phoneExtension'],
          mobile: null,
          email: user['main-contact-email'],
          passwordHash: null,
          lastLoginTime: null,
          username: user['main-contact-email'],
          resetPasswordToken: null,
          locked: null,
          delete: false
        };
        var newOrgContacts = [];
        newOrgContacts[0] = newMainContact;
        done(null, newOrgContacts);
      },
      function(newOrgContacts, done) {
        if (user['bill-contact-email'] === newOrgContacts[0].email) {
          newOrgContacts[0].type.push('bill');
        } else {
          var newBillingContact = {
            name: user['bill-contact-name'],
            type: ['bill'],
            roles: user['roles'],
            organizationId: user.organizationid,
            phone: user['bill-contact-phone'],
            phoneExt: user['bill-contact-phoneExtension'],
            mobile: null,
            email: user['bill-contact-email'],
            passwordHash: null,
            lastLoginTime: null,
            username: user['bill-contact-email'],
            resetPasswordToken: null,
            locked: null,
            delete: false
          };
          newOrgContacts[1] = newBillingContact;
        }
        done(null, newOrgContacts);
      },
      function(newOrgContacts, done) {
        if (user['tech-contact-email'] === newOrgContacts[0].email) {
          newOrgContacts[0].type.push('tech');
        } else if (user['tech-contact-email'] === newOrgContacts[1].email) {
          newOrgContacts[1].type.push('tech');
        } else {
          var newTechContact = {
            name: user['tech-contact-name'],
            type: ['tech'],
            roles: user['roles'],
            organizationId: user.organizationid,
            phone: user['tech-contact-phone'],
            phoneExt: user['tech-contact-phoneExtension'],
            mobile: null,
            email: user['tech-contact-email'],
            passwordHash: null,
            lastLoginTime: null,
            username: user['tech-contact-email'],
            resetPasswordToken: null,
            locked: null,
            delete: false
          };
          newOrgContacts[2] = newTechContact;
        }
        done(null, newOrgContacts);
      },
      function(newOrgContacts, done) {
        newOrgContacts.forEach(function(entry) {

          var saveOrgContact = new Persons(entry);

          saveOrgContact.save(function(err, result) {
            if (err) console.error(err);
          });
        });
        done(null, true);
      }
    ], function(err, result) {
      if (err) console.error(err);
      return cb(null, true);
    });
  } else {
    var newPerson = {
      name: user.name,
      type: user.superAdmin ? null : ['admin'],
      roles: user.superAdmin ? ['superAdmin'] : user['roles'],
      organizationId: user.organizationid,
      phone: user.phone,
      phoneExt: user.phoneExtension || user.phoneExt,
      mobile: '',
      email: user.email,
      passwordHash: user.superAdmin ? simcrypt.sha1(user.passwordHash) : null,
      lastLoginTime: null,
      username: user.email,
      emulatedOrg: null,
      resetPasswordToken: null,
      locked: null,
      delete: false
    };
    var savePerson = new Persons(newPerson);

    savePerson.save(function(err, result) {
      if (err) console.error(err);
      return cb(null, true);
    });
  }
};
