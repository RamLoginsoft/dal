var
fs = require('fs'),
mongoose = require('mongoose'),
path = require('path'),
r = require('ramda'),
ENVIRONMENT = require('../../../shared/environments').getEnv(),
mongoConfig = require('../../datastore/conf.json')[ENVIRONMENT].mongodb,
sslFiles = [{ property: 'sslCert', fileName: mongoConfig.ssl_file },
            { property: 'sslCA', fileName: mongoConfig.ssl_ca_file },
            { property: 'sslKey', fileName: mongoConfig.ssl_key }];
var defaultConnectionOptions = {
    useNewUrlParser : true
};


(function ( mongodb ) {

  mongodb.configure = function ( config, callback ) {
    //config = config || mongoConfig;
    var options = setSslConfig(defaultConnectionOptions, sslFiles);

    mongodb.connection = mongoose.createConnection(
      config.connectionString,
      options);

    mongodb.models = (function ( ) {
      var models;
      return function ( ) {
        if (!models) {
          models = require('./models')(this.connection); }
        return models;
      };
    }());

    function setSslConfig(configOptions, sslFiles) {
      var container;
      if (config.connection_options.server &&
          config.connection_options.server.ssl) {
        container = "server";
      } else if (config.connection_options.replset &&
                 config.connection_options.replset.ssl) {
        container = "replset";
      } else {
        return configOptions;
      }

      sslFiles.forEach(function(fileInfo, index) {
        var filePath, fileContents;
        var fileName = fileInfo.fileName;
        try {
          filePath = path.resolve(__dirname, './ssl/', fileName);
        } catch(ex) {
          // console.log("--------------------------------------------------");
          // console.log("Test and Development use a self-signed certificate");
          // console.log("without a CA file and will put out this message.");
          // console.log(" file info: ", fileInfo);
          // console.log("--------------------------------------------------");
          // console.log(ex.stack ? ex.stack : ex);
          return;
        }
        fileContents = fs.readFileSync(filePath);
        /*configOptions = r.assocPath([
            container,
            fileInfo.property
          ],
          fileContents,
          configOptions);*/
          configOptions[fileInfo.property] = fileContents;
          configOptions.ssl = config.connection_options[container].ssl;
          configOptions.sslValidate = config.connection_options[container].sslValidate;

          if(container === 'server') {

              configOptions.autoReconnect = config.connection_options[container].socketOptions.autoReconnect;
          }

          if(container === 'replset') {

              configOptions.sslPass = config.connection_options[container].sslPass;
              configOptions.auto_reconnect = config.connection_options[container].auto_reconnect;
          }

          var socOptions= config.connection_options[container].socketOptions;
          for (var key in socOptions) {
              if (socOptions.hasOwnProperty(key)) {
                  configOptions[key] = socOptions[key];
              }
          }
      });

      return configOptions;
    }

    return this;
  };

}(module.exports));
