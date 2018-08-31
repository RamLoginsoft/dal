(function () {
	
	var tool = {};

	tool.make = function(n, val) {
		var i = 0;
		var result = [];
		//var fn = func ? func : function (id) { return id; };
		for(i; i < n; i++) {
			result.push(val);
		}
		return result;
	};

	tool.alldim = function(arrays, n) {
		if (arrays instanceof Array && arrays[0] instanceof Array) {
				var desiredLength = n != null ? n : arrays[0].length;
				return !arrays.some(function (e) {
					return e.length !== desiredLength;
				});
		}
		return false;
	};

	tool.pointwise = function (arrays, addFunc) {
		if (!tool.alldim(arrays)) { return []; }
		return arrays.reduce(function(p, c, i, a) {
			return p ?
				c.map(function (cc, ii, aa) {
					return addFunc.call(null, p[ii], cc);
				}) :
				c;
		});
	};

	tool.addPointwise = function (arrays) {
		return tool.pointwise(arrays, function (p1, p2) {
			return p1 + p2;
		});
	};

	tool.subtractPointwise = function (arrays) {
		return tool.pointwise(arrays, function (p1, p2) {
			return p1 - p2;
		});
	};

	tool.weightedAverage = function (values, weights) {
		if (!tool.alldim([values, weights])) { return 0; }
		var weightTotals = 0;
		var weigtedSum = values.reduce(function (p, c, i, a) {
			weightTotals = weightTotals + weights[i];
			return p + c * weights[i];
		}, 0);
		return weightTotals ? weigtedSum / weightTotals : 0;
	};

	tool.valuesOnly = function (obj, properties) {
		properties = properties || Object.keys(obj);
		return properties.reduce(function (p, c) {
			var prop = obj[c];
			if (prop) { p.push(prop); }
			return p;
		}, []);
	};

	tool.distinct = function(collection, properties) {
		var delimiter = '|_|';
		var result = collection.reduce(function (p, c, i, a) {
			var stringVal = [].join.call(tool.valuesOnly(c, properties), delimiter);
			if (p.lookup.indexOf(stringVal) < 0) {
				p.lookup.push(stringVal);
				p.collection.push(c);
			}
			return p;
		}, { collection: [], lookup: [] });
		return result.collection;
	};

	tool.select = function ( collection, properties ) {
		return collection.reduce(function ( p, c ) {
			var selected = {};
			properties.forEach(function ( property ) {
				selected[property] = c[property];
			});
			p.push(selected);
			return p;
		}, []);
	};

	var predicates = {
		'eq': function ( property, value ) {
			return this[property] === value;
		},
		'neq': function( property, value ) {
			return this[property] !== value;
		},
		'lt': function ( property, value ) {
			return this[property] < value;
		},
		'lteq': function ( property, value ) {
			return this[property] <= value;
		},
		'gt': function ( property, value ) {
			return this[property] > value;
		},
		'gteq': function ( property, value ) {
			return this[property] >= value;
		},
		'in': function ( property, collection ) {
			return collection.indexOf(this[property]) >= 0;
		},
		'nin': function ( property, collection ) {
			return collection.indexOf(this[property]) === -1;
		}
	};

	var applyFilter = function ( item, filter ) {
		return predicates[filter.op].call(item, filter.property, filter.against);
	};

	tool.filter = function ( data, filters ) {
		var filterCollection = filters.op ? [filters] : filters;
		return filterCollection.reduce(function ( filteredData, currentFilter ) {
			return filteredData.reduce(function ( passingData, dataItem ) {
				var bypass = (currentFilter.bypass && currentFilter.bypass.call(currentFilter, dataItem));
				if (bypass || applyFilter(dataItem, currentFilter)) {
					passingData.push(dataItem);
				}
				return passingData;
			}, []);
		}, data);
	};

	tool.alias = function ( collection, mapObj ) {
		if (!mapObj || !collection.length) {
			return collection;
		}
		return collection.reduce(function ( aliasedCollection, unaliased ) {
			var aliased = Object.keys(unaliased).reduce(function ( aliasing, name ) {
				if (mapObj.hasOwnProperty(name)) {
					aliasing[mapObj[name]] = unaliased[name];
				} else {
					aliasing[name] = unaliased[name];
				}
				return aliasing;
			}, {});
			aliasedCollection.push(aliased);
			return aliasedCollection;
		}, []);
	};

	var CollectionPipeline = function ( collection ) {
		var self = this;
		self.value = collection;
		self.select = function ( properties ) {
			self.value = tool.select.call(null, self.value, properties);
			return self;
		};
		self.filter = function ( filters ) {
			self.value = tool.filter.call(null, self.value, filters);
			return self;
		};
		self.distinct = function ( properties ) {
			self.value = tool.distinct.call(null, self.value, properties);
			return self;
		};
		self.alias = function ( mapObj ) {
			self.value = tool.alias.call(null, self.value, mapObj);
			return self;
		};
	};

	tool.from = function ( collection ) {
		return new CollectionPipeline(collection);
	};

	module.exports = tool;

}());
