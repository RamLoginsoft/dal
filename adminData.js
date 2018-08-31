var async = require('async'),
    defaultDatabase = require('./database').static,
    _ = require('underscore');

(function ( adminDataModule ) {

  adminDataModule.db = defaultDatabase;

  adminDataModule.use = function ( database ) {
    this.db = database;
    return this;
  };

  adminDataModule.getCertifiedOrganizations = function ( options, next ) {
    adminDataModule.db.getCertifiedOrganizations(options, next);
  };

  adminDataModule.getOrganization = function(options, next) {
    adminDataModule.db.getOrganization(options, next);
  };

  adminDataModule.getRoles = function ( next ) {
    adminDataModule.db.getRoles(next);
  };

  adminDataModule.getRelationships = function ( options, next ) {
    adminDataModule.db.getRelationships(options, next);
  };

  adminDataModule.getAdministrator = function(options, next) {
    adminDataModule.db.getAdministrator(options, next);
  };

  adminDataModule.adminEmulation = function(options, next) {
    adminDataModule.db.adminEmulation(options, next);
  };

  adminDataModule.getInstances = function ( options, next ) {
    adminDataModule.db.getInstances(options, next);
  };

  adminDataModule.getInstanceAccessRecords = function ( options, next ) {
    adminDataModule.db.getInstanceAccessRecords(options, next);
  };

  adminDataModule.getBridgesAndInstances = function ( options, next ) {
    adminDataModule.db.getBridgesAndInstances(options, next);
  };

  adminDataModule.getAccessKey = function ( options, next ) {
    adminDataModule.db.getAccessApiKey(options, next);
  };

  /**
   * Returns an array of Registered Product Types for an Organization.
   * @param {string} organization ID.
   * @return {array} product types list.
   */
  adminDataModule.getTransactionState = function (orgId, next) {
    adminDataModule.db._getTransactionState(orgId, next);
  };

  /**
   * Returns an array of Registered Product Types for an Organization.
   * @param {string} organization ID.
   * @return {array} product types list.
   */
  adminDataModule.getOrganizationRegisteredProductTypes = function (orgId, next) {
    adminDataModule.db._getOrganizationRegisteredProductTypes(orgId, next);
  };

  /**
   * Returns an organizations SubscriptionPlan information
   * @param {string} organization ID.
   * @return {array} subscription plan data.
   */
  adminDataModule.getSubscriptionPlan = function(orgId, next) {
    adminDataModule.db._getSubscriptionPlan(orgId, next);
  };

  /**
   * Returns a collection of syndication items.
   * @param  {Object}   options Filter options
   * @param  {String}   options.channel The name of the syndication channel
   * @param  {Function} next    The callback function.
   */
  adminDataModule.getSyndicationItems = function ( options, next ) {
    adminDataModule.db.getSyndicationItems(options, next);
  };

  /**
   * Gets syndication channel data.
   * @param  {Object}   options Filter options
   * @param  {String}   options.channel The name of the syndication channel
   * @param  {Function} next    The callback function.
   */
  adminDataModule.getSyndicationChannel = function ( options, next ) {
    adminDataModule.db.getSyndicationChannel(options, next);
  };

  /**
   * Saves a syndication channel item.
   * @param  {Object}   options Procedure parameters related to item
   * @param  {Number}   options.channelId Id of the channel
   * @param  {String}   options.title Title of the channel item
   * @param  {String}   options.description Description of the channel item
   * @param  {String}   options.link Embedded link for channel item
   * @param  {String}   options.guid Id of channel item
   * @param  {String}   options.pubDate Date that item published
   * @param  {String}   options.whoCreated Who created the item
   * @param  {Function} next    The callback function.
   */

  adminDataModule.saveSyndicationItem = function( options, next ) {
    adminDataModule.db.saveSyndicationItem(options, next);
  };

  /**
   * Gets the syndication channel and item data.
   * @param  {Object}   options Filter options
   * @param  {String}   options.channel The name of the syndication channel
   * @param  {Function} next    The callback function.
   */
  adminDataModule.getRssData = function ( options, next ) {
    async.parallel({
      channel: function ( done ) {
	adminDataModule.getSyndicationChannel(options, function ( error, data ) {
	  var channel = data ? _.first(data) : undefined;
	  return done(error, channel);
	});
      },
      items: function ( done ) {
	adminDataModule.getSyndicationItems(options, done);
      }
    }, function ( error, results ) {
      next(error, results);
    });
  };

  adminDataModule.verifySubscriptions = function ( options, next ) {
    adminDataModule.db.verifySubscriptions(options, next);
  };

})(module.exports);
