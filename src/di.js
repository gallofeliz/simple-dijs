/**
    Create a new Container

    @constructor
    @param {Object.<string, *>} [values] Values to set on construction (eqiv batchSet {@link Di#batchSet})
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
    this._protect = [];

    if (values) {
        this.batchSet(values);
    }
};

/**
    Get a value asynchronously with callback (registered with callback)
    @method get
    @memberof Di
    @instance
    @variation 2
    @param {string}      id The value id
    @param {function}    callback The callback
    @returns {undefined}
    @throws {Error} Missing or incorrect argument
    @throws {Error} Missing value (not registered)
    @throws {Error} Unexpected callback for no-callback registered value
    @throws {Error} Invalid callback
    @example
        *di.get('database', function (err, database) {
        *    if (err) {
        *        // ...
        *    }
        *    database.find(userId);
        *})
*/
Di.prototype = {
    /**
        Multiple set values

        @param {Object.<string, *>} values Values to set
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

        if (typeof values !== 'object' || values === null) {
            throw new Error('Expected argument values type Object');
        }

        Object.keys(values).forEach(function (id) {
            that.set(id, values[id]);
        });

        return this;
    },
    /**
        Check that the container owns the provided id

        @param {string} id Id to check
        @returns {boolean} If id is owned by the container
        @example
            di.has('database') || di.set('database', ...)
    */
    has: function (id) {
        return typeof this._definitions[id] !== 'undefined';
    },
    /**
        *Set a value in the container. The registered value is by default the returned value.
        *
        *In case you use a function to factory your value :
        *    - you can use the first injected argument that is the current Di instance.
        *    - you can register your value (for example for asynchronous) by declaring and
        *calling the second possible argument "callback", as a normal node callback.

        @summary Set a value in the container, synchronously or asynchronously
        @param {string} id The id of value
        @param {*} funcOrValue The value
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
        *@example <caption>Set a building function that use callback for async</caption>
            *di.set('config', function (di, callback) {
            *   fs.readFile('config.json', callback);
            *})
    */
    set: function (id, funcOrValue) {

        if (typeof id !== 'string') {
            throw new Error('Expected argument id type string');
        }

        if (arguments.length < 2) {
            throw new Error('Expected argument funcOrValue');
        }

        if (this.has(id)) {
            throw new Error('Identifier "%s" already defined'.replace('%s', id));
        }

        var isFunction = typeof funcOrValue === 'function',
            isProtected = isFunction && this._protect.indexOf(funcOrValue) !== -1,
            isInFactory = isFunction && this._factory.indexOf(funcOrValue) !== -1;

        this._definitions[id] = isFunction && !isProtected
                                ? {
                                    func: funcOrValue,
                                    isFactory: isInFactory,
                                    hasCallbackArg: this._hasCallbackArg(funcOrValue)
                                }
                                : { value: funcOrValue };

        if (isInFactory) {
            this._factory.splice(this._factory.indexOf(funcOrValue), 1);
        }

        if (isProtected) {
            this._protect.splice(this._protect.indexOf(funcOrValue), 1);
        }

        return this;
    },
    _hasCallbackArg: function (func) {
        return func.toString()
                    .match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1]
                    .split(',')
                    .length >= 2;
    },
    /**
        Get a value synchronously

        @param {string} id The value id
        @returns {*} The value
        @throws {Error} Missing or incorrect argument
        @throws {Error} Missing value (not registered)
        @throws {Error} Missing callback for callback-registered value
        @example
            di.get('database').find(userId)
    */
    get: function (id) {

        if (typeof id !== 'string') {
            throw new Error('Expected argument id type string');
        }

        if (!this.has(id)) {
            throw new Error('Identifier "%s" is not defined'.replace('%s', id));
        }

        var definition = this._definitions[id],
            isFuncDefinition = Object.keys(definition).indexOf('func') !== -1;

        switch (true) {
            case !isFuncDefinition:
                return definition.value;
            case definition.hasCallbackArg:
                if (arguments.length < 2 || typeof arguments[1] !== 'function') {
                    throw new Error('Expected callback function with callback registered value');
                }
                this._getCbFn(definition, arguments[1]);
                return undefined;
            default:
                if (arguments.length > 1) {
                    throw new Error('Unexpected callback with no-callback registered value');
                }
                return this._getFn(definition);
        }
    },
    _getFn: function (definition) {
        var hasValue = Object.keys(definition).indexOf('value') !== -1;

        var value = hasValue && !definition.isFactory ? definition.value : definition.func(this);

        if (!hasValue && !definition.isFactory) {
            definition.value = value;
        }

        return value;
    },
    _getCbFn: function (definition, callback) {
        var hasValue = Object.keys(definition).indexOf('value') !== -1;

        if (hasValue && !definition.isFactory) {
            callback(null, definition.value);
            return;
        }

        if (definition.isFactory) {
            this._execCbFn(definition.func, [callback]);
            return;
        }

        if (typeof definition.callbacks === 'undefined') {
            definition.callbacks = [function (err, value) {
                if (!err) {
                    definition.value = value;
                }
                delete definition.callbacks;
            }, callback];
            this._execCbFn(definition.func, definition.callbacks);
            return;
        }

        definition.callbacks.push(callback);
    },
    _execCbFn: function (func, listeners) {
        var callListeners = function (err, value) {
            listeners.forEach(function (callback) {
                err ? callback(err) : callback(err, value);
            });
        };

        try {
            func(this, callListeners);
        } catch (e) {
            callListeners(e);
        }
    },
    /**
        Create a factory function
        @see Di#set
        @param {Function} func The function to factory
        @returns {Function} The same function
        @throws {Error} Missing or incorrect argument
        @throws {Error} Protected function
        @example
            *di.set('token', di.factory(function () {
            *   return new Token();
            *}))
    */
    factory: function (func) {

        if (typeof func !== 'function') {
            throw new Error('Expected argument func type function');
        }

        if (this._protect.indexOf(func) !== -1) {
            throw new Error('Cannot factory a protected function');
        }

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
    /**
        Protect a function to store as raw
        @see Di#set
        @param {Function} func The function to factory
        @returns {Function} The same function
        @throws {Error} Missing or incorrect argument
        @throws {Error} Factory function
        @example
            *di.set('math.add', di.protect(function (a, b) {
            *   return a + b;
            *}))
    */
    protect: function (func) {

        if (typeof func !== 'function') {
            throw new Error('Expected argument func type function');
        }

        if (this._factory.indexOf(func) !== -1) {
            throw new Error('Cannot protect a factory function');
        }

        this._protect.push(func);

        return func;
    },
    /**
        Remove a value

        @param {string} id The value id
        @returns {Di} himself
        @throws {Error} Missing or incorrect argument
        @throws {Error} Missing value (not registered)
        @example
            di.remove('database')
    */
    remove: function (id) {

        if (typeof id !== 'string') {
            throw new Error('Expected argument id type string');
        }

        if (!this.has(id)) {
            throw new Error('Identifier "%s" is not defined'.replace('%s', id));
        }

        delete this._definitions[id];

        return this;
    }
    /*
    extend: function (id, func) {
    },
    replace: function () {}
    */
};

/**
    @deprecated Use {@link Di#set} instead
    @method
*/
Di.prototype.register = Di.prototype.set;

module.exports = Di;