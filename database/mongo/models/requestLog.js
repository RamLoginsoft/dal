(function ( models ) {
  var
  goose = require('mongoose'),
  Schema = goose.Schema;

  models.register = function ( existingConnection ) {

    var connection = existingConnection || goose;

    models.schemas = (function ( schemas ) {

      schemas.requestLog = new Schema({
        // alphabetically...
        accessId: { type: String, required: true },
        endpoint: { type: String, required: true },
        genericEndpoint: { type: String, required: true },
        grantee: { type: String, required: true },
        granteeLongName: { type: String, required: true },
        httpMethod: { type: String, required: true },
        hostname: { type: String, required: true },
        instanceId: { type: String, required: true },
        instanceName: { type: String, required: true },
        ip: { type: String, required: false },
        logType: { type: String, required: true },
        organizationId: { type: String, required: true },
        organizationName: { type: String, required: true },
        message: { type: Schema.Types.Mixed },
        payloadIn: { type: String, required: true },
        payloadOut: { type: String },
        port: { type: Number, required: true },
        productName: { type: String, required: true },
        productTags: { type: Object, required: true },
        queueState: { type:String },
        requestId: { type: String, required: true },
        requestType: { type: String, required: true },
        simpleApiKey: { type: String, required: true },
        statusCode: { type: Number },
        timestamp: {
          in: { type: Date, required: true },
          out: { type: Date },
          hour: { type: Date, required: true },
          day: { type: Date, required: true },
          elapsed: { type: Number },
          D: { type: Number, required: true }, // 1 - 31
          h: { type: Number, required: true }, // 1 - 12
          hA: { type: String, required: true }, // 1[AP]M-12[AP]M
          H: { type: Number, required: true }, // 1 - 24
          A: { type: String, required: true } // [AP]M
        },
        versionAlias: { type: String, required: true },
        versionNumber: { type: String, required: true }
      });

      schemas.subRequestLogItem = new Schema({
        // alphabetically...
        dateTimeFromApp: { type: Date, required: true },
        direction: { type: String, required: true },
        elapsedTimeInMs: { type: Number },
        httpMethod: { type: String },
        logType: { type: String, required: true },
        message: { type: Schema.Types.Mixed },
        payload: { type: String }, // can be null...
        parentId: { type: String, required: true },
        queueState: { type:String },
        requestId: { type: String, required: true },
        requestType: { type: String, required: true },
        statusCode: { type: Number },
        uri: {type: String }
      });

      schemas.subRequestLog = new Schema({
        // alphabetically...
        _id: goose.SchemaTypes.ObjectId,
        parentId: { type: String, required: true },
        subRequests: [schemas.subRequestLogItem]
      });

      return schemas;

    })({});

    models.RequestLog = connection.model(
      'RequestLog',
      models.schemas.requestLog,
      'requestLog');

    models.SubRequestLogItem = connection.model(
      'SubRequestLogItem',
      models.schemas.subRequestLogItem);

    models.SubRequestLog = connection.model(
      'SubRequestLog',
      models.schemas.subRequestLog,
      'subRequestLog');

    return models;
  };

}(module.exports));
