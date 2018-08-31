(function ( models ) {

  var
  goose = require('mongoose'),
  Schema = goose.Schema;

  models.register = function ( existingConnection ) {

    var connection = existingConnection || goose;

    models.schemas = (function ( schemas ) {
      schemas.supportedProducts = new Schema({
        name: {type:"String", required: true},
        matchRules: [
          {
            matchString: {type: "String", required: true},
            matchType: {type: "String", required: true}
          }
        ],
        supports: [{
          name: {type: "String", required: true},
        }]
      });

      schemas.supportedProducts.path("matchRules")
        .validate(function(matchRules) {
          if(!matchRules) { return false; }
          else if(matchRules.length === 0) { return false; }
          return true;
        }, 'matchRules must have at least one element');

      schemas.supportedProducts.path("supports")
        .validate(function(supports) {
          if(!supports) { return false; }
          else if(supports.length === 0) { return false; }
          return true;
        }, 'supports must have at least one element');

      schemas.supportedProducts.path("matchRules")
        .schema.path("matchString").validate(function(matchString) {
          if(!matchString) { return false; }
          else { return true; }
        }, 'matchString must have a value');

      schemas.supportedProducts.path("matchRules")
        .schema.path("matchType").validate(function(matchType) {
          if(!matchType) { return false; }
          else { return true; }
        }, 'matchType must have a value');

      return schemas;

    })({});

    models.SupportedProducts = connection.model(
      'SupportedProducts',
      models.schemas.supportedProducts,
      'supportedProducts');

    return models;
  };

}(module.exports));