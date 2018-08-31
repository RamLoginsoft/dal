var
  should = require('should'),
  database = require('../database/index'),
  apiData = require('../apiData'),
  util = require('util');

describe('Tests database functions', function() {
  it('dbo.GetEmployerIntegrationByEmployerID', function(done) {
    database.static.getEmployerIntegrationByEmployerID({
        employerId: 'sadj4hsagjfb'
      },
      function(error, data) {
        if (error) {
          return done(error);
        }
        console.log(data);
        // data.length.should.be.gt(0);
        done();
      });
  });

  it('dbo.GetWebHooks', function(done) {
    database.static.getWebhooks({
        accessId: '2F7F51CD-7445-4F07-BE07-211740AC2991',
        event: null,
        label: null
      },
      function(error, data) {
        if (error) {
          return done(error);
        }
        console.log(data);
        // data.length.should.be.gt(0);
        done(0);
      });
  });

  it('apiData getWebhooks', function(done) {
    apiData.getWebhooks({
        accessId: '2F7F51CD-7445-4F07-BE07-211740AC2991',
        event: null,
        label: null
      }, function(error, data) {
        if(error) {
          return done(error);
        }
        console.log(data);
        done(0);
      });
  });
});