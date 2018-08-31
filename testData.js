var defaultDatabase = require('./database').static,
_ = require('underscore');

(function( testDataModule ) {

	testDataModule.db = defaultDatabase;

	testDataModule.use = function ( database ) {
		this.db = database;
		return this;
	};

	testDataModule.getTestBridges = function ( options, next ) {
		testDataModule.db.getTestBridges(options, function ( err, results ) {
			if (err) {
				return next(err);
			}
			return next(0,
				results.map(function ( dataItem ) {
					return new TestBridgeData(dataItem);
				})
			);
		});
	};

}(module.exports));

function TestBridgeData ( data ) {
	this.key = data.SimpleApiKey;
	this.bridgeName = data.LongName;
	this.productName = data.ProductName;
	this.configValues = JSON.parse(data.ConfigValues);
	this.authValues = JSON.parse(data.AuthValues);
	this.versionNumber = data.VersionNumber;
	this.dirName =
		this.productName.replace(/\s/, '_') +
		'/' +
		this.versionNumber.replace(/\s/, '_');
	this.fullName =
		this.productName +
		' ' +
		this.versionNumber;
}