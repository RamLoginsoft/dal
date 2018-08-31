var
personsSchema = require('../mongo/models/persons'),
Persons = personsSchema.Persons;

module.exports = function(id, cb) {
  Persons.remove({_id: id}, function(err, result) {
    cb(null, result);
  });
};
