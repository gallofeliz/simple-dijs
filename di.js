var assert = function (condition, errorMessage) {
    if (!condition) {
        throw new Error(errorMessage);
    }
};

/**
    Create a new Container

    @constructor
    @param [values] {Object.<string, *>} Values to set on construction (eqiv batchSet {@link Di#batchSet})
    @example
        var di = new Di()
    *@example
        *var di = new Di({
        *   id1: value1,
        *   id2: value2
        *})
*/
var Di = function (values) {
    this._definitions = {};
    this._factory = [];

    if (values) {
        this.batchSet(values);
    }
};

Di.prototype = {
    /**
        Multiple set values

        @param values {Object.<string, *>} Values to set
        @throws {Error} If values is not provided or not Object
        @returns {Di} himself
        @example
            *di.batchset({
            *    id1: value1,
            *    id2: value2
            *})
    */
    batchSet: function (values) {
        var that = this;
        assert(arguments.length >= 1, 'One argument required');
        assert(typeof values === 'object' && values !== null, 'Expected argument values to be Object');
        Object.keys(values).forEach(function (id) {
            that.set(id, values[id]);
        });

        return this;
    },
    /**
        Check that the container owns the provided id

        @param id {string} Id to check
        @returns {boolean}
        @example
            di.has('database') || di.set('database', ...)
    */
    has: function (id) {
        return typeof this._definitions[id] === 'undefined' ? false : true;
    },
    /**
        Set a value in the container
        @param id {string} The id of value
        @param funcOrValue {*} The value
        @returns {Di} himself
        @throws {Error} if missing or incorrect arguments
        @throws {Error} if Id is already registered
        @example <caption>Set a raw value</caption>
            *di.set('color', '#ff0000')
        *@example <caption>Set a building function (value with be cached after first call)</caption>
            *di.set('database', function (di) {
            *   return new Database(di.get('database_url'));
            *})
        *@example <caption>Set a factory function (value will be factoryed each call)</caption>
            *di.set('token', di.factory(function () {
            *   return new Token();
            *}))
        *@example <caption>Set a building function that returns a promise</caption>
            *di.set('config', function () {
            *   return fsPromise.readFile('config.json');
            *})
    */
    set: function (id, funcOrValue) {
        assert(arguments.length >= 2, 'Two arguments required');
        assert(typeof id === 'string', 'Expected string id');
        assert(this.has(id) === false, 'Identifier "%s" already defined'.replace('%s', id));

        var isFunction = typeof funcOrValue === 'function',
            isInFactory = isFunction && this._factory.indexOf(funcOrValue) !== -1;

        this._definitions[id] = isFunction ?
                                { func: isInFactory ? funcOrValue : this._single(funcOrValue) } :
                                { value: funcOrValue };

        if (isInFactory) {
            this._factory.splice(this._factory.indexOf(funcOrValue), 1);
        }

        return this;
    },
    /**
        Get a value

        @param id {string} The value id
        @returns {*} The value
        @throws {Error} Missing or incorrect argument
        @throws {Error} Missing value (not registered)
        @example
            di.get('database').find(userId)
        *@example
            *di.get('database').done(function (database) {
            *   database.find(userId);
            *})
    */
    get: function (id) {
        assert(arguments.length >= 1, 'One argument required');
        assert(typeof id === 'string', 'Expected string id');
        assert(this.has(id) === true, 'Identifier "%s" is not defined'.replace('%s', id));

        var definition = this._definitions[id],
            hasValue = Object.keys(definition).indexOf('value') !== -1;

        return hasValue ?
            definition.value :
            definition.func(this);
    },
    /**
        Create a factory function
        @see Di#set
        @param {Function} The function to factory
        @returns {Function} The same function
        @throws {Error} Missing or incorrect argument
        @example
            *di.set('token', di.factory(function () {
            *   return new Token();
            *}))
    */
    factory: function (func) {
        assert(arguments.length >= 1, 'One argument required');
        assert(typeof func === 'function', 'Expected function func');
        this._factory.push(func);

        return func;
    },
    /**
        Get all the ids
        @returns {string[]} the ids
    */
    keys: function () {
        return Object.keys(this._definitions);
    },
    _single: function (func) {
        return function (di) {
            this.value = func(di);
            return this.value;
        };
    }
    /*
    protect: function (func) {
    },
    raw: function (id) {
    },
    extend: function (id, func) {
    },
    remove: function ($id) {
    },
    */
};

Di.prototype.register = Di.prototype.set;

module.exports = Di;