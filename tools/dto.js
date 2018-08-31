var casing = require('change-case'),
_ = require('underscore');

(function ( dto ) {
	
	dto.camelCase = function ( data ) {
		return _.chain(data)
			.allKeys()
			.reduce(function ( memo, key ) {
				memo[casing.camelCase(key)] = data[key];
				return memo;
			}, {})
			.value();
	};

	dto.wrapCallback = function ( callback ) {
		return function ( error, data ) {
			if (error) { return callback(error); }
			return callback(null,
				_.map(data, function ( item ) {
					return dto.camelCase(item);
				}));
		};
	};

}(module.exports));