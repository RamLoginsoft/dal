var
async = require('async'),
EventEmitter = require('events').EventEmitter,
r = require('ramda'),
util = require('util');

(function ( objects ) {
		
	function MethodTest ( options ) {
		var me = this;
		options.params = options.params || [];

		me.id = '';
		me.method = options.method;
		me.data = options.data || {};
		me.params = r.map(function ( param ) {
			// copy options, because we want to be able
			//	to modify them per instance
			return param;
		}, options.params);
	}

	util.inherits(MethodTest, EventEmitter);

	MethodTest.prototype.execute = function ( dbCtx ) {
		var me = this;	
		return me.id = dbCtx[me.method].apply(dbCtx, me.params);
	};

	function LoadTest ( options ) {
		this.queue = options.queue;
		this.arrangement = options.setsUpTo ? 'setsUpTo': 'setsOf';
		this[this.arrangement] = options[this.arrangement];
	}

	LoadTest.prototype.arrangeToSets = function ( ) {
		return this.arrangers[this.arrangement].call(this, this.setsOf || this.setsUpTo, this.queue);
	};

	LoadTest.prototype.arrangers = {
		setsOf: function ( n, list ) {
			return r.splitEvery(n, list);
		},
		setsUpTo: function ( n, list ) {
			throw new Error('not implemented');
		}
	};

	objects.LoadTest = function ( options ) {
		return new LoadTest(options);
	};

	objects.MethodTest = function ( options ) {
		return new MethodTest(options);
	};

}(module.exports));