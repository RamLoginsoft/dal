var async = require('async'),
_ = require('underscore');

var argUtils = require('./argUtils');

module.exports = BlobClient;

/**
 * Offers access to Azure blob storage services.
 * @param {Object} config Configuration options.
 * @param {string} config.container The name of the blob storage container.
 * @param {Object} config.blobService Blob service configured from call to 
 *                                    the azure-storage module's
 *                                    "createBlobService" method.
 */
function BlobClient ( config ) {
	this.container = config.container;
	this.blobService = config.blobService;
}

/**
 * Gets a blob from Azure Storage.
 * @param  {Object}   options Config options.
 * @param  {Array[string]}   options.include List of additional data to include in final callback.
 *                                   Example: ['Properties', 'Metadata']
 * @param  {String}   options.to The format in which to return the blob ('Text'|'Stream'|'File'). This will 
 *                               be the last argument in the final callback.
 * @param  {Function} next    The callback.
 * @return {[type]}           [description]
 */
BlobClient.prototype.get = function ( options, next ) {
	var me = this;
	var queue = me.get._configure.call(me, options);
	// console.log(queue);
	// next(0, 'ok');
	me.execute(queue, next);
};

/**
 * Based on the method call for the blob service, we'll construct the function
 * for the async.waterfall differently.
 * @param  {object} options Client config options.
 * @param  {object} method  The method to call on blob service.
 * @return {Function}         The function to appear in the final async waterfall queue.
 */
BlobClient.prototype._getQueueFn = function ( options, method ) {
	var me = this;
	var methodArgs = getMethodArgs(options, method);
	
	return baseQueueFn.bind(null, method, methodArgs);

	function baseQueueFn ( method, methodArgs ) {
		var piped = argUtils.toArray(arguments).slice(2); /* don't want args when bound ( method, or methodArgs ) */
		me.blobService[method].apply(me.blobService, methodArgs.concat([function ( ) {
			var results = argUtils.toArray(arguments),
			done = piped.pop(),
			error = results.shift();
			piped.push(results);
			return done.apply(null, [error].concat(piped));
		}]));
	}

	function getMethodArgs ( options ) {
		var baseArgs = [me.container, options.name];
		if (options._argNum > 2) {
			if (options.as === 'File') {
				baseArgs.push(options.to || options.from);
			}
			if (options.as === 'Stream') {
				baseArgs.push(options.to || options.from);
			}
			if (options.length) {
				baseArgs.push(options.length);
			}
		}
		return baseArgs;
	}
};

/**
 * Based on client options, an async waterfall queue is configured here.
 * @param  {object}   options The client options.
 * @return {[type]}           Array of functions for "execute";
 */
BlobClient.prototype.get._configure = function ( options ) {
	var me = this, queue = [],
	base = 'getBlob';
	_.extend(options, { _argNum: 2 });

	options.include = options.include || [];
	options.include.forEach(function ( attr ) {
		var method = base + attr;
		queue.push(me._getQueueFn(options, method));
	});

	if (options.as) {
		var method = base + 'To' + options.as;
		options._argNum = 3;
		queue.push(me._getQueueFn(options, method));
	}
	
	return queue;
};

// BlobClient.prototype.create = function ( options, next ) {
// 	var me = this;
// 	var queue = me.create._configure.call(me, options);
// 	console.log('queue', queue);
// 	//next(0, 'ok');
// 	me.execute(queue, next);
// };

// /**
//  * Configures the queue of functions to be called.
//  * @param  {Object} options		Client options.
//  * @return {Array[Function]}	List of functions to execute.
//  */
// BlobClient.prototype.create._configure = function ( options ) {
// 	var me = this, queue = [],
// 	base = 'createBlockBlob',
// 	method = base + 'From' + options.as;
// 	_.extend(options, { _argNum: 3 });

// 	if (!options.to) {
// 		options.to = me.blobService.createWriteStreamToBlockBlob(
// 			me.container,
// 			options.name,
// 			options.meta || {},
// 			function ( error, result, response ) {
// 				if (error) {
// 					console.log(error);
// 				}
// 			}
// 		);
// 	}

// 	queue.push(me._getQueueFn(options, method));
// 	return queue;
// };

/**
 * Executes the queue of functions and continues to pass the parameter
 * responses from each consecutive blob service call to the next in the chain.
 * @param  {Array}   queue List of functions to execute.
 * @param  {Function} next  The final callback.
 */
BlobClient.prototype.execute = function ( queue, next ) {
	async.waterfall(queue, function ( ) {
		next.apply(null, arguments);
	});
};

BlobClient.prototype.util = {
	name: function ( ) {
		var name = '', delim = '\/', toDelim, maxDelim = arguments.length - 2;
		for(var i = 0; i < arguments.length; i++) {
			toDelim = i <= maxDelim;
			name = name.concat(
				arguments[i],
				toDelim ? delim : ''
				);
		}
		return name;
	}
};