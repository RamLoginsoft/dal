var should = require("should");
var simcrypt = require("../lib/main");

// Set the key for encryption/decryption
simcrypt.setKey("this is a test key that can really be any string");

describe('simcrypt', function() {
	// Test sha1() function.
	describe('#sha1()', function() {
		it('returns correct hash', function() {
			var testValue = "test";
			var hashValue = simcrypt.sha1(testValue);
			hashValue.should.eql("a94a8fe5ccb19ba61c4c0873d391e987982fbbd3");
		});
	});

	// Test encrypt() and decrypt() functions.
	describe("#encrypt(decrypt(value))", function() {
		it("has correct value after decrypting", function() {
			var testValue = "this is a test";
			var encryptedValue = simcrypt.encrypt(testValue);
			var decryptedValue = simcrypt.decrypt(encryptedValue);
			testValue.should.eql(decryptedValue);
		});
	});
});