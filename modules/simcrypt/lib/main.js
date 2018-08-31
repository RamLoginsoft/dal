
var crypto = require("crypto");
var encType = "aes-256-cbc";
var _key;

exports.encrypt = encrypt;
exports.encryptJSON = encryptJSON;
exports.decrypt = decrypt;
exports.decryptJSON = decryptJSON;
exports.setKey = setKey;
exports.sha1 = sha1;

function setKey(key) {
	_key = key;
}

function encrypt(obj) {
	var cipher = crypto.createCipher(encType, _key);
	var encrypted = cipher.update(obj,'utf8','hex');
	encrypted += cipher.final('hex');
	return encrypted;
}

function encryptJSON(obj) {
	return encrypt(JSON.stringify(obj));
}

function decrypt(obj) {
	var decipher = crypto.createDecipher(encType, _key);
	var decrypted = decipher.update(obj,'hex','utf8');
	try {
		decrypted += decipher.final('utf8');
	} catch (ex) {
		decrypted = "{}";
	}
	return decrypted;
}

function decryptJSON(obj) {
	return JSON.parse(decrypt(obj));
}

function sha1(obj) {
	var shasum = crypto.createHash('sha1');
	shasum.update(obj); // Must be a string or buffer
	return shasum.digest('hex');
}
