module.exports = function ( connection ) {

  return {
    Candidate: require('./candidate')(connection),
    AddressCodes: require('./addressCodes')(connection),
    JobApplicationStats: require('./jobApplicationStats')(connection),
    jobApplications: require('./jobApplications').register(connection),
    log: require('./requestLog').register(connection),
    persons: require('./persons').register(connection),
    failedLoginAttempts: require('./failedLoginAttempts').register(connection),
    supportedProducts: require('./supportedProducts').register(connection),
    BillingHistory: require('./billingHistory').register(connection),
    IpnLog: require('./ipnLogs').register(connection),
    RetryRequest: require('./retryRequest')(connection),
    /* Registration authorization for employers */
    Registration: require('./registration')(connection),
    /* ................................................*/
    /* Temporary Collection for Taleo Business Enterprise
       proof-of-concept solution. */
    TBECandidate: require('./tbeCandidate')(connection),
    TransactionBundles: require('./transactionBundles')(connection)
    /* ................................................*/
  };

};
