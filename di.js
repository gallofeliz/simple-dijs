var assert = require('assert');
var format = require('util').format;

var Di = function (/*values*/) {
	this._definitions = {};
	this._factory = [];
};

Di.prototype = {
	has: function (id) {
		return typeof this._definitions[id] === 'undefined' ? false : true;
	},
	_single: function (func) {
		return function (di) {
			this.value = func(di);
			return this.value;
		};
	},
	set: function (id, funcOrValue) {
		assert(arguments.length >= 2, 'Two arguments required');
		assert(typeof id === 'string', 'Expected string id');
		assert.equal(this.has(id), false, format('Identifier "%s" already defined', id));

		var isFunction = typeof funcOrValue === 'function',
			isInFactory = isFunction && this._factory.indexOf(funcOrValue) !== -1;

		this._definitions[id] = isFunction
			? { func: isInFactory ? funcOrValue : this._single(funcOrValue) }
			: { value: funcOrValue };
		this._factory = [];

		return this;
	},
	get: function (id) {
		assert(arguments.length >= 1, 'One argument required');
		assert(typeof id === 'string', 'Expected string id');
		assert.equal(this.has(id), true, format('Identifier "%s" is not defined', id));

		var definition = this._definitions[id],
			hasValue = Object.keys(definition).indexOf('value') !== -1;

		return hasValue
			? definition.value
			: definition.func(this);
	},
	factory: function (func) {
		assert(arguments.length >= 1, 'One argument required');
		assert(typeof func === 'function', 'Expected function func');
		this._factory.push(func);

		return func;
	},
	/*protect: function (func) {
	},
	raw: function (id) {
	},
	extend: function (id, func) {
	},
	has: function (id) {
	},
	remove: function ($id) {
	},
	*/
	keys: function () {
		return Object.keys(this._definitions);
	}
};

module.exports = Di;