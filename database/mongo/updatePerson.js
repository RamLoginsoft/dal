var
personsSchema = require('../mongo/models/persons'),
Persons = personsSchema.Persons,
simcrypt = require('../../modules/simcrypt');

module.exports = function(user, cb) {

  if (user['hq-org-orgname']) {
    var
    updatedMainContact = {
      name: user['main-contact-name'],
      email: user['main-contact-email'],
      username: user['main-contact-email'],
      phone: user['main-contact-phone'],
      phoneExt: user['main-contact-phoneExtension'],
      roles:user['roles']
    },
    updatedBillContact = {
      name: user['bill-contact-name'],
      email: user['bill-contact-email'],
      username: user['bill-contact-email'],
      phone: user['bill-contact-phone'],
      phoneExt: user['bill-contact-phoneExtension'],
      roles:user['roles']
    },
    updatedTechContact = {
      name: user['tech-contact-name'],
      email: user['tech-contact-email'],
      username: user['tech-contact-email'],
      phone: user['tech-contact-phone'],
      phoneExt: user['tech-contact-phoneExtension'],
      roles:user['roles']
    },
    updateContactArr = [
      updatedTechContact,
      updatedBillContact,
      updatedMainContact
    ],
    contactIdArr = [
      user['tech-contact-id'],
      user['bill-contact-id'],
      user['main-contact-id']
    ];

    for (var i = 0; i < contactIdArr.length; i++) {

      if(contactIdArr[i]) {
        Persons.update({_id: contactIdArr[i]}, {$set: updateContactArr[i]}, function(err, result) {
          if (err) console.error(err);
        });
      } else {

        if (i === 0 && !contactIdArr[i]) {

          updateContactArr[i].type = ['tech'];
          updateContactArr[i].organizationId = user.orgId;

          var saveTech = new Persons(updateContactArr[i]);

          saveTech.save(updateContactArr[i], function(err, result) {
            if (err) console.error(err);
          });
        } else if (i === 1 && !contactIdArr[i]) {

          updateContactArr[i].type = ['bill'];
          updateContactArr[i].organizationId = user.orgId;

          var saveBill = new Persons(updateContactArr[i]);

          saveBill.save(updateContactArr[i], function(err, result) {
            if (err) console.error(err);
          });
        } else if (i === 2 && !contactIdArr[i]) {

          updateContactArr[i].type = ['main'];
          updateContactArr[i].organizationId = user.orgId;

          var saveMain = new Persons(updateContactArr[i]);

          saveMain.save(updateContactArr[i], function(err, result) {
            if (err) console.error(err);
          });
        }
      }      
    }
    // Update roles when organization type is changed for non contact members
    Persons.update(
      { $and: [
                {organizationId: user.orgId},
                {_id: { $nin: contactIdArr }}
              ]
      },
      {$set: {roles:user['roles']}},
      {multi:true},
      function(err, result) {
        if (err) console.error(err);
    });

    cb(null, true);

  } else {
    if (user.passwordHash) user.passwordHash = simcrypt.sha1(user.passwordHash);

    Persons.update({_id: user.id}, {$set: user}, function(err, result) {
      if (err) console.error(err);
      cb(null, result);
    });
  }
};
