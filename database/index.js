var
_ = require('underscore'),
async = require('async'),
EventEmitter = require('events').EventEmitter,
moment = require("moment"),
mongo = require('./mongo'),
r = require('ramda'),
util = require('util');

var
azureStorage = require('../azure_storage'),
env = require('../../shared/environments').getRestifyEnvironment(),
dalConfig = require('../datastore/config')(env),
sqlDatabase = require('./sql-server'),
TYPES = sqlDatabase.getTypes(),
dto = require('../tools/dto'),
notifications = require('../modules/notifications'),
simcrypt = require('../modules/simcrypt'),
pool = sqlDatabase.getPool(),

db = {};
db.config = sqlDatabase.getConfig();
db.pool = pool;

db.mkrequest = function ( type, sql, params, done ) {
  this.pool.acquire(function ( error, connection ) {
    if(error) { return done(error); }
    sqlDatabase.execute(type, connection, sql, params, true, function ( executionError, rows, rowCount ) {
      connection.release();
      if(executionError) { return done(executionError); }
      return done(0, transformSync(rows));
    });
  });
  return customId();
};

db.getDocsKey = function ( options, done ) {
  var
  sql = 'GetDocsKey',
  params = [
    { name: 'Type', type: TYPES.VarChar, value: options.type }
  ];
  this.mkrequest('procedure', sql, params, done);
};

db.saveSession = function ( options, done ) {
  var sql = 'SaveSession',
      params = [
        { name: 'sid', type: TYPES.VarChar, value: options.sid },
        { name: 'sessionData', type: TYPES.VarChar, value: options.session }
      ];
  return this.mkrequest('procedure', sql, params, done);
};

db.getSession = function ( options, done ) {
  var sql = 'GetSession',
      params = [
        { name: 'sid', type: TYPES.VarChar, value: options.sid }
      ];
  return this.mkrequest('procedure', sql, params, done);
};

db.deleteSession = function ( options, done ) {
  var sql = 'DeleteSession',
      params = [
        { name: 'sid', type: TYPES.VarChar, value: options.sid }
      ];
  return this.mkrequest('procedure', sql, params, done);
};

db.getAdministrator = function(options, done) {
  var params = [ { name: 'AdminNumber', type: TYPES.Int, value: options.id } ],
      sql = 'GetAdministrator';
  return this.mkrequest('procedure', sql, params, done);
};

db.getRoles = function ( done ) {
  var sql = "SELECT Name FROM tbl.Roles";
  return this.mkrequest('statement', sql, [], done);
};

db.adminEmulation = function(options, done) {
  var params = [ { name: 'AdminNumber', type: TYPES.Int, value: options.id },
                 { name: 'EmulatedOrg', type: TYPES.VarChar, value: options.emulatedOrg || null } ];
  return this.mkrequest('procedure', 'AdminEmulation', params, done);
};

/**
 * Returns bridges and instances,
 * @param {string} organization id
 * @param {int} is obsolete
 * @return {array} count by organization id.
 */
db.getBridgesAndInstances = function(options, done) {
  var params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId },
    { name: 'ShowObsolete', type: TYPES.Bit, value: options.showObsolete }
  ];
  var sql = 'GetBridgesAndInstances';
  return this.mkrequest('procedure', sql, params, done);
};

/**
 * Returns purchase transactions
 * @param {string} datetime
 * @param {string} organization id
 * @return {array} count by organization id.
 */
db.getPurchasedTransactionQuantity = function(options, done) {
  var params = [{ name: 'ID', type: TYPES.Int, value: options.id || null }],
      sql = 'GetPurchasedTransactionQuantity';
  return this.mkrequest('procedure', sql, params, done);
};

/**
 * Returns an organizations transaction count from lastDateTime to now
 * @param {string} datetime
 * @param {string} organization id
 * @return {array} count by organization id.
 */
db.getTransactionsByOrg = function(options, done) {
  var params = [{ name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.OrganizationID},
                { name: 'LastDateTime', type: TYPES.DateTime2, value: options.LastDateTime }],
      sql = 'GetTransactionsByOrg';
  return this.mkrequest('procedure', sql, params, done);
};

/**
 * Returns an organizations TransactionState information
 * @param {string} organization ID.
 * @return {array} transaction state data.
 */
db.getTransactionStates = function(done) {
  var params = [];
  var sql = 'SELECT ts.ID'+
      ', ts.OrganizationID'+
      ', ts.AccessID'+
      ', ts.LastPurchasedQuantity'+
      ', tq.Fee'+
      ', ts.PurchaseType'+
      ', ts.Threshold'+
      ', ts.ThresholdType'+
      ', ts.RemainingTransactions'+
      ', ts.ProcessDateTime'+
      ' FROM tbl.TransactionState ts'+
      ' LEFT JOIN tbl.TransactionQuantities tq'+
      ' ON tq.Quantity = ts.LastPurchasedQuantity'+
      ' WHERE ts.LastPurchasedQuantity <> 0';
  return this.mkrequest('statement', sql, params, done);
};

/**
 * Returns an organizations TransactionState information
 * @param {string} organization ID.
 * @return {array} transaction state data.
 */
db._getTransactionState = function(orgId, done) {
  var params = [{ name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgId}];
  var sql = 'SELECT ts.ID'+
      ', ts.OrganizationID'+
      ', ts.AccessID'+
      ', ts.LastPurchasedQuantity'+
      ', tq.Fee'+
      ', ts.PurchaseType'+
      ', ts.Threshold'+
      ', ts.ThresholdType'+
      ', ts.RemainingTransactions'+
      ' FROM tbl.TransactionState ts'+
      ' LEFT JOIN tbl.TransactionQuantities tq'+
      ' ON tq.Quantity = ts.LastPurchasedQuantity'+
      ' WHERE ts.OrganizationID = @OrganizationID';
  return this.mkrequest('statement', sql, params, done);
};

/**
 * Returns an organizations SubscriptionPlan information
 * @param {string} organization ID.
 * @return {array} subscription plan data.
 */
db._getSubscriptionPlan = function(orgId, done) {
  var params = [{ name: 'ReferenceID', type: TYPES.UniqueIdentifier, value: orgId}];
  return this.mkrequest('procedure', 'GetSubscriptionPlan', params, done);
};

/**
 * Returns an array of Registered Product Types for an Organization.
 * @param {string} organization ID.
 * @return {array} product types list.
 */
db._getOrganizationRegisteredProductTypes = function( orgId, done ) {
  var params = [{ name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgId }];
  return this.mkrequest('procedure', 'GetOrganizationRegisteredProductTypes', params, done);
};

db.getAPIData = function ( options, done ) {
  var params = [
    {name: 'ApiName', type: TYPES.VarChar, value: options.apiName},
    {name: 'ProductName', type: TYPES.VarChar, value: options.productName},
    {name: 'VersionNumber', type: TYPES.VarChar, value: options.versionNumber}
  ];
  return this.mkrequest('procedure', 'pGetApiDataByName', params, done);
};

db.getAPIs = function ( options, done ) {
  var sql =
      "SELECT ID, Name, BaseUri FROM tbl.APIs " +
      "ORDER BY NAME ";
  return this.mkrequest('statement', sql, [], done);
};

db.getCustomEntityMaps = function ( options, done ) {
  return this.mkrequest('procedure', 'pGetCustomEntityMaps', [],  done);
};

db.getEmployerIntegrationByEmployerID = function ( options, done ) {
  var params = [
    { name: 'EmployerID', type: TYPES.VarChar, value: options.employerId || void 0 },
    { name: 'JobBoardOrgID', type: TYPES.UniqueIdentifier, value: options.orgId || void 0 }
  ];
  return this.mkrequest('procedure', 'GetEmployerIntegrationByEmployerID', params, done);
};

db.saveApi = function ( options, done ) {
  var params = [
    {name: 'Name', type: TYPES.VarChar, value: options.name },
    {name: 'BaseUri', type: TYPES.VarChar, value: options.baseUri },
    {name: 'ID', type: TYPES.UniqueIdentifier, value: options.id || undefined }
  ];
  return this.mkrequest('procedure', 'pSaveApi', params, done);
};

db.saveObject = function ( options, done ) {
  var params = [
    {name: 'Name', type: TYPES.VarChar, value: options.name},
    {name: 'Type', type: TYPES.VarChar, value: options.type},
    {name: 'Description', type: TYPES.VarChar, value: options.description},
    {name: 'DefaultValue', type: TYPES.VarChar, value: options.default},
    {name: 'ResourceUri', type: TYPES.VarChar, value: options.resourceUri},
    {name: 'ApiID', type: TYPES.UniqueIdentifier, value: options.apiId},
    {name: 'ID', type: TYPES.UniqueIdentifier, value: options.id || undefined}
  ];
  return this.mkrequest('procedure', 'pSaveObject', params, done);
};

db.saveObjectRelationship = function ( options, done ) {
  var params = [
    { name: 'ParentID', type: TYPES.UniqueIdentifier, value: options.parentId },
    { name: 'ChildID', type: TYPES.UniqueIdentifier, value: options.childId },
    { name: 'Scope', type: TYPES.VarChar, value: options.scope }
  ];

  if(r.isEmpty(options.id)) {
    sql = 'pInsertObjectComposition';
  } else {
    sql = 'pSaveObjectComposition';
    params.push({name: 'ID', type: TYPES.UniqueIdentifier, value: options.id});
  }

  return this.mkrequest('procedure', sql, params, done);
};

db.saveMethod = function ( options, done ) {
  var params = [
    {name: 'ObjectID', type: TYPES.UniqueIdentifier, value: options.objectId},
    {name: 'HttpMethod', type: TYPES.VarChar, value: options.httpMethod},
    {name: 'Notes', type: TYPES.VarChar, value: options.notes},
    {name: 'Summary', type: TYPES.VarChar, value: options.summary},
    {name: 'NickName', type: TYPES.VarChar, value: options.nickname},
    {name: 'ID', type: TYPES.UniqueIdentifier, value: options.id || null},
    {name: 'ResponseID', type: TYPES.UniqueIdentifier, value: options.responseId || null},
    {name: 'Scope', type: TYPES.VarChar, value: options.scope}
  ];
  return this.mkrequest('procedure', 'pSaveMethod', params, done);
};

db.saveMethodParameter = function ( options, done ) {
  var params = [
    {name: 'MethodID', type: TYPES.UniqueIdentifier, value: options.methodId},
    {name: 'ObjectID', type: TYPES.UniqueIdentifier, value: options.objectId},
    {name: 'AllowMultiple', type: TYPES.Bit, value: options.allowMultiple},
    {name: 'Required', type: TYPES.Bit, value: options.required},
    {name: 'ParamType', type: TYPES.VarChar, value: options.paramType},
    {name: 'Name', type: TYPES.VarChar, value: options.parameterName},
    {name: 'Description', type: TYPES.VarChar, value: options.description}
  ], sql;

  if(r.isEmpty(options.id)) {
    sql = 'pInsertMethodParameter';
  } else {
    sql = 'pSaveMethodParameter';
    params.push({name: 'ID', type: TYPES.UniqueIdentifier, value: options.id});
  }

  return this.mkrequest('procedure', sql, params, done);
};

db.saveMethodSignature = function ( options, done ) {
  var params = [
    {name: 'ID', type: TYPES.UniqueIdentifier, value: options.id || null },
    {name: 'SignatureID', type: TYPES.UniqueIdentifier, value: options.signatureId || null },
    {name: 'MethodParameterID', type: TYPES.UniqueIdentifier, value: options.methodParameterId }
  ];
  return this.mkrequest('procedure', 'pSaveMethodSignature', params, done);
};

db.saveProductVersionMethod = function ( options, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: options.id },
    { name: "ProductName", type: TYPES.VarChar, value: options.productName },
    { name: 'VersionNumber', type: TYPES.VarChar, value: options.versionNumber },
    { name: 'MethodID', type: TYPES.UniqueIdentifier, value: options.methodId },
    { name: 'Notes', type: TYPES.VarChar, value: options.notes }
  ];
  return this.mkrequest('procedure', 'pSaveProductVersionMethod', params, done);
};

db.saveProductVersionMethodParameter = function ( options, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: options.id },
    { name: 'ProductName', type: TYPES.VarChar, value: options.productName },
    { name: 'VersionNumber', type: TYPES.VarChar, value: options.versionNumber },
    { name: 'MethodParameterID', type: TYPES.UniqueIdentifier, value: options.methodParameterId },
    { name: 'Required', type: TYPES.Bit, value: options.required },
    { name: 'Description', type: TYPES.VarChar, value: options.description },
    { name: 'MapsTo', type: TYPES.VarChar, value: options.mapsTo }
  ];
  return this.mkrequest('procedure', 'pSaveProductVersionMethodParameter', params, done);
};

db.saveProductVersionObject = function ( options, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: options.id },
    { name: "ProductName", type: TYPES.VarChar, value: options.productName },
    { name: 'VersionNumber', type: TYPES.VarChar, value: options.versionNumber },
    { name: 'ObjectID', type: TYPES.UniqueIdentifier, value: options.objectId }
    //{ name: 'MapsTo', type: TYPES.UniqueIdentifier, value: options.mapsTo }
  ];
  return this.mkrequest('procedure', 'pSaveProductVersionObject', params, done);
};

db.saveProductVersionApi = function ( options, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: options.id },
    { name: "ProductName", type: TYPES.VarChar, value: options.productName },
    { name: 'VersionNumber', type: TYPES.VarChar, value: options.versionNumber },
    { name: 'ApiID', type: TYPES.UniqueIdentifier, value: options.apiId }
  ];
  return this.mkrequest('procedure', 'pSaveProductVersionApi', params, done);
};

db.saveProductVersionMethodConfiguration = function ( options, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: options.id },
    { name: "ProductName", type: TYPES.VarChar, value: options.productName },
    { name: 'VersionNumber', type: TYPES.VarChar, value: options.versionNumber },
    { name: 'SignatureID', type: TYPES.UniqueIdentifier, value: options.signatureId },
    { name: 'ConfigFieldID', type: TYPES.VarChar, value: options.configFieldId },
    { name: 'Required', type: TYPES.Bit, value: options.required }
  ];
  return this.mkrequest('procedure', 'pSaveProductVersionMethodConfiguration', params, done);
};

db.deleteApi = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteApi', params, done);
};

db.deleteObject = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteObject', params, done);
};

db.deleteMethod = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteMethod', params, done);
};

db.deleteMethodParameter = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteMethodParameter', params, done);
};

db.deleteMethodSignature = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteMethodSignature', params, done);
};

db.deleteObjectRelationship = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteObjectComposition', params, done);
};

db.deleteProductVersionMethodConfiguration = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteProductVersionMethodConfiguration', params, done);
};

db.deleteProductVersionObject = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteProductVersionObject', params, done);
};

db.deleteProductVersionApi = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteProductVersionApi', params, done);
};

db.deleteProductVersionMethod = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteProductVersionMethod', params, done);
};

db.deleteProductVersionMethodParameter = function ( id, done ) {
  var params = [
    { name: 'ID', type: TYPES.UniqueIdentifier, value: id }
  ];
  return this.mkrequest('procedure', 'pDeleteProductVersionMethodParameter', params, done);
};

db.getTableRecordsCount = function ( options, done ) {
  var params = [];
  var operator = options.operator ? options.operator : '='; // default to "="
  var sql =
      " SELECT COUNT(ID) AS [Count] " +
      " FROM " + options.table +
      " WHERE " + options.column + " " + operator + " " + options.value;
  return this.mkrequest('statement', sql, params, done);
};

db.getTableRecords = function ( options, done ) {
  var params = [];
  var operator = options.operator ? options.operator : '='; // default to "="
  var sql = options.rowCount ? "SELECT TOP " + options.rowCount : "SELECT ";
  _.each(options.columns, function(e, i) {
    if(i === 0) {
      sql += " " + e;
    } else {
      sql += " ," + e;
    }
  });
  sql += " FROM " + options.table +
    " WHERE " + options.column + " " + operator + " " + options.value;
  return this.mkrequest('statement', sql, params, done);
};

db.getTestBridges = function ( options, done ) {
  var sql =
      "SELECT SimpleApiKey, ProductName, VersionNumber, LongName, AuthValues, ConfigValues " +
      "FROM tbl.Bridges b " +
      "JOIN tbl.Instances i ON i.InstanceID = b.InstanceID " +
      "JOIN tbl.BridgeMetaData bmd ON bmd.BridgeID = b.ID " +
      "WHERE bmd.UnitTest = 1 ";
  return this.mkrequest('statement', sql, [], done);
};

db.logIpnReceipt = function ( options, done ) {
  var params = [
    { name: 'TransactionType', type: TYPES.VarChar, value: options.transactionType },
    { name: 'KeyName', type: TYPES.VarChar, value: options.keyName },
    { name: 'KeyValue', type: TYPES.VarChar, value: options.keyValue },
    { name: 'Message', type: TYPES.VarChar, value: options.message }
  ];
  return this.mkrequest('procedure', 'LogIpnReceipt', params, done);
};

db.logIpnValidity = function ( options, done ) {
  var params = [
    { name: 'ID', type: TYPES.Int, value: options.id },
    { name: 'Valid', type: TYPES.Bit, value: options.valid }
  ];
  return this.mkrequest('procedure', 'LogIpnValidity', params, done);
};

db.saveTransactionState = function ( options, done ) {
  var proc = 'AddNewTransactionState';
  var params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId || null },
    { name: 'AccessID', type: TYPES.UniqueIdentifier, value: options.accessId || null },
    { name: 'LastPurchasedQuantity', type: TYPES.Int, value: options.lastPurchasedQuantity || null },
    { name: 'PurchaseType', type: TYPES.VarChar, value: options.purchaseType || null },
    { name: 'Threshold', type: TYPES.Int, value: options.threshold || null },
    { name: 'ThresholdType', type: TYPES.VarChar, value: options.thresholdType || null },
    { name: 'RemainingTransactions', type: TYPES.Int, value: options.remainingTransactions || null },
    { name: 'ThresholdAction', type: TYPES.VarChar, value: options.thresholdAction || null },
    { name: 'Notify', type: TYPES.Bit, value: options.notify || null },
  ];
  if (options.id || options.organizationId) {
    proc = 'UpdateTransactionState';
    params.push({ name: 'ID', type: TYPES.Int, value: options.id });
    params.push({ name: 'WhoModified', type:TYPES.VarChar, value: options.whoModified });
    params.push({ name: 'ProcessDateTime', type: TYPES.DateTime, value: options.processDateTime });
  } else {
    params.push({ name: 'WhoCreated', type:TYPES.VarChar, value: options.whoCreated });
  }

  return this.mkrequest('procedure', proc, params, done);
};

db.saveSubscriptionPlan = function ( options, done ) {
  var proc = 'UpdateSubscriptionPlan',
      params = [
        { name: 'ReferenceID', type: TYPES.UniqueIdentifier, value: options.referenceId },
        { name: 'SubscriptionPeriod', type: TYPES.Int, value: options.subscriptionPeriod },
        { name: 'SetupFeeInvoiced', type: TYPES.Bit, value: options.setupFeeInvoiced },
        { name: 'StartDate', type: TYPES.DateTime, value: options.startDate },
        { name: 'SubscriptionPlanTypeId', type: TYPES.Int, value: options.subscriptionPlanId },
        { name: 'PaymentGatewaySetupStatusID', type: TYPES.Int, value: options.paymentGatewaySetupStatusId },
        { name: 'EndDate', type: TYPES.DateTime, value: options.endDate }];

  return this.mkrequest('procedure', proc, params, done);
};

db.savePayPalAccountData = function ( options, done ) {
  var proc = 'AddNewPayPalAccount',
      params = [
        { name: 'PayerID', type: TYPES.VarChar, value: options.payerId },
        { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId },
        { name: 'Email', type: TYPES.VarChar, value: options.email },];

  if (options.id) {
    proc = 'UpdatePayPalAccount';
    params.push({ name: 'ID', type: TYPES.Int, value: options.id });
    params.push({ name: 'Active', type: TYPES.Bit, value: options.active });
    params.push({ name: 'WhoModified', type: TYPES.VarChar, value: options.whoModified });
  } else {
    params.push({ name: 'WhoCreated', type: TYPES.VarChar, value: options.whoCreated });
  }
  return this.mkrequest('procedure', proc, params, done);
};

db.getPayPalOrganization = function ( options, done ) {
  var params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId },
    { name: 'PayerID', type: TYPES.VarChar, value: options.payerId }];

  return this.mkrequest('procedure', 'GetPayPalPayerID', params, done);
};

db.getPaymentReceiptDetails = function ( options, done ) {
  var proc = 'GetPaymentReceiptDetails';
  var params = [
    { name: 'PaymentID', type: TYPES.Int, value: options.paymentId },
    { name: 'ChargeID', type: TYPES.Int, value: options.chargeId }
  ];
  return this.mkrequest('procedure', proc, params, done);
};

db.getPayment = function ( options, done ) {
  var params = [
    { name: 'ID', type: TYPES.Int, value: options.id }];
  return this.mkrequest('procedure', 'GetBillingPayment', params, done);
};

db.savePayment = function ( options, done ) {
  var proc = 'AddNewBillingPayment',
      params = [
        { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId },
        { name: 'AccessID', type: TYPES.UniqueIdentifier, value: options.accessId },
        { name: 'Amount', type: TYPES.SmallMoney, value: options.amount },
        { name: 'BillingPaymentTypeID', type: TYPES.Int, value: options.paymentTypeId },
        { name: 'PayerID', type: TYPES.VarChar, value: options.payerId },
        { name: 'ProductType', type: TYPES.VarChar, value: options.productType },
        { name: 'Notify', type: TYPES.Bit, value: options.notify }];

  if (options.id) {
    proc = 'UpdateBillingPayment';
    params.push({ name: 'ID', type: TYPES.Int, value: options.id });
    params.push({ name: 'WhoModified', type: TYPES.VarChar, value: options.whoModified });
  } else {
    params.push({ name: 'WhoCreated', type: TYPES.VarChar, value: options.whoCreated });
  }
  return this.mkrequest('procedure', proc, params, done);
};

db.getCharge = function ( options, done ) {
  var proc, params = [];

  if(options.id) {
    proc = 'GetBillingCharge';
    params.push({ name: 'ID', type: TYPES.Int, value: options.value });
  }

  return this.mkrequest('procedure', proc, params, done);
};

db.saveCharge = function ( options, done ) {
  var proc = 'AddNewBillingCharge',
      params = [
        { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId },
        { name: 'AccessID', type: TYPES.UniqueIdentifier, value: options.accessId },
        { name: 'Amount', type: TYPES.SmallMoney, value: options.amount },
        { name: 'PayerID', type: TYPES.VarChar, value: options.payerId }];
  if (options.id) {
    proc = 'UpdateBillingCharge';
    params.push({ name: 'ID', type: TYPES.Int, value: options.id });
    params.push({ name: 'WhoModified', type: TYPES.VarChar, value: options.whoModified });
  } else {
    params.push({ name: 'Volume', type: TYPES.BigInt, value: options.volume });
    params.push({ name: 'BridgeName', type: TYPES.VarChar, value: options.bridgeName });
    params.push({ name: 'ProductType', type: TYPES.VarChar, value: options.productType });
    params.push({ name: 'WhoCreated', type: TYPES.VarChar, value: options.whoCreated });
  }
  return this.mkrequest('procedure', proc, params, done);
};

db.getAppConfiguration = function ( options, done ) {
  return done(null, global.config);
};

db.getPaymentHistory = function ( options, done ) {
  var params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId }
  ];
  return this.mkrequest('procedure', 'GetPaymentHistoryForOrganization', params, done);
};

db.getPaymentNotifications = function ( options, done ) {
  var params = [];
  return this.mkrequest('procedure', 'GetPaymentNotifications', params, done);
};

db.getThresholdNotifications = function ( options, done ) {
  var params = [];
  return this.mkrequest('procedure', 'GetThresholdNotifications', params, done);
};

db.getTransactionQuantity = function ( options, done ) {
  var proc = 'getTransactionQuantity',
      params = [
        { name: 'ID', type: TYPES.Int, value: options.id }
      ];
  return this.mkrequest('procedure', proc, params, done);
};

db.getTransactionState = function ( options, done ) {
  var proc = 'GetTransactionState',
      params = [
        { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId}
      ];
  return this.mkrequest('procedure', proc, params, done);
};

db.savePurchasedTransactionQuantity = function ( options, done ) {
  var proc = 'AddNewPurchasedTransactionQuantity',
      params = [
        { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId },
        { name: 'Quantity', type: TYPES.Int, value: options.quantity || null },
        { name: 'Processed', type: TYPES.Bit, value: options.processed || 0 },
      ];
  if (options.id) {
    proc = 'UpdatePurchasedTransactionQuantity';
    params.push({ name: 'ID', type: TYPES.Int, value: options.id });
    params.push({ name: 'WhoModified', type: TYPES.VarChar, value: options.whoModified });
  } else {
    params.push({ name: 'WhoCreated', type: TYPES.VarChar, value: options.whoCreated });
  }
  return this.mkrequest('procedure', proc, params, done);
};

db.getCertifiedOrganizations = function ( options, done ) {
  var params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId }
  ];
  var sql = 'GetCertifiedOrganizations';
  return this.mkrequest('procedure', sql, params, done);
};

db.getOrganization = function ( options, done ) {
  var params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId }
  ],

  // sql =
  //   'SELECT [OrganizationID], [OwnerID], [LongName], [ShortName], ' +
  //   '[Description], [URL], [IsIntegrated], [IsVendor], [AddressID],[Street1], ' +
  //       '[Street2],[City],[StateCode],[PostalCode],' +
  //       '[BillingAddressID], [BillingStreet1], [BillingStreet2], [BillingCity],[BillingStateCode], [BillingPostalCode]' +
  //   'FROM [dbo].[Organizations] ' +
  //   'WHERE (@OrganizationID IS NULL OR OrganizationID = @OrganizationID)';


  sql = 'SELECT o.[OrganizationID],o.[OwnerID],o.[LongName],o.[ShortName], o.[Description], o.[Image], '+
      ' o.[Description],o.[URL],o.[IsVendor],Ad.[AddressID],Ad.[Street1], '+
      ' Ad.[Street2],Ad.[City],Ad.[StateCode],Ad.[CountryCode],Ad.[PostalCode], ot.[ID] as orgType, '+
      ' Bd.[Street1] as [BillingStreet1], Bd.[Street2] as [BillingStreet2], '+
      ' Bd.[City] as [BillingCity],Bd.[StateCode] as [BillingStateCode],Bd.[CountryCode] as [BillingCountryCode], Bd.[PostalCode] as [BillingPostalCode] '+
      ' FROM [tbl].[Organizations] o '+
      ' JOIN  tbl.OrganizationTypes ot ON ot.ID = o.OrganizationType '+
      ' Join  tbl.Addresses Bd on Bd.AddressID = o.BillingAddressID '+
      ' Join  tbl.Addresses Ad on Ad.AddressID = o.AddressID '+
      ' WHERE (@OrganizationID IS NULL OR OrganizationID = @OrganizationID)';


  return this.mkrequest('statement', sql, params, done);
};

db.getRelationships = function ( options, done ) {
  var params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId }
  ];
  var sql = 'GetRelationships';
  return this.mkrequest('procedure', sql, params, done);
};

db.getSyndicationChannel = function ( options, done ) {
  var params = [
    { name: 'Channel', type: TYPES.VarChar, value: options.channel }
  ];
  var sql =
      'SELECT ID, GroupID, Title, Generator, RssDescription [Description], RssLink [Link],' +
      '       RssLanguage [Language], RssPubDate [PubDate], AtomID, AtomAuthor, AtomLink,' +
      '       RssWebMaster [WebMaster] ' +
      'FROM tbl.SyndicationChannels ' +
      'WHERE Title = @Channel';
  return this.mkrequest('statement', sql, params, dto.wrapCallback(done));
};

db.saveSyndicationItem = function ( options, done ) {
  var
  sql,
  params = [
    { name: 'ChannelID', type: TYPES.Int, value: options.channelId },
    { name: 'Title', type: TYPES.NVarChar, value: options.title },
    { name: 'Description', type: TYPES.NVarChar, value: options.description },
    { name: 'RssLink', type: TYPES.NVarChar, value: options.link },
    { name: 'GUID', type: TYPES.NVarChar, value: options.guid },
    { name: 'PubDate', type: TYPES.NVarChar, value: options.pubDate }
  ];
  if(options.id) {
    params.push({name:'ID', type: TYPES.Int, value: options.id});
    params.push({name:'WhoModified', type: TYPES.NVarChar, value: options.whoModified});
    sql = 'UpdateSyndicationItem';
  } else {
    params.push({ name: 'WhoCreated', type: TYPES.NVarChar, value: options.whoCreated });
    sql = 'AddNewSyndicationItem';
  }
  return this.mkrequest('procedure', sql, params, done);
};

db.getSyndicationItems = function ( options, done ) {
  var params = [
    { name: 'Channel', type: TYPES.VarChar, value: options.channel }
  ];
  var sql =
      'SELECT i.ID, i.ChannelID, i.Title, i.Description, i.RssLink [Link], i.WhoModified,' +
      '       i.GUID, i.PubDate, i.DateCreated, i.DateModified, i.WhoCreated ' +
      'FROM tbl.SyndicationItems i JOIN tbl.SyndicationChannels c ON c.ID = i.ChannelID ' +
      'WHERE c.Title = @Channel ' +
      'ORDER BY i.PubDate DESC';
  return this.mkrequest('statement', sql, params, dto.wrapCallback(done));
};

db.getInstances = function ( options, done ) {
  var
  params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId }
  ],
  sql = 'GetInstances';
  if (options.relationshipOrgId) {
    params.push({
      name: 'RelationshipWithOrg', type: TYPES.UniqueIdentifier, value: options.relationshipOrgId
    });
    sql = 'GetSharedInstances';
  }
  return this.mkrequest('procedure', sql, params, done);
};

db.getInstanceAccessRecords = function ( options, done ) {
  var params = [
    { name: 'InstanceID', type: TYPES.UniqueIdentifier, value: options.instanceId },
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId }];
  var sql = 'GetBridges';
  if (options.relationshipOrgId) {
    params.push({
      name: 'RelationshipWithOrg', type: TYPES.UniqueIdentifier, value: options.relationshipOrgId
    });
    sql = 'GetSharedBridges';
  }
  return this.mkrequest('procedure', sql, params, done);
};

db.getAccessApiKey = function ( options, done ) {
  var params = [{
    name: 'AccessID', type: TYPES.UniqueIdentifier, value: options.accessId
  }];
  var sql =
      'SELECT SimpleAPIKey ' +
      'FROM tbl.Bridges ' +
      'WHERE ID = @AccessID';
  return this.mkrequest('statement', sql, params, done);
};

db.verifySubscriptions = function ( options, done ) {
  var params = [{
    name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId
  }];
  var sql = 'GetSubscriptionStatus';
  return this.mkrequest('procedure', sql, params, done);
};

// ............................................................. from /admin/modules

db.getBridgeActivityIntervalSummary = function(options, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId},
    {name: 'Range', type: TYPES.Int, value: options.range},
    {name: 'Interval', type: TYPES.VarChar, value: options.unit},
    {name: 'Offset', type: TYPES.Int, value: options.offset},
    {name: 'AccessID', type: TYPES.UniqueIdentifier, value: options.accessId},
    {name: 'BridgeID', type: TYPES.UniqueIdentifier, value: options.bridgeId},
    {name: 'OwnerID', type: TYPES.UniqueIdentifier, value: options.ownerId},
    {name: 'RequestorID', type: TYPES.UniqueIdentifier, value: options.requestorId}
  ];

  switch(options.reportType) {
  case "totalRequests":
    return this.mkrequest('procedure', 'BridgeActivityIntervalSummary', params, done);
  case "averageResponseTime":
    return this.mkrequest('procedure', 'BridgeActivityIntervalAverageResponseTime', params, done);
  case "longRunningRequests":
    params.push({name: 'threshold', type: TYPES.Int, value: options.threshold});
    return this.mkrequest('procedure', 'BridgeActivityIntervalLongRunning', params, done);
  case "sapiErrors":
    params.push({ name: 'productType', type: TYPES.VarChar, value: 'API' });
    return this.mkrequest('procedure', 'BridgeActivityIntervalErrors', params, done);
  case "productErrors":
    params.push({ name: 'productType', type: TYPES.VarChar, value: 'product' });
    return this.mkrequest('procedure', 'BridgeActivityIntervalErrors', params, done);
  default:
    return done(null, []);
  }
};

db.getBridgeActivityRoutesSummary = function(options, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId },
    {name: 'Range', type: TYPES.Int, value: options.range},
    {name: 'Interval', type: TYPES.VarChar, value: options.unit},
    {name: 'offset', type: TYPES.Int, value: options.offset},
    {name: 'AccessID', type: TYPES.UniqueIdentifier, value: options.accessId},
    {name: 'BridgeID', type: TYPES.UniqueIdentifier, value: options.bridgeId},
    {name: 'OwnerID', type: TYPES.UniqueIdentifier, value: options.ownerId},
    {name: 'RequestorID', type: TYPES.UniqueIdentifier, value: options.requestorId}
  ];
  return this.mkrequest('procedure', 'BridgeActivityRoutesSummary', params, done);
};

db.getBridgeActivitySummary = function(options, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: options.OrganizationID},
    {name: 'Range', type: TYPES.Int, value: options.Range},
    {name: 'Interval', type: TYPES.VarChar, value: options.Interval},
    {name: 'offset', type: TYPES.Int, value: options.offset},
    {name: 'threshold', type: TYPES.Int, value: options.threshold}
  ];
  return this.mkrequest('procedure', 'BridgeActivitySummary', params, done);
};

db.requestPasswordReset = function(email, done) {
  var params = [
    {name: 'Email', type: TYPES.VarChar, value: email},
  ];
  return this.mkrequest('procedure', 'pRequestPasswordReset', params, done);
};

db.resetPassword = function(id, password, done) {
  var params = [
    {name: 'ResetKey', type: TYPES.UniqueIdentifier, value: id},
    {name: 'PasswordHash', type: TYPES.VarChar, value: simcrypt.sha1(password)}
  ];
  return this.mkrequest('procedure', 'pResetPassword', params, done);
};

db.getBridgeAccess = function(orgid, granteeid, access, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgid},
    {name: 'Grantee', type: TYPES.UniqueIdentifier, value: granteeid}
  ];
  var sql = {
    none: "select  i.[InstanceID],i.[OrganizationID],i.[LongName],i.[ShortName]"+
      ",i.[Description],i.[TypeOfEnvironment],i.[IsActive],i.[ConfigValues]"+
      ",i.[ProductName],i.[VersionNumber],i.[VersionAlias],i.[IsObsolete]"+
      ",i.[ProductLongName],i.[ReleaseDate],i.[EndOfSupportDate],i.[ConfigFields]"+
      ",i.[AuthorizationFields]"+
      " from instances i left join bridges b on b.instanceid = i.instanceid"+
      " and b.grantee = @Grantee where i.organizationid = @OrganizationID"+
      " and b.instanceid is null or ( b.instanceid is not null and b.SimpleAPIKey is null)"+
      " and i.IsObsolete = 0 and b.Grantee <> i.OrganizationID" +
      " and b.OrganizationID = @OrganizationID",
    granted: "select  i.[InstanceID],i.[OrganizationID],i.[LongName],i.[ShortName]"+
      ",i.[Description],i.[TypeOfEnvironment],i.[IsActive],i.[ConfigValues]"+
      ",i.[ProductName],i.[VersionNumber],i.[VersionAlias],i.[IsObsolete]"+
      ",i.[ProductLongName],i.[ReleaseDate],i.[EndOfSupportDate],i.[ConfigFields]"+
      ",i.[AuthorizationFields]"+
      " from instances i left join bridges b on b.instanceid = i.instanceid"+
      " and b.grantee = @Grantee where i.organizationid = @OrganizationID"+
      " and b.instanceid is not null and b.SimpleAPIKey is not null"+
      " and i.IsObsolete = 0" +
      " and b.OrganizationID = @OrganizationID",
  };
  return this.mkrequest('statement', sql[access], params, done);
};

db.getBridge = function(bridge, done) {
  var params = [
    {name: 'InstanceID', type: TYPES.UniqueIdentifier, value: bridge.instanceid},
    {name: 'Grantee', type: TYPES.UniqueIdentifier, value: bridge.organizationid}
  ];
  var sql = "select b.InstanceID, b.Grantee, b.GranteeShortName, b.GranteeLongName, b.GranteeIsVendor, b.AuthValues,"+
      "b.SimpleAPIKey, b.OrganizationID, o.LongName as OrganizationName, b.ProductName, b.VersionNumber, b.LongName, b.ShortName, b.Description,"+
      "b.TypeOfEnvironment, b.InstanceIsActive, b.ConfigValues, p.ConfigFields, p.AuthorizationFields, p.ProductType"+
      " from Bridges b join ProductVersions p on b.ProductName = p.ProductName and b.VersionNumber = p.VersionNumber" +
      " join Organizations o on b.OrganizationID = o.OrganizationID " +
      "and b.InstanceID = @InstanceID and b.Grantee = @Grantee ";
  return this.mkrequest('statement', sql, params, done);
};

db.saveBridge = function(bridge, done) {
  var params = [
    {name: 'AccessID', type: TYPES.UniqueIdentifier, value: bridge.accessId || '00000000-0000-0000-0000-000000000000'},
    {name: 'InstanceID', type: TYPES.UniqueIdentifier, value: bridge.instanceid},
    {name: 'PersonID', type: TYPES.VarChar, value: bridge.personId},
    {name: 'Grantee', type: TYPES.UniqueIdentifier, value: bridge.organizationid},
    {name: 'AuthValues', type: TYPES.VarChar, value: bridge.authValues}
  ];
  return this.mkrequest('procedure', 'pSaveBridge', params, done);
};

db.deleteBridge = function(bridge, done) {
  var params = [
    { name: 'AccessID', type: TYPES.UniqueIdentifier, value: bridge.accessId }
  ];
  return this.mkrequest('procedure', 'DeleteBridge', params, done);
};

db.deleteOrganizationBridges = function(data, done) {
  var params = [
    {name: 'Grantee', type: TYPES.UniqueIdentifier, value: data.grantee},
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: data.organizationId}
  ];
  var sql = "UPDATE b" +
      " SET IsObsolete = 1" +
      " OUTPUT deleted.InstanceID" +
      " , deleted.Grantee" +
      " , deleted.AuthValues" +
      " , deleted.SimpleAPIKey" +
      " , deleted.AdminNumber" +
      " , deleted.UserID" +
      " , deleted.IsObsolete" +
      " INTO audit.Bridges" +
      " ( InstanceID, Grantee, AuthValues, SimpleAPIKey, AdminNumber, UserID, IsObsolete )" +
      " FROM tbl.Bridges b" +
      " INNER JOIN tbl.Instances i" +
      " ON i.InstanceID = b.InstanceID" +
      " WHERE b.Grantee = @Grantee" +
      " AND i.OrganizationID = @OrganizationID";
  return this.mkrequest('statement', sql, params, done);
};

db.toggleBridge = function(bridge, done) {
  var params = [
    {name: 'AccessID', type: TYPES.UniqueIdentifier, value: bridge.accessId}
  ];
  if(!bridge.status) {
    return this.mkrequest('procedure', 'pReactivateBridge', params, done);
  } else {
    return this.mkrequest('procedure', 'pDeactivateBridge', params, done);
  }
};

// TODO: Needs unit test
db.getAPIKeyData = function(key, done) {
  var params = [
    {name: 'SimpleAPIKey', type: TYPES.UniqueIdentifier, value: key},
  ];
  return this.mkrequest('procedure', 'pUnlockBridge', params, done);
};

db.createInstance = function(instance, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: instance.organizationid},
    {name: 'PersonID', type: TYPES.VarChar, value: instance.personId},
    {name: 'ProductName', type: TYPES.VarChar, value: instance.productName},
    {name: 'VersionNumber', type: TYPES.VarChar, value: instance.versionNumber},
    {name: 'LongName', type: TYPES.VarChar, value: instance.longName},
    {name: 'ShortName', type: TYPES.VarChar, value: instance.shortName},
    {name: 'Description', type: TYPES.VarChar, value: instance.description},
    {name: 'TypeOfEnvironment', type: TYPES.VarChar, value: instance.environment},
    {name: 'IsActive', type: TYPES.Bit, value: parseInt(instance.status, 10)},
    {name: 'ConfigValues', type: TYPES.VarChar, value: instance.configValues}
  ];
  return this.mkrequest('procedure', 'pCreateInstance', params, done);
};


db.getInstancesAndBridges = function(orgid, done) {
  var params = [{name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgid}];
  var sql = "select i.InstanceID, b.Grantee, b.GranteeLongName, b.AccessID, b.RefOrganization, i.OrganizationID,"+
      "CASE WHEN o.organizationid IS NOT NULL THEN o.LongName ELSE g.LongName END AS Organization,"+
      "i.LongName, i.ShortName, i.Description, pv.ProductType,"+
      "i.TypeOfEnvironment, i.IsActive, i.ConfigValues, i.ProductName, i.VersionNumber, i.VersionAlias,"+
      "i.IsObsolete, i.ProductLongName, i.ReleaseDate, i.EndOfSupportDate, i.ConfigFields, i.AuthorizationFields,"+
      "CASE WHEN i.OrganizationID <> @OrganizationID THEN 'Granted Access' ELSE 'Managed' END BridgeType"+
      " from Instances i inner join Bridges b on i.InstanceID = b.InstanceID"+
      " left join organizations o on o.organizationid = b.reforganization"+
      " inner join organizations g on g.organizationid = b.OrganizationID "+
      " join ProductVersions pv on i.ProductName = pv.ProductName AND i.VersionNumber = pv.VersionNumber "+
      " where (i.OrganizationID = @OrganizationID"+
      " or b.grantee = @OrganizationID)"+
      " and b.SimpleAPIKey is not null";
  return this.mkrequest('statement', sql, params, done);
};

// TODO: Add unit test
db.getIntegratedVendorContacts = function(orgid, ownerid, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgid},
    {name: 'OwnerID', type: TYPES.UniqueIdentifier, value: ownerid}
  ];
  var sql = "SELECT ContactID FROM Contacts WHERE OrganizationID = @OrganizationID" +
      " AND OwnerID = @OwnerID";
  return this.mkrequest('statement', sql, params, done);
};

// TODO: Add unit test
db.getInstanceById = function(instanceid, done) {
  var params = [
    {name: 'InstanceID', type: TYPES.UniqueIdentifier, value: instanceid}
  ];
  var sql = "select i.InstanceID, i.OrganizationID, i.LongName, i.ShortName, i.Description, p.ProductType,"+
      "i.TypeOfEnvironment, i.IsActive, i.ConfigValues, p.ProductName, p.VersionNumber, p.VersionAlias,"+
      "i.IsObsolete, p.LongName, i.ReleaseDate, i.EndOfSupportDate, p.ConfigFields, p.AuthorizationFields"+
      " from Instances i, ProductVersions p"+
      " where InstanceID = @InstanceID and i.ProductName = p.ProductName and i.VersionNumber = p.VersionNumber";
  return this.mkrequest('statement', sql, params, done);
};

db.getInstance = function(instance, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: instance.organizationid},
    {name: 'ProductName', type: TYPES.VarChar, value: instance.productName},
    {name: 'VersionNumber', type: TYPES.VarChar, value: instance.versionNumber},
    {name: 'TypeOfEnvironment', type: TYPES.VarChar, value: instance.environment}
  ];
  var sql = "select i.InstanceID, i.OrganizationID, i.LongName, i.ShortName, i.Description,"+
      "i.TypeOfEnvironment, i.IsActive, i.ConfigValues, p.ProductName, p.VersionNumber, p.VersionAlias,"+
      "i.IsObsolete, p.LongName, i.ReleaseDate, i.EndOfSupportDate, p.ConfigFields, p.AuthorizationFields"+
      " from Instances i, ProductVersions p where i.OrganizationID = @OrganizationID and p.ProductName = @ProductName"+
      " and p.VersionNumber = @VersionNumber and i.TypeOfEnvironment = @TypeOfEnvironment";
  return this.mkrequest('statement', sql, params, done);
};

db.updateInstance = function ( instance, done ) {
  return this.mkrequest('procedure',
                        'pUpdateInstance',
                        [{name: 'InstanceID', type: TYPES.UniqueIdentifier, value: instance.id},
                         {name: 'ProductName', type: TYPES.VarChar, value: instance.productName},
                         {name: 'VersionNumber', type: TYPES.VarChar, value: instance.versionNumber},
                         {name: 'LongName', type: TYPES.VarChar, value: instance.longName},
                         {name: 'ShortName', type: TYPES.VarChar, value: instance.shortName},
                         {name: 'Description', type: TYPES.VarChar, value: instance.description},
                         {name: 'TypeOfEnvironment', type: TYPES.VarChar, value: instance.environment},
                         {name: 'IsActive', type: TYPES.Bit, value: (parseInt(instance.status, 10))},
                         {name: 'ConfigValues', type: TYPES.VarChar, value: instance.configValues},
                         {name: 'Locked', type: TYPES.Bit, value: instance.locked},
                         {name: 'LockedMessage', type: TYPES.VarChar, value: instance.lockedMessage},
                         {name: 'LockedSince', type: TYPES.DateTime, value: instance.lockedSince}],
                        done);
};

db.deleteInstance = function(instance, done) {
  var params = [
    {name: 'InstanceID', type: TYPES.UniqueIdentifier, value: instance.id}
  ];
  return this.mkrequest('procedure', 'pDeleteInstance', params, done);
};

db.deleteEmployerIntegration = function(integration, done) {
  var params = [
    {name: 'ID', type: TYPES.Int, value: integration.integrationId},
    {name: 'WhoDeleted', type: TYPES.VarChar, value: integration.whoDeleted}
  ];
  return this.mkrequest('procedure', 'DeleteEmployerIntegration', params, done);
};

db.createUser = function(sessionid, user, done) {
  var password = '';
  if(!_.isEmpty(user.passwordHash))
    password = simcrypt.sha1(user.passwordHash);
  var params = [
    {name: 'SessionID', type: TYPES.UniqueIdentifier, value: sessionid},
    {name: 'Name', type: TYPES.VarChar, value: user.name},
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: user.organizationid},
    {name: 'Phone', type: TYPES.VarChar, value: (scrapePhone(user.phone)===''?0:scrapePhone(user.phone))},
    {name: 'PhoneExt', type: TYPES.Int, value: ((user.phoneExtension!=='undefined'&&user.phoneExtension !== '')?user.phoneExtension:null)},
    {name: 'Mobile', type: TYPES.VarChar, value: (scrapePhone(user.mobile)===''?0:scrapePhone(user.mobile))},
    {name: 'Email', type: TYPES.VarChar, value: user.email},
    {name: 'PasswordHash', type: TYPES.VarChar, value: password},
    {name: 'Street1', type: TYPES.VarChar, value: user.address1},
    {name: 'Street2', type: TYPES.VarChar, value: user.address2},
    {name: 'City', type: TYPES.VarChar, value: user.city},
    {name: 'StateCode', type: TYPES.VarChar, value: user.stateAbbr},
    {name: 'PostalCode', type: TYPES.VarChar, value: user.zip}
  ];
  return this.mkrequest('procedure', 'pCreateUser', params, done);
};

db.createSuperAdmin = function(newAdmin, done) {
  var password = '';
  if(!_.isEmpty(newAdmin.passwordHash))
    password = newAdmin.passwordHash;
  var params = [
    {name: 'UserName', type: TYPES.VarChar, value: newAdmin.userName},
    {name: 'PasswordHash', type: TYPES.VarChar, value: password},
    {name: 'DisplayName', type: TYPES.VarChar, value: newAdmin.displayName}
  ];
  return this.mkrequest('procedure', 'AddNewAdministrator', params, done);
};

db.getUser = function(id, done) {
  var params = [{name: 'UserID', type: TYPES.UniqueIdentifier, value: id}];
  var sql = "select UserID, Name, OrganizationID, DateTimeLastLogin," +
      "Phone, PhoneExt, Mobile, Email, IsVendor, AddressID, Street1," +
      "Street2, City, StateCode, PostalCode, OrganizationName" +
      " from Users where UserID = @UserID";
  return this.mkrequest('statement', sql, params, done);
};

// TODO: Needs unit test
db.getUsers = function(organizationid, done) {
  var params = [{name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: organizationid}];
  var sql = "select UserID, Name, OrganizationID, DateTimeLastLogin," +
      "Phone, PhoneExt, Mobile, Email, IsVendor, AddressID, Street1," +
      "Street2, City, StateCode, PostalCode, OrganizationName" +
      " from Users where OrganizationID = @OrganizationID";
  return this.mkrequest('statement', sql, params, done);
};

db.updateUser = function(sessionid, user, done) {
  var params = [
    {name: 'SessionID', type: TYPES.UniqueIdentifier, value: sessionid},
    {name: 'UserID', type: TYPES.UniqueIdentifier, value: user.id},
    {name: 'Name', type: TYPES.VarChar, value: user.name},
    {name: 'Phone', type: TYPES.VarChar, value: (scrapePhone(user.phone)===''?0:scrapePhone(user.phone))},
    {name: 'PhoneExt', type: TYPES.Int, value: ((user.phoneExtension !== ''&&user.phoneExtension!=='undefined')?user.phoneExtension:null)},
    {name: 'Mobile', type: TYPES.VarChar, value: (scrapePhone(user.mobile)===''?0:scrapePhone(user.mobile))},
    {name: 'Email', type: TYPES.VarChar, value: user.email},
    {name: 'Street1', type: TYPES.VarChar, value: user.address1},
    {name: 'Street2', type: TYPES.VarChar, value: user.address2},
    {name: 'City', type: TYPES.VarChar, value: user.city},
    {name: 'StateCode', type: TYPES.VarChar, value: user.stateAbbr},
    {name: 'PostalCode', type: TYPES.VarChar, value: user.zip}
  ];
  return this.mkrequest('procedure', 'pUpdateUser', params, done);
};

db.updateSuperAdmin = function(user, done) {
  var params = [
    {name: 'AdminNumber', type: TYPES.Int, value: user.adminNumber},
    {name: 'DisplayName', type: TYPES.VarChar, value: user.displayName},
    {name: 'UserName', type: TYPES.VarChar, value: user.userName},
    {name: 'EmulatedOrg', type: TYPES.VarChar, value: user.emulatedOrg},
  ];

  return this.mkrequest('procedure', 'UpdateAdministrator', params, done);
};

db.updateSuperAdminPassword = function(user, done) {
  var params = [
    {name: 'AdminNumber', type: TYPES.Int, value: user.adminNumber},
    {name: 'NewPassword', type: TYPES.VarChar, value: user.newPassword}
  ];
  return this.mkrequest('procedure', 'UpdateAdministratorPassword', params, done);
};

db.deleteUser = function(sessionid, user, done) {
  var params = [
    {name: 'SessionID', type: TYPES.UniqueIdentifier, value: sessionid},
    {name: 'UserID', type: TYPES.UniqueIdentifier, value: user.id}
  ];
  return this.mkrequest('procedure', 'pDeleteUser', params, done);
};

db.deleteSuperAdmin = function(user, done) {
  var params = [
    {name: 'AdminNumber', type: TYPES.Int, value: user.adminNumber}
  ];
  return this.mkrequest('procedure', 'DeleteAdministrator', params, done);
};

// TODO: add unit test
db.getMyVendorsList = function(sessionid, done) {
  var params = [{name: 'SessionID', type: TYPES.UniqueIdentifier, value: sessionid}];
  return this.mkrequest('procedure', 'pListMyVendors', params, done);
};

db.getVendorsList = function(orgid, done) {
  var params = [{name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgid}];
  return this.mkrequest('procedure', 'pListVendors', params, done);
};

// TODO: add unit test
db.getIntegratedVendorsList = function(orgid, done) {
  var params = [{name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgid}];
  var sql = 'SELECT [OrganizationID],[LongName]'+
      ' FROM [dbo].[Organizations]'+
      ' WHERE OrganizationID = OwnerID'+
      ' AND IsVendor = 1' +
      ' AND IsIntegrated = 1' +
      ' AND OrganizationID NOT IN (' +
      '	SELECT DISTINCT c.OrganizationID' +
      '	FROM Organizations o' +
      '	INNER JOIN Contacts c' +
      '	ON o.OrganizationID = c.OwnerID' +
      '	WHERE o.OrganizationID = @OrganizationID' +
      '	AND o.IsIntegrated = 1)';
  return this.mkrequest('statement', sql, params, done);
};

/**
 * Returns Organization Types.
 * @return {array} organization types list.
 */
db.getOrganizationTypes = function(done) {
  var params = [];
  var sql = 'SELECT ID,Code,Name'+
      ' FROM tbl.OrganizationTypes' +
      ' ORDER BY Name';
  return this.mkrequest('statement', sql, params, done);
};


/**
 * Returns Organization Type.
 */
 db.getOrganizationTypeId = function(org, done) {
  var params = [{name: 'OrganizationId', type: TYPES.VarChar, value: org.organizationId}];
  var sql = 'SELECT OrganizationType'+
      ' FROM tbl.Organizations' +
      ' WHERE OrganizationID = @OrganizationId';
  return this.mkrequest('statement', sql, params, done);
};

// TODO: needs unit test
db.getTopLevelOrganizations = function(done) {
  var params = [];
  // var sql = 'SELECT [OrganizationID],[OwnerID],[LongName],[ShortName],'+
  //     '[Description],[URL],[IsVendor],[AddressID],[Street1],'+
  //     '[Street2],[City],[StateCode],[PostalCode]'+
  //     ' FROM [dbo].[Organizations] where OrganizationID = OwnerID';
  var sql = 'SELECT o.[OrganizationID],o.[OwnerID],o.[LongName],o.[ShortName],'+
      'o.[Description],o.[URL],o.[IsVendor],Ad.[AddressID],Ad.[Street1],'+
      'Ad.[Street2],Ad.[City],Ad.[StateCode],Ad.[PostalCode], ot.[Name] as orgType'+
      ' FROM tbl.Organizations o ' +
      'JOIN  tbl.OrganizationTypes ot ON ot.ID = o.OrganizationType '+
      'JOIN  tbl.Addresses Ad on Ad.AddressID = o.AddressID '+
      'where o.OrganizationID = o.OwnerID AND IsObsolete = 0';
  return this.mkrequest('statement', sql, params, done);
};

db.getOwnedOrganizations = function(id, done) {
  var params = [
    {name:'OrganizationID', type:TYPES.UniqueIdentifier, value: id}
  ];
  var sql = 'SELECT [OrganizationID],[OwnerID],[LongName],[ShortName],'+
      '[Description],[URL],[IsVendor],[AddressID],[Street1],'+
      '[Street2],[City],[StateCode],[PostalCode],[IsVendor]'+
      ' FROM [dbo].[Organizations]'+
      ' WHERE OwnerID = @OrganizationID AND IsVendor = 0';
  return this.mkrequest('statement', sql, params, done);
};

// TODO: needs unit test
db.getOrganizations = function(id, isVendor, done) {
  var params = [
    {name:'OrganizationID', type:TYPES.UniqueIdentifier, value: id},
    {name:'IsVendor', type:TYPES.Bit, value: isVendor}
  ];
  var sql = 'SELECT [OrganizationID],[OwnerID],[LongName],[ShortName],'+
      '[Description],[URL],[IsVendor],[AddressID],[Street1],'+
      '[Street2],[City],[StateCode],[PostalCode],[IsVendor],\'Managed\' AS Type'+
      ' FROM [dbo].[Organizations]'+
      ' WHERE OwnerID = @OrganizationID AND IsVendor = @IsVendor'+
      ' UNION'+
      ' SELECT DISTINCT o.[OrganizationID],o.[OwnerID],o.[LongName],o.[ShortName],'+
      'o.[Description],o.[URL],o.[IsVendor],o.[AddressID],o.[Street1],'+
      'o.[Street2],o.[City],o.[StateCode],o.[PostalCode],o.[IsVendor],\'Granted Access\' AS Type'+
      ' FROM Organizations o'+
      ' INNER JOIN Contacts c ON o.OrganizationID = c.OwnerID'+
      ' INNER JOIN Bridges b ON o.OrganizationID = b.OrganizationID'+
      ' WHERE c.OrganizationID = @OrganizationID'+
      '	AND o.OrganizationID <> b.Grantee'+
      '   AND b.SimpleAPIKey IS NOT NULL';
  return this.mkrequest('statement', sql, params, done);
};

function updateOrganizationTrans(connection, sessionid, organization, done) {
  connection.on('connect', function(error) {
    if(error) { return done(error, null); }
    var params = [
      {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: organization.id},
      {name: 'ShortName', type: TYPES.VarChar, value: organization.shortName},
      {name: 'LongName', type: TYPES.VarChar, value: organization.longName},
      {name: 'Description', type: TYPES.VarChar, value: organization.description},
      {name: 'URL', type: TYPES.VarChar, value: organization.url},
      {name: 'Street1', type: TYPES.VarChar, value: organization.address1},
      {name: 'Street2', type: TYPES.VarChar, value: organization.address2},
      {name: 'City', type: TYPES.VarChar, value: organization.city},
      {name: 'StateCode', type: TYPES.VarChar, value: organization.stateAbbr},
      {name: 'CountryCode', type: TYPES.VarChar, value: organization.countryAbbr},
      {name: 'PostalCode', type: TYPES.VarChar, value: organization.zip}
    ];
    sqlDatabase.execute('procedure', connection, 'pUpdateOrganization', params, true, function(err, rows, rowCount) {
      if(err) { return done(err, null); }
      var newObjArray = transformSync(rows);
      return done(null, newObjArray);
    });
  });
}

db.deleteOrganization = function(organization, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: organization.id},
  ];
  return this.mkrequest('procedure', 'pDeleteOrganization', params, done);
};

db.saveProduct = function(product, done) {
  var params = [
    {name: 'Name', type: TYPES.VarChar, value: product.name},
    {name: 'LongName', type: TYPES.VarChar, value: product.longName},
    {name: 'ProductAlias', type: TYPES.VarChar, value: product.alias},
    {name: 'Type', type: TYPES.VarChar, value: product.type},
    {name: 'CompanyName', type: TYPES.VarChar, value: product.companyName},
    {name: 'AddressID', type: TYPES.UniqueIdentifier, value: product.addressid},
    {name: 'Description', type: TYPES.VarChar, value: product.description},
    {name: 'URL', type: TYPES.VarChar, value: product.url},
    {name: 'Street1', type: TYPES.VarChar, value: product.address1},
    {name: 'Street2', type: TYPES.VarChar, value: product.address2},
    {name: 'City', type: TYPES.VarChar, value: product.city},
    {name: 'StateCode', type: TYPES.VarChar, value: product.stateAbbr},
    {name: 'PostalCode', type: TYPES.VarChar, value: product.zip}
  ];
  return this.mkrequest('procedure', 'pSaveProduct', params, done);
};

db.getOrganizationRegisteredProductTypes = function(organizationId, done) {
  var params = [{name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: organizationId}];
  var sql = 'GetOrganizationRegisteredProductTypes';
  return this.mkrequest('procedure', sql, params, done);
};

db.getProduct = function(name, done) {
  var params = [{name: 'Name', type: TYPES.VarChar, value: name}];
  var sql = 'SELECT [Name],[LongName],[ProductAlias],[Type],[CompanyName],[Description],[URL]'+
      ' FROM [dbo].[Products] where Name = @Name';
  return this.mkrequest('statement', sql, params, done);
};

// TODO: needs unit test
db.getProducts = function(done) {
  var params = [];
  var sql = 'SELECT [Name],[LongName],[ProductAlias],[Type],[CompanyName],[Description],[URL]'+
      ' FROM [dbo].[Products]';
  return this.mkrequest('statement', sql, params, done);
};

db.saveProductVersion = function(productVersion, done) {
  var params = [
    {name: 'ProductName', type: TYPES.VarChar, value: productVersion.name},
    {name: 'VersionNumber', type: TYPES.VarChar, value: productVersion.version},
    {name: 'VersionAlias', type: TYPES.VarChar, value: productVersion.alias},
    {name: 'ReleaseDate', type: TYPES.DateTime, value: productVersion.releaseDate},
    {name: 'EndOfSupportDate', type: TYPES.DateTime, value: productVersion.endOfSupportDate},
    {name: 'ConfigFields', type: TYPES.VarChar, value: productVersion.configFields},
    {name: 'AuthorizationFields', type: TYPES.VarChar, value: productVersion.authFields},
  ];
  return this.mkrequest('procedure', 'pSaveProductVersion', params, done);
};

db.getProductVersion = function(productVersion, done) {
  var params = [{name: 'ProductName', type: TYPES.VarChar, value: productVersion.name},
                {name: 'VersionNumber', type: TYPES.VarChar, value: productVersion.version}];
  var sql = 'SELECT [ProductName],[LongName],[ProductAlias],[ProductType],[CompanyName],'+
      '[Description],[URL],[VersionNumber],[VersionAlias],[ReleaseDate],[EndOfSupportDate],'+
      '[ConfigFields],[AuthorizationFields]'+
      ' FROM [dbo].[ProductVersions] where ProductName = @ProductName and VersionNumber = @VersionNumber';
  return this.mkrequest('statement', sql, params, done);
};

db.getProductVersions = function(productName, done) {
  var params = [{name: 'ProductName', type: TYPES.VarChar, value: productName}];
  var sql = 'SELECT [ProductName],[LongName],[ProductAlias],[ProductType],[CompanyName],'+
      '[Description],[URL],[VersionNumber],[VersionAlias],[ReleaseDate],[EndOfSupportDate],'+
      '[ConfigFields],[AuthorizationFields]'+
      ' FROM [dbo].[ProductVersions] where ( @ProductName IS NULL OR ProductName = @ProductName )';
  return this.mkrequest('statement', sql, params, done);
};

db.updateProductVersionsByOrganizationID = function(options, done) {
  var
  params = [
    {name:'OrganizationID', type: TYPES.UniqueIdentifier, value: options.organizationId},
    {name:'AuthorizationFields', type: TYPES.VarChar, value:options.authorizationFields}],
  sql = 'UpdateProductVersionsByOrganizationID';
  return this.mkrequest('procedure', sql, params, done);
};

db.createContact = function(sessionid, contact, done) {
  var params = [
    {name: 'SessionID', type: TYPES.UniqueIdentifier, value: sessionid},
    {name: 'Name', type: TYPES.VarChar, value: contact.name},
    {name: 'ContactType', type: TYPES.VarChar, value: contact.type},
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: contact.organizationid},
    {name: 'OwnerID', type: TYPES.UniqueIdentifier, value: contact.ownerid},
    {name: 'Phone', type: TYPES.VarChar, value: (scrapePhone(contact.phone)===''?0:scrapePhone(contact.phone))},
    {name: 'PhoneExt', type: TYPES.Int, value: ((contact.phoneExtension !== ''&&contact.phoneExtension!=='undefined')?contact.phoneExtension:null)},
    {name: 'Mobile', type: TYPES.VarChar, value: (scrapePhone(contact.mobile)===''?0:scrapePhone(contact.mobile))},
    {name: 'Email', type: TYPES.VarChar, value: contact.email},
    {name: 'Street1', type: TYPES.VarChar, value: contact.address1},
    {name: 'Street2', type: TYPES.VarChar, value: contact.address2},
    {name: 'City', type: TYPES.VarChar, value: contact.city},
    {name: 'StateCode', type: TYPES.VarChar, value: contact.stateAbbr},
    {name: 'PostalCode', type: TYPES.VarChar, value: contact.zip}
  ];
  return this.mkrequest('procedure', 'pCreateContact', params, done);
};

db.getContact = function(id, done) {
  var params = [{name: 'ContactID', type: TYPES.UniqueIdentifier, value: id}];
  var sql = "select ContactID, Name, ContactType, OrganizationID, OwnerID,"+
      "Phone, PhoneExt, Mobile, Email, IsVendor, OrganizationName, AddressID,"+
      "Street1, Street2, City, StateCode, PostalCode"+
      " from Contacts where ContactID = @ContactID";
  return this.mkrequest('statement', sql, params, done);
};

// TODO: Add unit test
db.getContacts = function(orgid, ownerid, done) {
  var params = [
    {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgid},
    {name: 'OwnerID', type: TYPES.UniqueIdentifier, value: ownerid}
  ];
  var sql = "select ContactID, Name, ContactType, OrganizationID, OwnerID,"+
      "Phone, PhoneExt, Mobile, Email, IsVendor, OrganizationName, AddressID,"+
      "Street1, Street2, City, StateCode, PostalCode"+
      " from Contacts where OrganizationID = @OrganizationID";
  if(ownerid)	sql += " AND OwnerID = @OwnerID";
  else sql += " AND OwnerID is null";
  return this.mkrequest('statement', sql, params, done);
};

db.updateContact = function(sessionid, contact, done) {
  var params = [
    {name: 'SessionID', type: TYPES.UniqueIdentifier, value: sessionid},
    {name: 'ContactID', type: TYPES.UniqueIdentifier, value: contact.id},
    {name: 'Name', type: TYPES.VarChar, value: contact.name},
    {name: 'ContactType', type: TYPES.VarChar, value: contact.type},
    {name: 'Phone', type: TYPES.VarChar, value: (scrapePhone(contact.phone)===''?0:scrapePhone(contact.phone))},
    {name: 'PhoneExt', type: TYPES.Int, value: ((contact.phoneExtension !== ''&&contact.phoneExtension!=='undefined')?contact.phoneExtension:null)},
    {name: 'Mobile', type: TYPES.VarChar, value: (scrapePhone(contact.mobile)===''?0:scrapePhone(contact.mobile))},
    {name: 'Email', type: TYPES.VarChar, value: contact.email},
    {name: 'Street1', type: TYPES.VarChar, value: contact.address1},
    {name: 'Street2', type: TYPES.VarChar, value: contact.address2},
    {name: 'City', type: TYPES.VarChar, value: contact.city},
    {name: 'StateCode', type: TYPES.VarChar, value: contact.stateAbbr},
    {name: 'PostalCode', type: TYPES.VarChar, value: contact.zip},
  ];
  return this.mkrequest('procedure', 'pUpdateContact', params, done);
};

db.deleteContact = function(sessionid, contact, done) {
  var params = [
    {name: 'SessionID', type: TYPES.UniqueIdentifier, value: sessionid},
    {name: 'ContactID', type: TYPES.UniqueIdentifier, value: contact.id}
  ];
  return this.mkrequest('procedure', 'pDeleteContact', params, done);
};

db.loginUser = function(username, password, done) {
  var me = this;
  var cryptPass = simcrypt.sha1(password); // old

  async.waterfall([
    function(callback) {
      params = [
        {name: 'Username', type: TYPES.VarChar, value: username},
        {name: 'PasswordHash', type: TYPES.VarChar, value: cryptPass}
      ];
      me.mkrequest('procedure', 'pLoginAdminGetRoles', params, callback);
    },
    function(rows, callback) {
      if(_.isEmpty(rows)) {
        params = [
          {name: 'Email', type: TYPES.VarChar, value: username},
          {name: 'PasswordHash', type: TYPES.VarChar, value: cryptPass}
        ];
        me.mkrequest('procedure', 'pLoginUserGetRoles', params, callback);
      } else {
        return callback(null, rows);
      }
    }
  ],
                  function(err, result) {
                    if(err) { return done(err, null); }
                    return done(null, result);
                  });
};

/* ========== LOGGING ========== */

db.putRequestLog = function(data, done) {
  var params = [
    { name: 'HostName', type: TYPES.VarChar, value: data.hostname},
    { name: 'IP', type: TYPES.VarChar, value: data.IP},
    { name: 'Port', type: TYPES.Int, value: data.port},
    { name: 'LogType', type: TYPES.VarChar, value: data.logType},
    { name: 'RequestID', type: TYPES.UniqueIdentifier, value: data.requestID },
    { name: 'ParentID', type: TYPES.UniqueIdentifier, value: (data.parentID || null) },
    { name: 'RequestType', type: TYPES.VarChar, value: data.requestType },
    { name: 'Direction', type: TYPES.VarChar, value: data.direction },
    { name: 'ProductName', type: TYPES.VarChar, value: data.productAlias },
    { name: 'VersionNumber', type: TYPES.VarChar, value: data.versionAlias },
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: data.organizationID },
    { name: 'Grantee', type: TYPES.UniqueIdentifier, value: data.vendorID },
    { name: 'Message', type: TYPES.VarChar, value: (data.data&&data.data.message?data.data.message:null) },
    { name: 'InstanceName', type: TYPES.VarChar, value: data.instanceName},
    { name: 'Endpoint', type: TYPES.VarChar, value: data.endpoint},
    { name: 'Payload', type: TYPES.VarChar, value: JSON.stringify(data) },
    { name: 'ElapsedTimeInMS', type: TYPES.Int, value: (data.elapsedTime || null) },
    { name: 'StatusCode', type: TYPES.VarChar, value: (data.statusCode || null) },
    { name: 'DateTimeFromApp', type: TYPES.DateTime2N, value: data.timestamp },
    { name: 'GenericEndPoint', type: TYPES.VarChar, value: data.genericEndpoint},
    { name: 'HttpMethod', type: TYPES.VarChar, value: data.method },
    { name: 'AccessID', type: TYPES.UniqueIdentifier, value: data.accessID }
  ];
  return this.mkrequest('procedure', 'pLogAPIRequest', params, done);
};

db.getRequestLogBySession = function(data, done) {
  params = [
    { name: 'SessionID', type: TYPES.UniqueIdentifier, value: data.SessionID },
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: data.OrganizationID }
  ];
  return this.mkrequest('procedure', 'pViewSystemLog', params, done);
};

db.getRequestLogDetail = function(data, done) {
  var params = [
    {name: 'RequestID', type: TYPES.UniqueIdentifier, value: data.requestId}
  ];
  var sql =
      "SELECT"+
      " [HostName]"+
      ",[IP]"+
      ",[Port]"+
      ",[LogType]"+
      ",[RequestID]"+
      ",[ParentID]"+
      ",[RequestType]"+
      ",[Direction]"+
      ",[ProductName]"+
      ",[VersionNumber]"+
      ",[OrganizationID]"+
      ",[Grantee]"+
      ",[EndPoint]"+
      ",[Payload]"+
      ",[ElapsedTimeInMS]"+
      ",[StatusCode]"+
      ",[DateTimeFromApp]"+
      ",[DateTimeEntered]"+
      ",[IsVendor]"+
      ",[LongName]"+
      ",[ShortName]"+
      ",[GranteeIsVendor]"+
      ",[GranteeLongName]"+
      ",[GranteeShortName]"+
      ",[Message]"+
      ",[InstanceName]"+
      " FROM [dbo].[SystemLog]"+
      " WHERE ( RequestID = @RequestID OR"+
      " ParentID = @RequestID )" +
      " ORDER BY DateTimeFromApp ASC";
  return this.mkrequest('statement', sql, params, done);
};

db.getRequestLogExport = function (data, done) {
  var params = [
    { name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: data.organizationID },
    { name: 'Range', type: TYPES.Int, value: data.range },
    { name: 'Filter', type: TYPES.VarChar, value: data.filter }
  ];
  return this.mkrequest('procedure', 'pAnalyticsFullDetails', params, done);
};

db.getRequestLog = function(data, done) {
  var
  me = this,
  search = data.search.replace(/\'/g, '"').replace(/%/g, '%%').replace(/_/g, '[_]'),
  daysOfLogs = 7, // conf.admin.daysOfLogs ? conf.admin.daysOfLogs : 7,
  maxElapsedTime = 5000,
  dataType = data.type ? data.type : '',
  organizationID = data.OrganizationID ? data.OrganizationID : null,
  sortCol = data.sortCol ? data.sortCol : 1,
  offset = data.offset ? data.offset : 0,
  rowCount = data.rowCount ? data.rowCount : 10,
  sortDir = data.sortDir ? data.sortDir : 'desc',
  params = [
    { name: "DaysOfLogs", type: TYPES.Int, value: parseInt(daysOfLogs, 10) },
    { name: "DataType", type: TYPES.VarChar, value: dataType },
    { name: "MaxElapsedTime", type: TYPES.Int, value: parseInt(maxElapsedTime, 10) },
    { name: "OrganizationID", type: TYPES.UniqueIdentifier, value: organizationID },
    { name: "SortColumn", type: TYPES.Int, value: parseInt(sortCol, 10) },
    { name: "SortDirection", type: TYPES.VarChar, value: sortDir },
    { name: "Search", type: TYPES.VarChar, value: search },
    { name: "Offset", type: TYPES.Int, value: parseInt(offset, 10) },
    { name: "RowCount", type: TYPES.Int, value: parseInt(rowCount, 10) }
  ],
  sql = "GetRequestLogs";
  me.mkrequest('procedure', sql, params, function ( error, data ) {
    return done(error, data);
  });
};

db.getRoutes = function(done) {
  var sql = 'SELECT o.ResourceUri, m.HttpMethod, m.RouteHandler' +
      ' FROM tbl.Apis a' +
      ' INNER JOIN tbl.Objects o' +
      ' ON a.ID = o.ApiID' +
      ' AND ResourceUri IS NOT NULL' +
      ' INNER JOIN tbl.Methods m' +
      ' ON o.ID = m.ObjectID' +
      ' ORDER BY ResourceUri';
  return this.mkrequest('statement', sql, [], done);
};

db.getConfigValues = function ( apiKey, done ) {
  var params = [{name: 'SimpleAPIKey', type: TYPES.UniqueIdentifier, value: apiKey }];
  var sql = 'select i.configvalues'+
      ' from bridges b'+
      ' inner join instances i'+
      ' on i.instanceid = b.instanceid'+
      ' where b.simpleapikey = @SimpleAPIKey';
  return this.mkrequest('statement', sql, params, done);
};

db.getOrganizationAndProducts = function(data, done){
  var params = [{name: 'OrganizationType', type: TYPES.VarChar, value: data.params.type },
                {name: 'EmployerOrganizationID', type: TYPES.UniqueIdentifier, value: data.user.OrganizationID },
                {name: 'SicDivision', type: TYPES.VarChar, value: (data.params.sicDivision ==='null')?null: data.params.sicDivision}],
      sql = 'GetOrganizationAndProducts';
  return this.mkrequest('procedure', sql, params, done);
};

db.getIndustryDivisions = function(data, done){
  var sql = 'GetSicDivisions';
  return this.mkrequest('procedure', sql, [], done);
};

db.getEmployerIntegrations = function(data, done){
  var params = [{name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: data.user.OrganizationID },
                {name: 'All', type: TYPES.Bit, value: (data.params.statusFlag==='null')? null : parseInt(data.params.statusFlag)}],
      sql = 'GetEmployerIntegrations';
  return this.mkrequest('procedure', sql, params, done);
};

db.getIntegrationByOrgID = function(data, done) {
  var params = [{name: 'EmployerID', type: TYPES.UniqueIdentifier, value: data.user.OrganizationID }],

      sql = 'select TOP 1 ei.OrganizationID, ei.ProductVersionID, o.LongName'+
      ' from tbl.EmployerIntegrations ei'+
      ' inner join Organizations o'+
      ' on ei.OrganizationID = o.OrganizationID'+
      ' where ei.EmployerID = @EmployerID ORDER BY ID desc';
  return this.mkrequest('statement', sql, params, done);
};

db.invoiceReport = function(options, done) {
  var params = [
    { name: "StartDate", type: TYPES.DateN, value: options.billDate },
    { name: "MinVolume", type: TYPES.BigInt, value: options.minVolume },
    { name: "OrganizationID", type: TYPES.UniqueIdentifier, value: options.organizationId },
    { name: "WhoCreated", type: TYPES.VarChar, value: options.whoCreated}
  ];
  return this.mkrequest('procedure', options.reportName, params, done);
};

db.saveEmployerIntegration = function(options, done) {
  var params = [
    { name: "EmployerID", type: TYPES.UniqueIdentifier, value: options.employerOrgId },
    { name: "ProductVersionID", type: TYPES.Int, value: options.productVersionId },
    { name: "OrganizationID", type: TYPES.UniqueIdentifier, value: options.organizationId },
    { name: "AuthorizationFields", type: TYPES.VarChar, value: options.configFields },
    { name: "JobBoardEmployerID", type: TYPES.VarChar, value: options.pdsEmpId },
    { name: "PaidByEmployer", type: TYPES.Bit, value: options.paidByEmployer },
    { name: "WhoCreated", type: TYPES.VarChar, value: options.whoCreated },
  ],
  sql = 'AddNewEmployerIntegration';
  return this.mkrequest('procedure', sql, params, done);
};

db.updateEmployerIntegration = function(options, done) {
  var params = [
    { name: "ID", type: TYPES.Int, value: options.integrationID },
    { name: "AuthorizationFields", type: TYPES.VarChar, value: options.authorizationFields },
    { name: "JobBoardEmployerID", type: TYPES.VarChar, value: options.jobboardEmployerId },
    { name: "PaidByEmployer", type: TYPES.Bit, value: options.paidByEmployer },
    { name: "WhoModified", type: TYPES.VarChar, value: options.whoModified },
  ],
  sql = 'UpdateEmployerIntegration';
  return this.mkrequest('procedure', sql, params, done);
};

db.saveOrgName = function ( req, id, logo, maincallback ) {
  var isVendor = false;
  var ownerid = null;
  var orgid = '';

  if(req.params.id === 'current')
    orgid = req.user.OrganizationID;

  if(req.user.OrganizationID) {
    ownerid = req.user.OrganizationID;
  }

  var data = processFormData(req.body.form);


  if(req.route.path === '/api/vendors/:id' || data.isVendor === true) {
    isVendor = true;
  }

  _.extend(data.org, {id: orgid, ownerid: ownerid, isVendor: isVendor});
  var organization = data.org;
  pool.acquire(function(e, connection) {
    if(e) { return maincallback(e); }
      connection.beginTransaction(function() {
        async.series([
          function(done) {
            var params;
            if(req.params.id === 'new') {
              params = [
                {name: 'OwnerID', type: TYPES.UniqueIdentifier, value: organization.ownerid},
                {name: 'ShortName', type: TYPES.VarChar, value: ''},
                {name: 'LongName', type: TYPES.VarChar, value: organization.longName},
                {name: 'URL', type: TYPES.VarChar, value: organization.url},
                {name: 'OrganizationType', type: TYPES.Int, value: parseInt(organization.orgType)},
                {name: 'Description', type: TYPES.VarChar, value: organization.orgDescription},
                {name: 'Image', type: TYPES.VarBinary, value: logo}
              ];
              sqlDatabase.execute('procedure', connection, 'pCreateOrganization', params, true, function(err, rows, rowCount) {
                if(err) { return done(err, null); }
                var newObjArray = transformSync(rows);
                var newObjStr = '{"organizationid":"' + newObjArray[0].OrganizationID + '"}';
                var newObj = JSON.parse(newObjStr);
                _.extend(data.org, newObj);
                return done(null, newObjArray);
              });
            } else {
              params = [
                {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: id},
                {name: 'ShortName', type: TYPES.VarChar, value: ''},
                {name: 'LongName', type: TYPES.VarChar, value: organization.longName},
                {name: 'URL', type: TYPES.VarChar, value: organization.url},
                {name: 'Description', type: TYPES.VarChar, value: organization.orgDescription},
                {name: 'Image', type: TYPES.VarBinary, value: logo}
              ];
              sqlDatabase.execute('procedure', connection, 'pUpdateOrganization', params, true, function(uErr, rows, rowCount) {
                if(uErr) { return done(uErr, null); }
                var newObjArray = transformSync(rows);
                var newObjStr = '{"organizationid":"' + newObjArray[0].OrganizationID + '"}';
                var newObj = JSON.parse(newObjStr);
                _.extend(data.org, newObj);
                return done(null, newObjArray);
              });
           }
          }
        ], function(seriesError, result) {
          if(seriesError) {
            connection.rollbackTransaction(function() {
              connection.close();
              return maincallback(seriesError);
            }, 'save-org-trans');
          } else {
            connection.commitTransaction(function() {
              connection.close();
              return maincallback(null, result);
            }, 'save-org-trans');
          }
        });
      }, 'save-org-trans');
  });
};

db.saveOrgAddress = function ( req, orgid, maincallback ) {
  var isVendor = false;
  var ownerid = null;

  if(req.user.OrganizationID) {
    ownerid = req.user.OrganizationID;
  }

  var data = processFormData(req.body.form);

  if(req.route.path === '/api/vendors/:id' || data.isVendor === true) {
    isVendor = true;
  }

  _.extend(data.org, {id: orgid, ownerid: ownerid, isVendor: isVendor});
  var organization = data.org;
  var billing = data['bill-contact'];
  pool.acquire(function(e, connection) {
    if(e) { return maincallback(e); }
      connection.beginTransaction(function() {
        async.series([
          function(done) {
            var params;
              params = [
                {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: organization.id},
                {name: 'ShortName', type: TYPES.VarChar, value: organization.shortName},
                {name: 'LongName', type: TYPES.VarChar, value: organization.longName},
                {name: 'Description', type: TYPES.VarChar, value: organization.description},
                {name: 'URL', type: TYPES.VarChar, value: organization.url},
                {name: 'Street1', type: TYPES.VarChar, value: organization.address1},
                {name: 'Street2', type: TYPES.VarChar, value: organization.address2},
                {name: 'City', type: TYPES.VarChar, value: organization.city},
                {name: 'StateCode', type: TYPES.VarChar, value: organization.stateAbbr},
                {name: 'CountryCode', type: TYPES.VarChar, value: organization.countryAbbr},
                {name: 'PostalCode', type: TYPES.VarChar, value: organization.zip},
                {name: 'BillingStreet1', type: TYPES.VarChar, value: billing.address1},
                {name: 'BillingStreet2', type: TYPES.VarChar, value: billing.address2},
                {name: 'BillingCity', type: TYPES.VarChar, value: billing.city},
                {name: 'BillingStateCode', type: TYPES.VarChar, value: billing.stateAbbr},
                {name: 'BillingCountryCode', type: TYPES.VarChar, value: billing.countryAbbr},
                {name: 'BillingPostalCode', type: TYPES.VarChar, value: billing.zip}
              ];

              sqlDatabase.execute('procedure', connection, 'pUpdateOrganization', params, true, function(uErr, rows, rowCount) {
                if(uErr) { return done(uErr, null); }
                var newObjArray = transformSync(rows);
                var newObjStr = '{"organizationid":"' + newObjArray[0].OrganizationID + '"}';
                var newObj = JSON.parse(newObjStr);
                _.extend(data.org, newObj);
                return done(null, newObjArray);
              });
          }
        ], function(seriesError, result) {
          if(seriesError) {
            connection.rollbackTransaction(function() {
              connection.close();
              return maincallback(seriesError);
            }, 'save-org-trans');
          } else {
            connection.commitTransaction(function() {
              connection.close();
              return maincallback(null, result);
            }, 'save-org-trans');
          }
        });
      }, 'save-org-trans');
  });
};

db.saveOrgContact = function ( req, orgid, maincallback ) {
  var isVendor = false;
  var ownerid = null;

  if(req.user.OrganizationID) {
    ownerid = req.user.OrganizationID;
  }

  var data = processFormData(req.body.form);

  if(req.route.path === '/api/vendors/:id' || data.isVendor === true) {
    isVendor = true;
  }

  _.extend(data.org, {id: orgid, ownerid: ownerid, isVendor: isVendor});
  var organization = data.org;
  pool.acquire(function(e, connection) {
    if(e) { return maincallback(e); }
      connection.beginTransaction(function() {
        async.series([
          function(done) {
            async.mapSeries([
              {obj:'main-contact', type:'main'},
              {obj:'tech-contact', type:'tech'},
              {obj:'bill-contact', type:'bill'}],

                            function(contact, callback) {
                              var params;
                              if(data[contact.obj]) { _.extend(data[contact.obj], {organizationid: data.org.organizationid, type: contact.type}); }
                              if(req.params.id === 'new') {
                                params = [
                                  {name: 'Name', type: TYPES.VarChar, value: data[contact.obj].name},
                                  {name: 'ContactType', type: TYPES.VarChar, value: data[contact.obj].type},
                                  {name: 'OrganizationID', type: TYPES.UniqueIdentifier, value: orgid},
                                  {name: 'OwnerID', type: TYPES.UniqueIdentifier, value: data[contact.obj].ownerid},
                                  {name: 'Phone', type: TYPES.VarChar, value: (scrapePhone(data[contact.obj].phone)===''?0:scrapePhone(data[contact.obj].phone))},
                                  {name: 'PhoneExt', type: TYPES.Int, value: ((data[contact.obj].phoneExtension!=='undefined'&&data[contact.obj].phoneExtension!=="")?data[contact.obj].phoneExtension:null)},
                                  {name: 'Mobile', type: TYPES.VarChar, value: (scrapePhone(data[contact.obj].mobile)===''?0:scrapePhone(data[contact.obj].mobile))},
                                  {name: 'Email', type: TYPES.VarChar, value: data[contact.obj].email}
                                ];
                                sqlDatabase.execute('procedure', connection, 'pCreateContact', params, true, function(err, rows, rowCount) {
                                  if(err) { return callback(err, null); }
                                  var newObjArray = transformSync(rows);
                                  return callback(null, newObjArray);
                                });
                              } else {
                                params = [
                                  {name: 'ContactID', type: TYPES.UniqueIdentifier, value: data[contact.obj].id},
                                  {name: 'Name', type: TYPES.VarChar, value: data[contact.obj].name},
                                  {name: 'ContactType', type: TYPES.VarChar, value: data[contact.obj].type},
                                  {name: 'Phone', type: TYPES.VarChar, value: (scrapePhone(data[contact.obj].phone)===''?0:scrapePhone(data[contact.obj].phone))},
                                  {name: 'PhoneExt', type: TYPES.Int, value: ((data[contact.obj].phoneExtension!=='undefined'&&data[contact.obj].phoneExtension!=="")?data[contact.obj].phoneExtension:null)},
                                  {name: 'Mobile', type: TYPES.VarChar, value: (scrapePhone(data[contact.obj].mobile)===''?0:scrapePhone(data[contact.obj].mobile))},
                                  {name: 'Email', type: TYPES.VarChar, value: data[contact.obj].email}
                                ];
                                sqlDatabase.execute('procedure', connection, 'pUpdateContact', params, true, function(err, rows, rowCount) {
                                  if(err) { return callback(err, null); }
                                  var newObjArray = transformSync(rows);
                                  return callback(null, newObjArray);
                                });
                              }
                            }, function(mapErr, results) {
                              if(mapErr) { return done(mapErr, null); }
                              return done(null, results);
                            }
                           );
          }

        ], function(seriesError, result) {
          if(seriesError) {
            connection.rollbackTransaction(function() {
              connection.close();
              return maincallback(seriesError);
            }, 'save-org-trans');
          } else {
            connection.commitTransaction(function() {
              connection.close();
              return maincallback(null, result);
            }, 'save-org-trans');
          }
        });
      }, 'save-org-trans');
  });
};


db.getWebhooks = function(options, done) {
  var sql = 'GetWebhooks',
  params = [{name: 'InstanceID', type: TYPES.UniqueIdentifier, value: options.instanceId}];

  this.mkrequest('procedure', sql, params, done);
};

db.addNewWebhooks = function(options, done) {
  var sql = 'AddNewWebhook',
  params = [
  {name: 'InstanceID', type: TYPES.UniqueIdentifier, value: options.instanceId},
  {name: 'Endpoint', type: TYPES.VarChar, value: options.endpoint},
  {name: 'HttpMethod', type: TYPES.VarChar, value: options.httpMethod},
  {name: 'Event', type: TYPES.VarChar, value: options.webhookEvent},
  {name: 'Label', type: TYPES.VarChar, value: options.label},
  {name: 'Active', type: TYPES.Bit, value: 1},
  {name: 'whoCreated', type:TYPES.VarChar, value: options.whoCreated }];

  this.mkrequest('procedure', sql, params, done);
};

db.updateWebhooks = function(options, done) {
  var sql = 'UpdateWebhook',
  params = [
  {name: 'ID', type: TYPES.VarChar, value: parseInt(options.whId)},
  {name: 'Endpoint', type: TYPES.VarChar, value: options.endpoint},
  {name: 'HttpMethod', type: TYPES.VarChar, value: "POST"},
  {name: 'Event', type: TYPES.VarChar, value: options.webhookEvent},
  {name: 'Label', type: TYPES.VarChar, value: options.label},
  {name: 'Active', type: TYPES.Bit, value: 1},
  {name: 'IsObsolete', type: TYPES.Bit, value: 0},
  {name: 'WhoModified', type:TYPES.VarChar, value: options.whoModified }];

  this.mkrequest('procedure', sql, params, done);
};

// ..............................................................
// .............................................................. utils

function formatDateTime(dt) {
  if(moment(dt).isValid()) {
    return moment(dt).format('YYYY/MM/DD');
  } else {
    return '';
  }
}

function processFormData(form) {
  var data = {};
  _.map(global.config.dataMaps.forms.organization, function(val, key, list) {
    var arr = getTypeDefs(key);
    var newKey = global.config.dataMaps.forms.organization[key];
    var value = form[key];
    var currentKey = '';
    var newObjStr;
    var newObj;

    if(arr[1] === 'contact') {
      currentKey = arr[0] + "-" + arr[1];
      if(!data[currentKey]) {
        newObjStr = '{"' + currentKey + '":{}}';
        newObj = JSON.parse(newObjStr);
        _.extend(data, newObj);
      }
    } else {
      currentKey = arr[1];
      if(!data[currentKey]) {
        newObjStr = '{"' + currentKey + '":{}}';
        newObj = JSON.parse(newObjStr);
        _.extend(data, newObj);
      }
    }
    // var cleaned = value ? value.replace(/[^\w\s]/gi, '') : '';
    // var objStr = '{"' + newKey + '":"' + cleaned + '"}';
    // var obj = JSON.parse(objStr);

    //Modified to skip the website sting filteing/cleaning
    var cleaned = '';
    if(newKey !== 'url'){
      cleaned = value ? value.replace(/[^\w\s]/gi, '') : '';
    }else{cleaned = value;}
    var objStr = '{"' + newKey + '":"' + cleaned + '"}';
    var obj = JSON.parse(objStr);
    _.extend(data[currentKey], obj);
  });
  return data;
}

// Split out the form field name to identify the object types
function getTypeDefs(key) {
  var arr = key.split('-');
  return arr;
}

function buildTvpTableColumn (options) {
  var table = options.table || { columns: [], rows: [] };
  table.columns.push({
    name: options.name,
    type: options.type
  });
  _.each(options.values, function (element) {
    table.rows.push([element]);
  });
  return table;
}

function formatStatus(status) {
  if(status) return 'On';
  else return 'Off';
}

// Excavate TDS's detailed structure to simple col:data structure
// Sync function for trivial memory tasks
function transformSync ( objArray) {
  var newObjArray = [];
  if(!_.isEmpty(objArray)) {
    _.each(objArray, function(e, i, l) {
      var newObj = {};
      _.each(e, function(ie, ii, il) {
        if(ie.metadata.colName === 'Phone')
          newObj[ie.metadata.colName] = formatPhone(ie.value);
        else if(ie.metadata.colName === 'IsActive')
          newObj[ie.metadata.colName] = formatStatus(ie.value);
        else if(ie.metadata.type.type === 'DATETIMN') {
          newObj[ie.metadata.colName] = formatDateTime(ie.value);
        }
        else
          newObj[ie.metadata.colName] = ie.value;
      });
      newObjArray.push(newObj);
    });
  }
  return newObjArray;
}

function scrapePhone(phone) {
  if(phone) {
    try {
      return Number(phone.replace(/\D/g,''));
    } catch (ex) {
      console.log(ex);
    }
  }
  return '';
}

function formatPhone(phone) {
  var newPhone = '';
  if(phone) {
    for(var i = 0; i < phone.length; i++) {
      if(i === 0) { newPhone += '('; }
      newPhone += phone.charAt(i);
      if(i === 2) { newPhone += ') '; }
      if(i === 5) { newPhone += '-'; }
    }
  }
  return newPhone;
}

function customId ( pre, post) {
  var mult = 10000,
      id1 = Math.ceil(Math.random() * mult).toString(),
      id2 = new Date().getTime();
  pre = pre || '';
  post = post || '';
  return pre + id1 + id2 + post;
}

// https://azure.microsoft.com/en-us/documentation/articles/sql-database-develop-error-messages/
function isTransient ( errorMessage ) {
  return (errorMessage &&
          errorMessage.number &&
          errorMessage.number.toString() in {
            '4060' : 'cannot open',
            '10928': 'resource limit reached',
            '10929': 'too busy',
            '40197': 'upgrade/failure/failover',
            '40501': 'service busy',
            '40613': 'database not currently unavailable',
            '49918': 'cannot process: not enough resources',
            '49919': 'cannot process: too many operations',
            '49920': 'cannot process: too many operations'
          });
}

/*\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
  module definition
  \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/
(function ( methods, sqlDatabase, api , debug ) {

  var
  Pool = sqlDatabase.ConnectionPool,
  pools = {},
  mongoDataSource;

  api.static = methods; // legacy; no retry

  /* configures and/or initializes data sources */
  api.configure = function ( config ) {

    // sql
    pools[config.name] = new Pool(
      _.extend({}, dalConfig.connectionPool, config),
      dalConfig.database);

    // mongo
    mongoDataSource = mongo.configure(dalConfig.mongodb);

    // azure
    azureStorage.init(dalConfig.azure.blobStorage);
    return api;
  };

  // returns instances based on preconfigured settings
  api.getInstance = function ( config, next ) {

    // can't we just configure here?
    if (!pools[config.name]) {
      throw new Error('Pool not configured: ' + config.name);
    }

    var
    name = config.name,
    instance = {
      requestsRunning: {},
      events: new EventEmitter(),
      name: name,
      pool: pools[name],
      createRequestId: function ( ) {

        return r.compose(
          r.concat(customId().toString(),'-').concat,
          r.inc,
          r.length,
          r.keys
        )(instance.requestsRunning);
      }
    };

    if (config.onError) {
      instance.events.on('error', config.onError);
    }

    if (config.onPoolError) {
      instance.pool.on('error', config.onPoolError);
    } else {
      // critical connection errors
      instance.pool.on('error', function ( error ) {
        if (typeof log === 'undefined') {
        } else {
          log.silly('CONNECTION POOL ERROR');
          log.silly(error);
          /* fb-issue553:
             Do not just throw the error. This can force application
              restarts unnecessarily.

             For now, log the errors and determine whether these
              they are always recoverable, or if further design
              efforts are required.
           */

          // throw error; // fb-issue553
        }
      });
    }

    if (config.onSuccess) {
      instance.events.addListener('success', config.onSuccess);
    }

    // Set up alerting for configured database events
    (function ( config ) {
      notifications(config).listen(instance.events);
    }(r.assoc('client', config.client, dalConfig.notifications)));

    // recreate the static methods above as
    //  instance methods here
    instance.methods = _.reduce(
      Object.keys(methods),
      function ( memo, key ) {
        var maybeFun = db[key];
        if (_.isFunction(maybeFun)) {
          memo[key] = maybeFun.bind(instance);
          memo[key].methodName = key;
          methods[key].methodName = key;
        }
        return memo;
      }, {});

    instance.mkrequest = function _mkRequest ( type, sql, params, done ) {

      var requestContext = {
        id: instance.createRequestId(),
        method: _mkRequest.caller.methodName,
        timestamp: new Date(),
        tries: 1 };

      var args = instance.requestsRunning[requestContext.id] = [
        requestContext,
        type,
        sql,
        params,
        done];

      return mkrequest.apply(instance, args);

      function mkrequest ( requestContext, type, sql, params, done ) {

        var me = this,
            args = arguments;

        me.pool.acquire(function (requestContext, type, sql, params, done, acqError, connection ) {
          if(acqError) {
            me.events.emit('sqlserver.error', acqError);
            return resolveRequest(requestContext, acqError, null, done);
          }

          if (!connection._events.errorMessage) {
            connection.once('errorMessage', function ( errorMessage ) {
              if (!isTransient(errorMessage)) {
                console.log('*** NOT TRANSIENT ***');
                console.log(errorMessage);
                return;
              }
              // force retry
              console.log('*** TRANSIENT ***');
              console.log(errorMessage);
              connection.emit('error', errorMessage);
            });
          }

          return execute(requestContext, type, connection, sql, params, done);

        }.bind(null, requestContext, type, sql, params, done));

        function execute ( requestContext, type, connection, sql, params, done ) {
          sqlDatabase.execute(type, connection, sql, params, true, function ( executionError, rows, rowCount ) {
            connection.release();
            if(executionError) {
              return resolveRequest(requestContext, executionError, null, done);
            } else {
              requestContext.resolved = true;
              var newObjArray = transformSync(rows);
              me.events.emit('success', requestContext);
              return resolveRequest(requestContext, null, newObjArray, done);
            }
          });
        }

        function resolveRequest ( ctx, error, data, callback ) {
          delete instance.requestsRunning[ctx.id];
          return callback(error, data);
        }

        return requestContext.id;
      }

    };

    // emit mongodb-namespaced events from our instance
    r.forEach(
      function ( event ) {
        mongoDataSource.connection.on(event, function ( eventArg ) {
          instance.events.emit('mongodb.' + event, eventArg);
        });
      }, ['connecting',
          'connected',
          'open',
          'disconnecting',
          'disconnected',
          'close',
          'reconnected',
          'error',
          'fullsetup']);

    // The "close" and "error" events signify restart-worthy scenarios
    mongoDataSource.connection.on('close', function ( ) {
      throw new Error('[SimpleAPI Database Error] MongoDB connection closed.');
    });

    mongoDataSource.connection.on('error', function ( error ) {
      throw error;
    });

    /* -------------------------------------------------
       return database when all sources are connected */
    mongoDataSource.connection.once('open', function ( ) {
      var
      dataModules = [
        'adminData',
        'apiData',
        'billing',
        'testData'
      ].reduce(function generateDataModule ( memo, dataModule ) {
        memo[dataModule] = require('../' + dataModule).use(instance.methods);
        return memo;
      }, instance),
      models = require('./mongo/models')(mongoDataSource.connection),
      meta = {
        requestsRunning: function ( ) {
          return r.compose(r.length, r.keys)(instance.requestsRunning);
        },
        mongoConnection: mongoDataSource.connection,
        mongoDb: mongoDataSource.connection,
        sqlServer: {
          server: dataModules.pool.connectionConfig.server,
          database: dataModules.pool.connectionConfig.options.database
        }
      };

      var dbInstance =
          r.compose(
            r.assoc('meta', meta),
            r.assoc('models', models),
            r.assoc('dataModules', dataModules)
          )(instance.methods);

      return next(0, dbInstance);
    });
  };
}(db, sqlDatabase, module.exports));
