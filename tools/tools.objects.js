var _ = require('underscore');

(function ( tools ) {

	var strategies = {

	};

	tools.MaybeHasPropery = function ( obj ) {
		var me = this;
		me.base = obj || {};
		var value = me.base;
		me.getProperty = function( property ) {
			value = value !== undefined ? value[property] : undefined;
			return apis.traverse;
		};
		me.value = function () {
			var outVal = value !== undefined ? value : undefined;
			value = me.base;
			return outVal;
		};
		me.set = function ( trace, val ) {
			var obj = me.base;
			trace.forEach(function ( property, depth ) {
				if (depth === trace.length - 1) {
					obj[property] = val;
				} else {
					obj[property] = obj[property] || {};
				}
				obj = obj[property];
			});
			return obj;
		};
		var apis = {
			traverse: {
				getProperty: me.getProperty,
				value: me.value
			}
		};
	};

	tools.ObjectBuilder = function ( obj ) {
		var me = this;
		me.eventHandlers = {
			set: []
		};
		
		me.registry = new tools.MaybeHasPropery(obj || {});
		
		me.get = function ( fqn, sep ) {
			var trace, val;

			if (!fqn){ return me.registry.value();}
			
			trace = mktrace(fqn, sep);
			val = trace.reduce(function ( result, name ) {
				return me.registry.getProperty(name);
			}, 0).value();
			
			return {
				value: val,
				trace: trace,
				fqn: fqn
			};
		};
		me.set = function ( fqn, value, sep) {
			var trace, setObject;

			trace = mktrace(fqn, sep);
			setObject = me.registry.set(trace, value);
			
			triggerEvent('set', [fqn, value]);
			return setObject;
		};

		me.reset = function ( obj ) {
			var me = this;
			me.registry = new tools.MaybeHasPropery(obj || {});
		};

		me.on = function ( eventName, handler, bindingCtx ) {
			if(Object.keys(me.eventHandlers).indexOf(eventName) >= 0) {
				me.eventHandlers[eventName].push({
					ctx: bindingCtx,
					fn: handler
				});
			}
		};

		me.flatten = function ( key, sep ) {
			var data = !key ?
				me.get() :
				me.get(key, sep).value;

			var flat = {};
			(function flatten ( namespace, data, output ) {
				Object.keys(data).forEach(function ( key ) {
					var fqn = namespace ?
						namespace.concat('.', key) :
						key;

					if(_.isObject(data[key])) {
						flatten(fqn, data[key], output);
					} else {
						output[fqn] = data[key];
					}
				});
			}('', data, flat));
			return flat;
		};

		function mktrace ( fqn, sep ) {
			return _.isString(fqn) ?
				fqn.split(sep ? sep : '.') :
				fqn;
		}

		function triggerEvent ( name, args ) {
			var handlers = me.eventHandlers[name];
			if (!handlers || !handlers.length) { return; }
			
			handlers.forEach(function ( handler ) {
				handler.fn.apply(handler.ctx, args);
			});
		}
	};

}(module.exports));