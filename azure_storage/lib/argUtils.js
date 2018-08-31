module.exports = argUtils = {
	toArray: function ( args ) {
		var a = [];
		for(var i = 0; i < args.length; i++) {
			a[i] = args[i];
		}
		return a;
	}
};