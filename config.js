var
ObjectBuilder = require('./tools/tools.objects').ObjectBuilder,
_database = require('./database').static;

var configInstances = {};

module.exports = {
	app: function ( app, database ) {
		database = database || _database;
		if (!configInstances[app]) {
			configInstances[app] = new Configuration(app, database);
		}
		return configInstances[app];
	}
};

/**
 * Simple key-value store of configuration data.
 */
function Configuration ( app, database ) {
	this._initialized = false;
	this.cache = new ObjectBuilder();
	this.application = app;
	this.db = database;
}

/**
 * Returns the value of the configuration item matching key.
 * @param  {string} key The config item key
 * @return {string}     The value of the configuration item.
 */
Configuration.prototype.read = function ( key ) {
	var me = this;
	if (!me._initialized) { throw new Error('not initialized'); }
	
	return key ?
		me.cache.get(key).value :
		me.cache.get();
};

/**
 * Turns config object into a flat object with fully-qualified
 *	property names, i.e., the namespaced values.
 * @param  {string} key If a provided, the flattened key value will be returned.
 * @return {object}     The flattened cache object.
 */
Configuration.prototype.flatten = function ( key ) {
	var me = this;
	return me.cache.flatten(key);
};

/**
 * Initializes the cache of the configuration items.
 * @param  {Function} next Executes callback when completed.
 */
Configuration.prototype.init = function ( data, next ) {
	var me = this;
	if (data) {
		me.cache.reset(data);
		me._initialized = true;
		return next ? next() : undefined;
	}
	
	me.db.getAppConfiguration({
			application: me.application
		}, function ( error, data ) {
			if (error) { return next(error); }
			if (data.forEach) {
				data.forEach(function ( dataItem ) {
					me.cache.set(dataItem.Key, dataItem.Value);
				});
			} else {
				me.cache.reset(data);
				me._initialized = true;
			}
			next();
		});
};

/**
 * Returns a new configuration object from the key value.
 * @param  {string} key The key name.
 * @return {Configuration}     The new configuration instance.
 */
Configuration.prototype.fork = function ( key ) {
	var me = this;
	var instance = new Configuration(me.application),
	keyData = me.read(key) || {};
	instance.init(keyData);
	return instance;
};

/**
 * Returns a subset of main cache based on key params.
 * @return {object} The partial config object;
 */
Configuration.prototype.select = function ( ) {
	var me = this,
	i = 0,
	buffer = {};

	for(i; i < arguments.length; i++) {
		buffer[arguments[i]] = me.cache.get(arguments[i]).value;
	}
	return buffer;
};