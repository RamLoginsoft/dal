var _ = require('underscore'),
    async = require('async'),
    azure = require('./azure_storage'),
    Q = require('q');

var dateUtils = require('../shared').utils.date;
defaultDatabase = require('./database').static;

(function ( billing ) {

  billing.db = defaultDatabase;

  billing.use = function ( database ) {
    this.db = database;
    return this;
  };

  billing.getOrganization = function ( options, next ) {
    billing.db.getOrganization(options, function ( error, data ) {
      if (error) { return next(error); }
      var mapped = _.map(data, function ( record ) {
	return {
	  organizationId: record.OrganizationID,
	  isVendor: record.IsVendor,
	  ownerId: record.OwnerID,
	  isObsolete: record.IsObsolete,
	  longName: record.LongName,
	  shortName: record.ShortName,
	  addressId: record.AddressID,
	  description: record.Description,
	  url:record.URL
	};
      });
      return next(0, mapped);
    });
  };

  billing.getPurchasedTransactionQuantity = function( options, next ) {
    billing.db.getPurchasedTransactionQuantity(options, function (error, data) {
      if (error) { return next(error); }
      return next(null, data);
    });
  };

  billing.getTransactionsByOrg = function( options, next ) {
    billing.db.getTransactionsByOrg(options, function ( error, data ) {
      if (error) { return next(error); }
      return next(null, data);
    });
  };

  billing.getTransactionStates = function(next) {
    billing.db.getTransactionStates(function ( error, data ) {
      if (error) { return next(error); }
      return next(null, data);
    });
  };

  billing.saveTransactionState = function ( options, next ) {
    billing.db.saveTransactionState(options, function ( error, data ) {
      if (error) { return next(error); }
      var record = _.first(data);
      return next(0, {
	id: record ? record.ID : options.id
      });
    });
  };

  billing.savePurchasedTransactionQuantity = function ( options, next ) {
    billing.db.savePurchasedTransactionQuantity(options, function ( error, data ) {
      if (error) { return next(error); }
      var record = _.first(data);
      return next(0, {
	id: record ? record.ID : options.id
      });
    });
  };

  billing.getTransactionState = function ( options, next ) {
    billing.db.getTransactionState(options, function ( error, data ) {
      if (error) { return next(error); }
      var mapped = _.map(data, function ( record ) {
	return {
	  id: record.ID,
	  organizationId: record.OrganizationID,
	  accessId: record.AccessID,
	  lastPurchasedQuantity: record.LastPurchasedQuantity,
	  purchaseType: record.PurchaseType,
	  threshold: record.Threshold,
	  remainingTransactions: record.RemainingTransactions,
	  thresholdAction: record.ThresholdAction,
	  notify: record.Notify,
	  dateCreated: record.DateCreated,
	  whoCreated: record.whoCreated,
	  dateModified: record.DateModified,
	  whoModified: record.WhoModified
	};
      });

      return mapped.length === 1 ?
	next(0, _.first(mapped)) :
	next(0, mapped);
    });
  };

  billing.logIpnCommunication = function ( options, next ) {
    billing.db.logIpnReceipt(options, function ( error, data ) {
      var record = _.first(data);
      return record ?
	next(error, record.ID) :
	next(error);
    });
  };

  billing.logIpnValidity = function ( options, next ) {
    billing.db.logIpnValidity(options, function ( error, data ) {
      if (error) { return next(error); }
      var record = _.first(data);
      return record ?
	next(0, record.ID) :
	next();
    });
  };

  billing.getSubscriptionPlans = function ( options, next ) {
    billing.db._getSubscriptionPlan(options.organizationId, function ( error, data ) {
      if (error) { return next(error); }
      return next(0, _.map(data, function ( item ) {
	return {
	  id: item.ID,
	  productType: item.ProductType,
	  referenceId: item.ReferenceID,
	  subscriptionPeriod: item.SubscriptionPeriod,
	  setupFeeInvoiced: item.SetupFeeInvoiced,
	  endDate: item.EndDate,
	  subscriptionPlanTypeID: item.SubscriptionPlanTypeID,
	  paymentGatewaySetupStatusID: item.PaymentGatewaySetupStatusID,
	  subscriptionPlanType: item.SubscriptionPlanType,
	  paymentGatewaySetupStatus: item.PaymentGatewaySetupStatus
	};
      }));
    });
  };

  billing.saveSubscriptionPlan = function ( options, next ) {
    billing.db.saveSubscriptionPlan(options, function ( error, data ) {
      if (error) { return next(error); }
      var record = _.first(data);
      return record ?
	next(0, record.ID) :
	next();
    });
  };

  billing.savePayPalAccountData = function ( options, next ) {
    billing.db.savePayPalAccountData(options, function ( error, data ) {
      if (error) { return next(error); }
      var record = _.first(data);
      return record ?
	next(0, record.ID) :
	next();
    });
  };

  billing.getPayPalOrganization = function ( options, next ) {
    billing.db.getPayPalOrganization(options, function ( error, data ) {
      if (error) { return next(error); }
      var record = _.first(data);
      return record ?
	next(0, {
	  id: record.ID,
	  organizationId: record.OrganizationID,
	  email: record.Email,
	  active: record.Active,
	  payerId: record.PayerID,
	  dateCreated: record.DateCreated,
	  whoCreated: record.whoCreated,
	  dateModified: record.DateModified,
	  whoModified: record.WhoModified
	}) :
      next();
    });
  };

  billing.getPayment = function ( options, next ) {
    billing.db.getPayment(options, function ( error, data ) {
      if(error) { return next(error); }
      var mapped = _.map(data, function ( record ) {
	return {
	  id: record.ID,
	  organizationId: record.OrganizationID,
	  accessId: record.AccessID,
	  amount: record.Amount,
	  paymentTypeId: record.BillingPaymentTypeID,
	  payerId: record.PayerID,
	  notify: record.Notify,
	  whoModified: record.WhoModified,
	  whoCreated: record.WhoCreated,
	  dateModified: record.DateModified,
	  dateCreated: record.DateCreated
	};
      });
      return next(0, mapped);
    });
  };

  billing.savePayment = function ( options, next ) {
    billing.db.savePayment(options, function ( error, data ) {
      if (error) { return next(error); }
      var record = _.first(data);
      return record ?
	next(0, record.ID) :
	next();
    });
  };

  billing.getPaymentHistory = function ( options, next ) {
    var mapped;
    billing.db.getPaymentHistory(options, function ( error, data ) {
      if (error) { return next(error); }
      mapped = _.map(data, function ( record ) {
	return {
	  amount : billing.utils.formatMoney(record.Amount),
	  dateCreated: record.DateCreated,
	  paymentId: record.ID,
	  productType: record.ProductType
	};
      });
      return next(0, mapped);
    });
  };

  billing.getPaymentReceiptDetails = function ( options, next ) {
    billing.db.getPaymentReceiptDetails(options, function ( error, data ) {
      if (error) { return next(error); }

      var details = {};
      details.organization = _.chain(data)
	.filter(function ( record ) {
	  return record.TableType === 'Organization';
	})
	.map(function ( record ) {
	  return {
	    id: record.OrganizationID,
	    name: record.OrganizationName
	  };
	})
	.first()
	.value();

      details.organization.contacts = _.chain(data)
	.filter(function ( record ) {
	  return record.TableType === 'Contacts';
	})
	.reduce(function ( contacts, record ) {
	  if (record.ContactType !== null && !contacts[record.ContactType]) {
	    contacts[record.ContactType] = {
	      name: record.Name,
	      email: record.Email
	    };
	  }
	  return contacts;
	}, {})
	.value();

      details.payments = _.chain(data)
	.filter(function ( record ) {
	  return record.TableType === 'Payment';
	})
	.map(function ( record ) {
	  return {
	    id: record.ID,
	    accessId: record.AccessID,
	    amount: record.Amount,
	    paymentTypeId: record.BillingPaymentTypeID,
	    payerId: record.PayerID,
	    notify: record.Notify,
	    dateCreated: record.DateCreated,
	  };
	})
	.value();

      details.charges = _.chain(data)
	.filter(function ( record ) {
	  return record.TableType === 'Charges';
	})
	.map(function ( record ) {
	  return {
	    id: record.ID,
	    accessId: record.AccessID || 'N/A',
	    productType: record.ProductType,
	    bridgeName: record.BridgeName || 'N/A',
	    volume: record.Volume || 'N/A',
	    amount: record.Amount,
	    payerId: record.PayerID,
	    dateCreated: record.DateCreated
	  };
	})
	.value();

      resolveDates(details);

console.log(details);

      next(0, details);

      function resolveDates ( data ) {
	var charge = _.first(data.charges);
	if(!charge) {
	  log.silly('Something wrong: Payment has no charges.');
	  return;
	}

	var invoiceMonth = new Date(charge.dateCreated),
	    lastMonth = new Date(charge.dateCreated);
	lastMonth.setDate(0);

	var monthName = dateUtils.getMonthName(lastMonth.getMonth());
	data.usagePeriod = charge.productType === 'AMS' ?
	  monthName.concat(' ', lastMonth.getFullYear()) :
	  'N/A';
	data.dateCreated = "".concat(
	  invoiceMonth.getMonth() + 1,
	  '/',
	  invoiceMonth.getDate(),
	  '/',
	  invoiceMonth.getFullYear());
      }
    });
  };

  billing.saveCharge = function ( options, next ) {
    billing.db.saveCharge(options, function ( error, data) {
      if (error) { return next(error); }
      var record = _.first(data);
      return record ?
	next(0, record.ID) :
	next();
    });
  };

  billing.paymentHistoryAssets = function ( ) {
    return azure.paymentHistories;
  };

  billing.getPaymentNotifications = function ( options, next ) {
    billing.db.getPaymentNotifications(options, function ( error, data ) {
      if (error) { return next(error); }
      return next(0, _.map(data, function ( record ) {
	return {
	  id: record.ID,
	  organizationId: record.OrganizationID,
	  name: record.Name,
	  email: record.Email,
	  amount: record.Amount,
	  formattedAmount: billing.utils.formatMoney(record.Amount)
	};
      }));
    });
  };

  billing.getTransactionQuantity = function ( options, next ) {
    billing.db.getTransactionQuantity(options, function ( error, data ) {
      if (error) { return next(error); }
      var mapped = _.map(data, function ( record ) {
	return {
	  id: record.ID,
	  fee: record.Fee,
	  quantity: record.Quantity,
	  whoModified: record.WhoModified,
	  whoCreated: record.WhoCreated,
	  dateModified: record.DateModified,
	  dateCreated: record.DateCreated
	};
      });
      return next(0, options.id ? _.first(mapped) : mapped);
    });
  };



  billing.getThresholdReport = (function ( me ) {
    var reports = {
      notify: function ( options, next ) {
	me.db.getThresholdNotifications(options, function ( error, results ) {
	  if (error) { return next(error); }
	  results = _.map(results, function ( data ) {
	    return {
	      id: data.ID,
	      organizationId: data.OrganizationId,
	      name: data.Name,
	      email: data.Email,
	      bridgeName: data.BridgeName,
	      lastPurchasedQuantity: data.LastPurchasedQuantity,
	      remainingTransactions: data.RemainingTransactions
	    };
	  });
	  return next(0, results);
	});
      },
      autopay: function ( options, next ) {
	return next('Not implemented');
      }
    };

    return function ( options, next ) {
      var processAction = reports[options.processAction];
      return processAction ?
	processAction.apply(null, arguments) :
	next('No such report');
    };
  }(billing));

  billing.toResolve = new GetToResolve({
    store: billing
  });

  billing.utils = {
    formatMoney: function ( amount ) {
      var formatted = amount.toString();
      formatted = amount.toString().indexOf('.') > -1 ?
	formatted :
	formatted + '.00';

      return formatted.indexOf('$') > -1 ?
	formatted :
	'$' + formatted;
    }
  };

}(module.exports));

function GetToResolve ( options ) {
  var me = this;
  me.store = options.store;
  me.fns = {};
  _.each(Object.keys(me.store), function ( key ) {
    var property = me.store[key];
    if (!_.isFunction(property)) { return; }
    me.fns[key] = function ( resolveFn, rejectFn, options, next ) {
      me.store[key].call(null, options, function ( error, data ) {
	if(error) { return next(error); }
	return next(0,
		    _.map(data, function ( item ) {
		      var deferred = Q.defer();

		      item._resolve = function ( ) {
			deferred.promise.then(resolveFn.apply(null, arguments));
			deferred.resolve();
		      };
		      item._reject = function ( ) {
			deferred.promise.then(null, rejectFn.apply(null, arguments));
			deferred.reject();
		      };
		      return item;
		    }));
      });
    };
  });
  return function ( resolveFn, rejectFn ) {
    return _.mapObject(me.fns, function ( fn ) {
      return fn.bind(me.store, resolveFn, rejectFn);
    });
  };
}
