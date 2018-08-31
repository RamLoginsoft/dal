var async = require('async'),
azure = require('azure-storage');

var BlobClient = require('./lib/BlobClient');

(function ( azure_storage ) {

	var _init;

	azure_storage.init = function ( config ) {
		if(_init) { return; }
		azure_storage.paymentHistories = new BlobClient({
			blobService: azure.createBlobService(config.account, config.key),
			container: config.containers.paymentHistoryAssets
		});
		
		if(config.debug) {
			azure_storage.paymentHistories.blobService.logger =
				new azure.Logger(azure.Logger.LogLevels.DEBUG);
		}

		_init = true;
	};
	
}(module.exports));