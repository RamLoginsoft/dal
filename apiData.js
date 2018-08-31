var
  defaultDatabase = require('./database').static,
  _ = require('underscore'),
  r = require('ramda');

(function(apiDataModule) {

  apiDataModule.db = defaultDatabase;

  apiDataModule.use = function(database) {
    this.db = database;
    return this;
  };

  apiDataModule.getDocsKey = function(options, next) {
    apiDataModule.db.getDocsKey(options, next);
  };

/*
{ AccessID: '2F7F51CD-7445-4F07-BE07-211740AC2991',
    Endpoint: 'http://localhost:5001/GETapply',
    HttpMethod: 'POST',
    Event: 'GETapply',
    Label: 'GET /apply/{requisitionId}',
    Active: true }
 */
  apiDataModule.getWebhooks = (function() {
    return function(options, next) {
      apiDataModule.db.getWebhooks(options, function(err, hooks) {
        var formattedHooks = [];
        if(err) {
          return next(err);
        }
        for(var i in hooks) {
          formattedHooks.push(new Webhook(hooks[i]));
        }
        return next(0, formattedHooks);
      });
    }

    /**
     * "DTO" Object builder for each Webhook to standardize return output
     * @param {Object}
     */
    function Webhook(hook) {
      var newHook = {
        accessID: hook.AccessID,
        endpoint: hook.Endpoint,
        httpMethod: hook.HttpMethod,
        event: hook.Event,
        label: hook.Label,
        active: hook.Active
      }
      return newHook;
    }
  }());

  /**
   * Returns the "unlocked" bridge data.
   * @param {Object} options Api options.
   * @param {Function} next The callback function to execute when finished getting data.
   * @return {KeyData} KeyData object containing bridge configuration data.
   */
  apiDataModule.getApiKeyData = (function() {
    var cache = {};
    return function(options, next) {

      if (options.cache && cache[options.apiKey]) {
        return next(0, cache[options.apiKey]);
      }

      apiDataModule.db.getAPIKeyData(options.apiKey, function(err, result) {
        if (err) {
          return next(err);
        }
        if (_.isEmpty(result)) {
          return next({
            statusCode: 403,
            message: 'Invalid credentials'
          });
        }

        var bridgeData =
          cache[options.apiKey] =
          new KeyData(_.extend({
            apiKey: options.apiKey
          }, _.first(result)));

        return next(0, bridgeData);

      });
    };
  }());

  /**
   * Returns API resources, methods and parameters.
   * @param {Object} options Options: API Name, Product Name, Version Number
   * @param {Function} next The callback function to execute when finished getting data.
   * @return {[type]} ApiData object containing the API data and availability for product.
   */
  apiDataModule.getApiData = function(options, next) {
    apiDataModule.db.getAPIData(options, function(error, results) {
      if (error) {
        return next(error);
      }

      var
        _options = {
          _available: options.productType === 'ATS'
        },
        apiData = new ApiData(results, _options);
      return next(null, apiData);
    });
  };

  /**
   * Returns data from tbl.APIs
   * @param  options API spec filter
   * @param  {Function} next    Callback function
   */
  apiDataModule.getApis = function(options, next) {
    apiDataModule.db.getAPIs(options, function(error, results) {
      if (error) {
        return next(error, null);
      }
      return next(null, results.map(function(row) {
        return new Api(row);
      }));
    });
  };

  /**
   * Saves API data
   * @param  options The data
   * @param  {Function} next    The callback function
   */
  apiDataModule.saveApi = function(options, next) {
    apiDataModule.db.saveApi(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var api = new Api({
        ID: id,
        Name: options.name,
        BaseUri: options.baseUri
      });
      return next(null, api);
    });
  };

  /**
   * Deletes an api by it's ID
   * @param  options API data
   * @param  {Function} next    Callback
   */
  apiDataModule.deleteApi = function(options, next) {
    apiDataModule.db.deleteApi(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var api = new Api({
        ID: id,
        Name: options.name,
        BaseUri: options.baseUri
      });
      return next(null, api);
    });
  };

  /**
   * Saves Object data
   * @param  options The data
   * @param  {Function} next    The callback function
   */
  apiDataModule.saveObject = function(options, next) {
    apiDataModule.db.saveObject(options, function(error, data) {
      if (error) {
        return next(error);
      }
      // TODO: put constraint on table [?]
      if (!options.apiId) {
        return next({
          error: "Must have ApiID to save"
        });
      }
      var id = _.first(data).ID;
      var object = new Resource({
        ID: id,
        ApiID: options.apiId,
        Name: options.name,
        Type: options.type,
        Description: options.description,
        ResourceUri: options.resourceUri,
        Available: options.available,
        Table: 'Objects'
      });
      return next(null, object);
    });
  };

  /**
   * Deletes an object by it's ID
   * @param  options Object data
   * @param  {Function} next    Callback
   */
  apiDataModule.deleteObject = function(options, next) {
    apiDataModule.db.deleteObject(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var object = new Resource({
        ID: id,
        ApiID: options.apiId,
        Name: options.name,
        Type: options.type,
        Description: options.description,
        ResourceUri: options.resourceUri,
        Available: options.available,
        Table: 'Objects'
      });
      return next(null, object);
    });
  };

  /**
   * Saves Method data
   * @param  options The data
   * @param  {Function} next    The callback function
   */
  apiDataModule.saveMethod = function(options, next) {
    apiDataModule.db.saveMethod(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var method = new Method({
        ID: id,
        ObjectID: options.objectId,
        HttpMethod: options.httpMethod,
        Notes: options.notes,
        Summary: options.summary,
        Nickname: options.nickname,
        ResponseID: options.responseId,
        Available: options.available,
        Scope: options.scope,
        Table: options.table || 'Methods'
      });
      return next(null, method);
    });
  };

  /**
   * Deletes a method by it's ID
   * @param  options Method data
   * @param  {Function} next    Callback
   */
  apiDataModule.deleteMethod = function(options, next) {
    apiDataModule.db.deleteMethod(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var method = new Method({
        ID: id,
        ObjectID: options.objectId,
        HttpMethod: options.httpMethod,
        Notes: options.notes,
        Summary: options.summary,
        Nickname: options.nickname,
        responseId: options.responseId,
        Available: options.available,
        Table: options.table || 'Methods'
      });
      return next(null, method);
    });
  };

  /**
   * Saves Method Parameter Data
   * @param  options The data
   * @param  {Function} next    The callback function
   */
  apiDataModule.saveMethodParameter = function(options, next) {
    apiDataModule.db.saveMethodParameter(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var methodParameter = new MethodParameter({
        ID: id,
        MethodID: options.methodId,
        ObjectID: options.objectId,
        AllowMultiple: options.allowMultiple,
        Required: options.required,
        Name: options.name,
        ParamType: options.paramType,
        DataType: options.dataType,
        Description: options.description,
        Table: options.table,
      });
      return next(null, methodParameter);
    });
  };

  /**
   * Deletes a method by it's ID
   * @param  options Method data
   * @param  {Function} next    Callback
   */
  apiDataModule.deleteMethodParameter = function(options, next) {
    apiDataModule.db.deleteMethodParameter(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var methodParameter = new MethodParameter({
        ID: id,
        MethodID: options.methodId,
        ObjectID: options.objectId,
        AllowMultiple: options.allowMultiple,
        Required: options.required,
        Name: options.name,
        ParamType: options.paramType,
        DataType: options.dataType,
        Description: options.description,
        Table: options.table,
      });
      return next(null, methodParameter);
    });
  };

  /**
   * Saves Method Signature Data
   * @param  options The data
   * @param  {Function} next    The callback function
   */
  apiDataModule.saveMethodSignature = function(options, next) {
    apiDataModule.db.saveMethodSignature(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var savedSig = _.first(data);
      var methodSignature = new MethodSignature({
        ID: savedSig.Id,
        SignatureID: options.signatureId || savedSig.SignatureID,
        MethodParameterID: options.methodParameterId,
        ParameterName: options.parameterName,
        Table: 'MethodSignatures'
      });
      return next(null, methodSignature);
    });
  };

  /**
   * Deletes Method Signature data
   * @param options The data
   * @param {Function} next The callback function
   */
  apiDataModule.deleteMethodSignature = function(options, next) {
    apiDataModule.db.deleteMethodSignature(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var methodSignature = new MethodSignature({
        ID: id,
        SignatureID: options.signatureId,
        MethodParameterID: options.methodParameterId,
        ParameterName: options.parameterName,
        Table: 'MethodSignatures'
      });
      return next(null, methodSignature);
    });
  };

  /**
   * Saves Method Configuration Data
   * @param  options The data
   * @param  {Function} next    The callback function
   */
  apiDataModule.saveProductMethodConfiguration = function(options, next) {
    apiDataModule.db.saveMethodSignature(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var configuration = new MethodConfiguration({
        ID: id,
        SignatureID: options.signatureId,
        ConfigFieldID: options.configFieldId,
        Required: options.required,
        Table: 'MethodConfigurations'
      });
      return next(null, configuration);
    });
  };

  /**
   * Deletes Method Signature data
   * @param options The data
   * @param {Function} next The callback function
   */
  apiDataModule.deleteMethodConfiguration = function(options, next) {
    apiDataModule.db.deleteProductVersionMethodConfiguration(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var configuration = new MethodConfiguration({
        ID: id,
        SignatureID: options.signatureId,
        ConfigFieldID: options.configFieldId,
        Required: options.required,
        Table: 'MethodConfigurations'
      });
      return next(null, configuration);
    });
  };

  /**
   * Saves Object Composition Data
   * @param  options The data
   * @param  {Function} next    The callback function
   */
  apiDataModule.saveObjectComposition = function(options, next) {
    apiDataModule.db.saveObjectRelationship(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var composition = new CompositionDefinition({
        ParentID: options.parentId,
        ChildID: options.childId,
        Scope: options.scope,
        Available: options.available,
        Table: 'CompositionDefinitions'
      });
      return next(null, composition);
    });
  };

  /**
   * Deletes Object Composition Data
   * @param options The Data
   * @param {Function} next The callback function
   */
  apiDataModule.deleteObjectComposition = function(options, next) {
    apiDataModule.db.deleteObjectRelationship(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var composition = new CompositionDefinition({
        ParentID: options.parentId,
        ChildID: options.childId,
        Scope: options.scope,
        Available: options.available,
        Table: 'CompositionDefinitions'
      });
      return next(null, composition);
    });
  };
  /**
   * Saves product version API data
   * @param  options The product version data
   * @param  {Function} next    The callback
   */
  apiDataModule.saveProductVersionApi = function(options, next) {
    apiDataModule.db.saveProductVersionApi(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvApi = new ProductVersionApi({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        ApiID: options.apiId,
        Table: 'ProductVersionAPIs'
      });
      return next(null, pvApi);
    });
  };

  /**
   * Deletes product version API data
   * @param  options The product version data
   * @param  {Function} next    The callback
   */
  apiDataModule.deleteProductVersionApi = function(options, next) {
    apiDataModule.db.deleteProductVersionApi(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvApi = new ProductVersionApi({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        ApiID: options.apiId,
        Table: 'ProductVersionAPIs'
      });
      return next(null, pvApi);
    });
  };

  /**
   * Saves product version object data
   * @param  options The product version data
   * @param  {Function} next    The callback
   */
  apiDataModule.saveProductVersionObject = function(options, next) {
    apiDataModule.db.saveProductVersionObject(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvObject = new ProductVersionObject({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        ApiID: options.apiId,
        Table: 'ProductVersionObjects'
      });
      return next(null, pvObject);
    });
  };

  /**
   * Deletes product version object data
   * @param  options The product version data
   * @param  {Function} next    The callback
   */
  apiDataModule.deleteProductVersionObject = function(options, next) {
    apiDataModule.db.deleteProductVersionObject(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvObject = new ProductVersionObject({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        ApiID: options.apiId,
        Table: 'ProductVersionObjects'
      });
      return next(null, pvObject);
    });
  };

  /**
   * Saves product version method data
   * @param  options The product version data
   * @param  {Function} next    The callback
   */
  apiDataModule.saveProductVersionMethod = function(options, next) {
    apiDataModule.db.saveProductVersionMethod(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvMethod = new ProductVersionMethod({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        MethodID: options.methodId,
        Notes: options.notes,
        Table: 'ProductVersionMethods'
      });
      return next(null, pvMethod);
    });
  };

  /**
   * Deletes product version method data
   * @param  options The product version data
   * @param  {Function} next    The callback
   */
  apiDataModule.deleteProductVersionMethod = function(options, next) {
    apiDataModule.db.deleteProductVersionMethod(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvMethod = new ProductVersionMethod({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        MethodID: options.methodId,
        Notes: options.notes,
        Table: 'ProductVersionMethods'
      });
      return next(null, pvMethod);
    });
  };

  /**
   * Saves product version method paramter data
   * @param  options The product version data
   * @param  {Function} next    The callback
   */
  apiDataModule.saveProductVersionMethodParameter = function(options, next) {
    apiDataModule.db.saveProductVersionMethodParameter(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvMethodParameter = new ProductVersionMethodParameter({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        MethodParameterID: options.methodParameterID,
        Required: options.required,
        Table: 'ProductVersionMethodParamters'
      });
      return next(null, pvMethodParameter);
    });
  };

  /**
   * Deletes product version method data
   * @param  options The product version data
   * @param  {Function} next    The callback
   */
  apiDataModule.deleteProductVersionMethodParameter = function(options, next) {
    apiDataModule.db.deleteProductVersionMethodParameter(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvMethodParameter = new ProductVersionMethodParameter({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        MethodParameterID: options.methodParameterID,
        Required: options.required,
        Table: 'ProductVersionMethodParamters'
      });
      return next(null, pvMethodParameter);

    });
  };

  apiDataModule.saveProductVersionMethodConfiguration = function(options, next) {
    apiDataModule.db.saveProductVersionMethodConfiguration(options, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvMethodConfiguration = new MethodConfiguration({
        ID: id,
        ProductName: options.productName,
        VersionNumber: options.versionNumber,
        SignatureID: options.signatureId,
        ConfigFieldID: options.configFieldId,
        Required: options.required,
        Table: 'MethodConfigurations'
      });
      return next(null, pvMethodConfiguration);
    });
  };

  apiDataModule.deleteProductVersionMethodConfiguration = function(options, next) {
    apiDataModule.db.deleteProductVersionMethodConfiguration(options.id, function(error, data) {
      if (error) {
        return next(error);
      }
      var id = _.first(data).ID;
      var pvMethodConfiguration = new MethodConfiguration({
        ID: id,
        SignatureID: options.signatureId,
        ConfigFieldID: options.configFieldId,
        Required: options.required,
        Table: 'MethodConfigurations'
      });
      return next(null, pvMethodConfiguration);
    });
  };

  /**
   * Gets the base templates for creating DTOs at the client end.
   * @param  {Function} next The callback function.
   */
  apiDataModule.getTemplates = function(options, next) {
    return next(null, {
      api: new Api(),
      object: new Resource(),
      method: new Method(),
      methodParameter: new MethodParameter(),
      compositionDefinition: new CompositionDefinition(),
      methodSignature: new MethodSignature(),
      methodConfiguration: new MethodConfiguration(),
      productVersionObject: new ProductVersionObject(),
      productVersionMethod: new ProductVersionMethod(),
      productVersionApi: new ProductVersionApi(),
      productVersionMethodParameter: new ProductVersionMethodParameter()
    });
  };

  apiDataModule.getCustomEntityMaps = function(options, next) {
    apiDataModule.db.getCustomEntityMaps(options, function(error, mapsData) {
      if (error) {
        return next(error);
      }
      var maps = mapsData.map(function(mapData) {
        return new CustomEntityMap(mapData);
      });
      return next(null, maps);
    });
  };

  apiDataModule.getEmployerIntegrationByEmployerID = function(options, next) {
    apiDataModule.db.getEmployerIntegrationByEmployerID(options, function(error, results) {
      if (error) {
        return next(error);
      }
      return next(null, results);
    });
  };

}(module.exports));

/**
 * Constructor for custom entity mapping data object.
 */
function CustomEntityMap(data) {
  var keyData = new KeyData(data);
  this.matchType = data.MatchType;
  this.matchString = data.MatchString;
  this.productName = data.ProductName;
  this.requestTarget = data.RequestTarget || null;
  this.testType = data.TestType || null;
  this.testValue = data.TestValue || null;
  this.isSupported = data.IsSupported || false;
  _.extend(this, _.pick(keyData, function(val) {
    return (val !== undefined && val !== null);
  }));
  this.product = {
    name: this.productName,
    version: keyData.versionNumber
  };
}



/**
 * DTO for bridge configuration.
 * @param data Data from database.
 */
function KeyData(data) {
  if (Object.keys(data).length <= 1) {
    return;
  }
  this.found = true;
  this.apiKey = data.apiKey;
  this.locked = buildLockedProps(data);
  this.productAuth = buildConfigProps(data.AuthValues);
  this.productConfig = buildConfigProps(data.ConfigValues);
  this.bridgeID = data.InstanceID;
  this.instanceId = data.InstanceID;
  this.vendorID = data.Grantee;
  this.granteeId = data.Grantee;
  this.granteeName = data.GranteeName;
  this.organizationID = data.OrganizationID;
  this.organizationName = data.OrganizationName;
  this.productAlias = data.ProductAlias.toLowerCase();
  this.productName = data.ProductLongName;
  this.productType = data.ProductType.toLowerCase();
  this.versionAlias = data.VersionAlias;
  this.versionNumber = data.VersionNumber;
  this.instanceName = data.InstanceLongName;
  this.accessID = data.AccessID;
  this.productName = data.ProductLongName;
  this.productBaseName = data.ProductName;
  this.versionNumber = data.VersionNumber;
  this.compliantProduct = data.CompliantProduct;

  function buildTags(data) {

  }

  function buildConfigProps(data) {
    return r.reduce(
      function(memo, config) {
        var key = config.id === 'oData' ? 'odata' : config.id;
        return r.assoc(key, config.value, memo);
      }, {},
      JSON.parse(data || '[]') || []);
  }

  function buildLockedProps(data) {
    if (data.BridgeLocked) {
      return {
        level: 'Bridge',
        message: data.BridgeLockedMessage,
        since: data.BridgeLockedSince
      };
    }
    if (data.OrgLocked) {
      return {
        level: 'Organizaion',
        message: data.OrgLockedMessage,
        since: data.OrgLockedSince,
      };
    }
    return null;
  }
}

/**
 * Basic DTO for API object.
 * @param data Data from database.
 */
function Api(data, options) {
  // default parameters [-ES6-]
  data = data || {};
  options = options || {};

  this.id = data.ID || null;
  this.name = data.Name || null;
  this.baseUri = data.BaseUri || null;
  this.available = options._available || (data.Available === undefined ?
    null :
    data.Available);
  this.productVersionId = data.ProductVersionID || null;
  this.table = data.Table || 'APIs';
}

/**
 * DTO representing a SimpleAPI resource object. Ex: /customers
 * @param data Data from the database.
 */
function Resource(data, options) {
  // default parameters [-ES6-]
  data = data || {};
  options = options || {};

  this.id = data.ID || null;
  this.apiId = data.ApiID || null;
  this.name = data.Name || null;
  this.loweredName = data.Name ? data.Name.toLowerCase() : null;
  this.type = data.Type || null;
  this.description = data.Description || null;
  this.resourceUri = data.ResourceUri || null;
  this.available = options._available || (data.Available === undefined ?
    null :
    data.Available);
  this.productVersionId = data.ProductVersionID || null;
  this.table = data.Table || 'Objects';
}

/**
 * DTO representing a SimpleAPI method. Ex: GET /customers{id}
 * @param data Data from the database.
 */
function Method(data, options) {
  // default parameters [-ES6-]
  data = data || {};
  options = options || {};

  this.id = data.ID || null;
  this.objectId = data.ObjectID || null;
  this.httpMethod = data.HttpMethod || null;
  this.notes = data.Notes || null;
  this.summary = data.Summary || null;
  this.nickname = data.Nickname || null;
  this.responseId = data.ResponseID || null;
  this.responseObject = data.redsponseObject || null;
  this.available = options._available || (data.Available === undefined ?
    null :
    data.Available);
  this.signatures = null;
  this.scope = data.Scope || null;
  this.productVersionId = data.ProductVersionID || null;
  this.table = data.Table || 'Methods';
}

/**
 * DTO representing a SimpleAPI method parameter.
 * @param data Data from the database.
 */
function MethodParameter(data, options) {
  // default parameters [-ES6-]
  data = data || {};
  options = options || {};

  this.id = data.ID || null;
  this.methodId = data.MethodID || null;
  this.objectId = data.ObjectID || null;
  this.allowMultiple = data.AllowMultiple === undefined ? null : data.AllowMultiple;
  this.required = data.Required === undefined ? null : data.Required;
  this.name = data.Name || null;
  this.loweredName = data.Name ? data.Name.toLowerCase() : null;
  this.parameterName = data.ParameterName || null;
  this.paramType = data.ParamType || null;
  this.dataType = data.DataType || null;
  this.description = data.Description || null;
  this.mapsTo = data.MapsTo || null;
  this.available = options._available || (data.Available === undefined ?
    null :
    data.Available);
  this.productVersionId = data.ProductVersionID || null;
  this.table = data.Table || 'MethodParameters';
}

/**
 * Represents a parent-child relationship between API objects.
 * @param data Data from the database.
 */
function CompositionDefinition(data, options) {
  // default parameters [-ES6-]
  data = data || {};
  options = options || {};

  this.id = data.ID || null;
  this.parentId = data.ParentID || null;
  this.childId = data.ChildID || null;
  this.scope = data.Scope || null;
  this.available = options._available || (data.Available === undefined ?
    null :
    data.Available);
  this.table = data.Table || 'CompositionDefinitions';
}

/**
 * Represents a method signature.
 * @param data Data from the database.
 */
function MethodSignature(data) {
  data = data || {};
  this.id = data.ID || null;
  this.signatureId = data.SignatureID || null;
  this.methodParameterId = data.MethodParameterID || null;
  this.parameterName = data.ParameterName || null;
  this.table = data.Table || 'MethodSignatures';
}

/**
 * Holds information in the method signatures as to what config fields are
 * required to fulfull the request. Ex:
 * @param data Data from the database.
 */
function MethodConfiguration(data) {
  data = data || {};
  this.id = data.ID || null;
  this.productName = data.ProductName || null;
  this.versionNumber = data.VersionNumber || null;
  this.signatureId = data.SignatureID || null;
  this.configFieldId = data.ConfigFieldID || null;
  this.required = data.Required || null;
  this.table = data.Table || 'MethodConfigurations';
}

/**
 * Data which sets product version availability to an API.
 * @param {[type]} data Database data
 */
function ProductVersionApi(data) {
  data = data || {};
  this.id = data.ID || null;
  this.productName = data.ProductName || null;
  this.versionNumber = data.VersionNumber || null;
  this.apiId = data.ApiID || null;
  this.table = data.Table || 'ProductVersionAPIs';
}

/**
 * Data which sets product version availability to an object.
 * @param {[type]} data Database data
 */
function ProductVersionObject(data) {
  data = data || {};
  this.id = data.ID || null;
  this.productName = data.ProductName || null;
  this.versionNumber = data.VersionNumber || null;
  this.objectId = data.ObjectID || null;
  this.mapsTo = data.MapsTo || null;
  this.table = data.Table || 'ProductVersionObjects';
}

/**
 * Data which sets product version availability to a method.
 * @param {[type]} data Database data
 */
function ProductVersionMethod(data) {
  data = data || {};
  this.id = data.ID || null;
  this.productName = data.ProductName || null;
  this.versionNumber = data.VersionNumber || null;
  this.methodId = data.MethodID || null;
  this.notes = data.Notes || null;
  this.table = data.Table || 'ProductVersionMethods';
}

/**
 * Data which sets product version availability to a method parameter.
 * @param {[type]} data Database data
 */
function ProductVersionMethodParameter(data) {
  data = data || {};
  this.id = data.ID || null;
  this.productName = data.ProductName || null;
  this.versionNumber = data.VersionNumber || null;
  this.methodParameterID = data.MethodParameterID || null;
  this.required = data.Required || null;
  this.description = data.Description || null;
  this.table = data.Table || 'ProductVersionMethodParamters';
}

/**
 * Contains API data related to a product / version. Possesses some helper
 *	methods for extracting
 *	raw data.
 * @param data Data from the database.
 * @param options Options for construction
 */
function ApiData(data, options) {
  this.initialize(data, options);
}

/**
 * Contains all of the model data including scope information as well as
 *	parent-child relationships.
 */
function ScopedModels() {
  var me = this,
    models = {},
    scopes = {};

  /**
   * Entry point for registering new parent-child model data.
   * @param  parent The parent object.
   * @param  child The child object.
   * @param  scope The scope of the parent-child relationship. Ex: all
   * @return {[type]}
   */
  me.register = function(parent, child, scope) {
    var itemKeys = keys(parent, scope);
    itemKeys.forEach(function(key) {
      if (models[key]) {
        append(key, parent, child);
      } else {
        make(key, parent, child);
      }
    });
  };

  /**
   * Gets all model data, or for a specific name.
   * @param  {string} name The name of the model. [optional]
   * @return The API object model.
   */
  me.getModels = function(name) {
    return name ? models[name] : models;
  };

  /**
   * Gets a list of all scopes of objects that have been registered, or by object name.
   * @param  {string} name The name of the object for which to get scopes. [optional]
   * @return {array} The list of scopes.
   */
  me.getScopes = function(name) {
    return name ? scopes[name] : scopes;
  };

  function keys(parent, scope) {
    if (scope) {
      saveScope(parent.name, scope);
      return [parent.name.concat(':', scope)];
    } else {
      return [parent.name];
      // return [parent.name].concat(Object.keys(models).filter(function ( key ) {
      // 	return key.indexOf(parent.name + ':') > -1;
      // }));
    }
  }

  function make(key, parent, child) {
    models[key] = {};
    var model = models[key];
    model.type = parent.type;
    model.available = parent.available;
    model.name = parent.name;
    switch (model.type) {
      case 'object':
        model.properties = {};
        model.properties[child.name] = {
          type: child.type,
          available: child.available,
          name: child.name
        };
        break;
      case 'array':
        model.of = child.name;
        break;
      default:
        break;

    }
  }

  function append(key, parent, child) {
    var model = models[key];
    switch (model.type) {
      case 'object':
        model.properties[child.name] = {
          type: child.type,
          available: child.available,
          name: child.name
        };
        break;
      case 'array':
        throw new Error(
          "Arrays should only have one child!"
        );
      default:
        break;
    }
  }

  function saveScope(parentName, scope) {
    if (scopes[parentName]) {
      if (scopes[parentName].indexOf(scope) === -1) {
        scopes[parentName].push(scope);
      }
    } else {
      scopes[parentName] = [scope];
    }
  }
}

/**
 * Initialization steps for mapping in database data via DTOs.
 * @param  data The data from the database.
 */
ApiData.prototype.initialize = function(data, options) {
  // set default parameters [-ES6-]
  data = data || [];
  options = options || {};

  var me = this;
  me.models = undefined;
  me.scopes = undefined;

  me.apis = data
    .filter(function(dataItem) {
      return dataItem.Table === 'APIs';
    })
    .map(function(apiData) {
      return new Api(apiData, options);
    });

  me.objects = data
    .filter(function(dataItem) {
      return dataItem.Table === 'Objects';
    })
    .map(function(objectData) {
      return new Resource(objectData, options);
    });

  me.apiObjects = me.objects
    .filter(function(object) {
      return object.resourceUri !== null;
    });

  me.compositionDefinitions = data
    .filter(function(dataItem) {
      return dataItem.Table === 'Compositions';
    })
    .map(function(dataItem) {
      return new CompositionDefinition(dataItem, options);
    });

  me.methods = data
    .filter(function(dataItem) {
      return dataItem.Table === 'Methods';
    })
    .map(function(methodData) {
      var responseObject,
        method = new Method(methodData, options),
        models = me.getResourceModels().models;

      if (method.responseId) {
        method.responseObject =
          _.chain(me.objects)
          .filter(function(object) {
            return object.id === method.responseId;
          })
          .first()
          .value();
      } else {
        method.responseObject = _.chain(me.objects)
          .filter(function(object) {
            return object.id === method.objectId;
          })
          .first()
          .value();
      }

      method.responseModel = method.scope ?
        models[method.responseObject.name + ':' + method.scope] :
        models[method.responseObject.name];

      return method;
    });

  me.methodParameters = data
    .filter(function(dataItem) {
      return dataItem.Table === 'MethodParameters';
    })
    .map(function(parameterData) {
      return new MethodParameter(parameterData, options);
    });

  me.methodSignatures = data
    .filter(function(dataItem) {
      return dataItem.Table === 'MethodSignatures';
    })
    .map(function(signatureData) {
      return new MethodSignature(signatureData);
    });

  me.methodConfigurations = data
    .filter(function(dataItem) {
      return dataItem.Table === 'MethodConfigurations';
    })
    .map(function(dataItem) {
      return new MethodConfiguration(dataItem);
    });
};

/**
 * Gets all methods applicable to a specific API resource.
 * @param  {GUID} objectId The resource identifier.
 * @return {array[Method]} List of methods.
 */
ApiData.prototype.methodsFor = function(objectId) {
  return this.methods.filter(function(method) {
    return method.objectId === objectId;
  });
};

/**
 * Gets all method parameters applicable to a specific API resource's method.
 * @param  {GUID} methodId The resource's method identifier.
 * @return {array[MethodParameter]} List of method parameters.
 */
ApiData.prototype.methodParametersFor = function(methodId) {
  return this.methodParameters.filter(function(methodParameter) {
    return methodParameter.methodId === methodId;
  });
};
/**
 * Gets all required method parameters to a specific API resource's method.
 * @param  {object} options The options for which method / resource to get params.
 * @return {array[MethodParameter]} List of method parameters.
 */
ApiData.prototype.getRequiredParameters = function(options) {
  if (!validArgs(options)) {
    return null;
  }
  var object = _.first(this.objects.filter(function(obj) {
    return obj.ResourceUri === options.resourceUri;
  }));
  if (!object) {
    return null;
  }

  var method = _.first(this.methodsFor(object.ID).filter(function(methodObj) {
    return methodObj.HttpMethod === options.method;
  }));
  if (!method) {
    return null;
  }

  return this.methodParametersFor(method.ID).filter(function(param) {
    return param.Required;
  });

  function validArgs(options) {
    if (!options.resourceUri || !options.method) {
      return false;
    }
    return true;
  }
};

/**
 * Gets the resouce model(s) for the API. Contains parent-child information. Models are constructed
 *	once at first function call, and results are cached.
 * @param  {string} name Model name.
 * @return A list of models, or a specific model if @name is passed.
 */
ApiData.prototype.getResourceModels = function(name) {
  var me = this;
  if (!me.models) {
    makeModels();
  }
  return name ? {
    models: me.models[name],
    scopes: me.scopes[name]
  } : {
    models: me.models,
    scopes: me.scopes
  };

  function makeModels() {
    var output = _.reduce(me.compositionDefinitions,
      function(data, def) {
        var parent = _.find(data.objects, function(object) {
          return object.id === def.parentId;
        });
        var child = _.find(data.objects, function(object) {
          return object.id === def.childId;
        });
        data.models.register(parent, child, def.scope);
        return data;
      }, {
        objects: me.objects,
        models: new ScopedModels()
      }
    );
    me.models = output.models.getModels();
    me.scopes = output.models.getScopes();
  }
};

/**
 * Returns the entire SAPI model with default values.
 * @param  {string}	name	The name of the requested model.
 * @return {Object}			The empty model.
 */
ApiData.prototype.getModelShell = (function() {
  var prims = {
    boolean: false,
    string: '',
    number: 0
  };

  function prim(item) {
    return _.some(Object.keys(prims), function(type) {
      return item.type === type;
    });
  }

  var recursionStop = (function() {
    var bank = {};
    return function(key) {
      bank[key] = bank[key] || [];
      bank[key].push(key);
      return bank[key].length > 2;
    };
  }());

  return function(name) {
    var
      me = this,
      shell = {},
      modelData = me.models || me.getResourceModels();

    return build(modelData[name]);

    function build(model) {
      if (model === undefined) {
        return;
      }
      if (prim(model)) {
        return prims[model.type];
      }
      if (model.type === 'array') {
        var modelData = me.models[model.name];
        if (!modelData) {
          return '';
        }
        var of = me.models[modelData.of];
        return of ?
          [] :
          [build(me.models[modelData.of])];
      }
      if (model.type === 'object') {
        if (recursionStop(model.name)) {
          return '[object]';
        }

        return _.reduce(Object.keys(model.properties), function(data, property) {
          var modelData = me.models[property] || model.properties[property];
          data[property] = build(modelData);
          return data;
        }, {});
      }
    }
  };
}());

/**
 * returns the full resource data with method and signature information.
 * @param  {object} uriSpec    GUID, URI string, or RegExp to extract resource.
 * @param  {string} httpMethod The method used on the resource. Used to get
 *                             information
 * @return {Object}            Full description of the resource and its method data.
 */
ApiData.prototype.getResourceData = function(uriSpec, httpMethod) {
  var me = this;

  var resourceFinder = {
    // like 5C27C4BD-ACC9-4DC6-B1C0-34762D8198C7
    guid: function(id) {
      return me.apiObjects.filter(function(resource) {
        return resource.id === id;
      });
    },
    // like /customers/{customerId}/all
    uriString: function(uri) {
      return me.apiObjects.filter(function(resource) {
        return resource.resourceUri === uri;
      });
    },
    // like /customers/\{.+\}/all
    regex: function(uriRegex) {
      return me.apiObjects.filter(function(resource) {
        return uriRegex.test(resource.resourceUri);
      });
    },
    find: function(uriSpec) {
      if (isGuid(uriSpec)) {
        return this.guid.call(me, uriSpec);
      } else if (uriSpec instanceof RegExp) {
        return this.regex.call(me, uriSpec);
      }
      return this.uriString.call(me, uriSpec);
    }
  };

  return resourceFinder.find(uriSpec)
    .map(function(resource) {
      return appendResourceSignatures(resource, httpMethod);
    })
    .map(function(resource) {
      // copy
      return _.extend({}, resource);
    })
    .shift();

  function appendResourceSignatures(resource, httpMethod) {
    resource.methodData = me.methods
      .filter(function(method) {
        return (method.objectId === resource.id && method.httpMethod === httpMethod);
      })
      .map(function(method) {
        return _.extend(
          method,
          me.methodParametersFor(method.id)
          .reduce(
            function(data, parameter, index, array) {
              data.parameters.push(parameter);
              me.methodSignatures
                .filter(function(signature) {
                  return signature.methodParameterId === parameter.id;
                })
                .forEach(function(signature) {
                  var id = signature.signatureId,
                    signatureData = data.signatures[id],
                    name = signature.parameterName || parameter.name;
                  _.extend(parameter, {
                    parameterName: name
                  });
                  if (signatureData) {
                    signatureData.params.push(parameter);
                  } else {
                    data.signatures[id] = {
                      params: [].concat(parameter)
                    };
                    appendConfigurationDependencies(data.signatures[id], id);
                  }
                });

              return data;
            }, {
              signatures: {},
              parameters: []
            })
        );
      })
      .shift();

    return resource;
  }

  function appendConfigurationDependencies(methodSignature, id) {
    _.extend(methodSignature, {
      configDependencies: me.methodConfigurations
        .filter(function(config) {
          return config.signatureId === id;
        })
        .map(function(config) {
          return {
            id: config.configFieldId,
            required: config.required
          };
        })
    });
  }
};

function isGuid(value) {
  var testValue = value ? value : this;
  var guidExpression = String.prototype.concat.call(
    '^',
    '[a-fA-F0-9]{8}',
    '-',
    '[a-fA-F0-9]{4}',
    '-',
    '[a-fA-F0-9]{4}',
    '-',
    '[a-fA-F0-9]{4}',
    '-',
    '[a-fA-F0-9]{12}',
    '$'
  );
  if (testValue instanceof String) {
    return new RegExp(guidExpression).test(testValue);
  }
  return false;
}
