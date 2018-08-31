var
personsSchema = require('../mongo/models/persons'),
Persons = personsSchema.Persons;

module.exports = function(input, type, cb) {

  if (type === 'superAdmin') {
    Persons.find({roles: {$all: ['superAdmin']}}, function(err, results) {
      if (err) {
        console.error(err);
        return cb(err);
      }

      var superAdmins = [];

      for (var i = 0; i < results.length; i++) {
        var superAdmin = {
          AdminNumber: results[i]._id,
          DisplayName: results[i].name,
          UserName: results[i].username,
          EmulatedOrg: results[i].emulatedOrg
        };
        superAdmins[i] = superAdmin;
      }
      cb(null, superAdmins);
    });
  } else if (type === 'findOneSuper') {
    Persons.findOne({_id: input._id}, function(err, result) {
      if (err) {
        console.error(err);
        return cb(err);
      }

      var superAdmin = {
        AdminNumber: result._id,
        DisplayName: result.name,
        UserName: result.username,
        EmulatedOrg: result.emulatedOrg
      };

      cb(null, superAdmin);

    });

  } else if (type === 'billContacts') {
    Persons.find({'organizationId': { $in: input
    }}, function(err, results) {
      if (err) console.error(err);
      cb(null, results);
    });
  }else if(type === 'emailDetails'){

    Persons.findOne(
      {organizationId : input,
        delete: false,
        type: "main"
      },
      function(err, result) {
      if (err) {
        console.error(err);
        return cb(err);
      }
      var emailDetails = {};
      if(result !== null){
        emailDetails = {
          AdminNumber: result._id,
          DisplayName: result.name,
          UserName: result.username
        };
      }else{
        emailDetails='noUser';
      }

      cb(null, emailDetails);

    });
  } else {
    Persons.find({organizationId: input}, function(err, results) {
      if (err) console.error(err);

      var personsArr = [];

      for (var i = 0; i < results.length; i++) {
        var personsEntry = {
          UserID: results[i]._id,
          Name: results[i].name,
          OrganizationID: results[i].organizationId,
          Type: results[i].type,
          Phone: results[i].phone || null,
          PhoneExt:results[i].phoneExt || null,
          Email: results[i].username,
          DateTimeLastLogin: results[i].lastLoginTime || 'None'
        };
        personsArr[i] = personsEntry;
      }
      cb(null, personsArr);
    });
  }
};
