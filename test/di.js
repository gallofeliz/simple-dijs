var assert = require('assert');
var Di = require('../dist/di');

describe('Di', function () {

    var di;

    beforeEach(function () {
        di = new Di();
        di.set('trap', 'trap');
    });

    describe('constructor', function () {
        it('Call with arg values', function () {
            /* Proxy of batchSet / can use mock - Only this test, see #batchSet */
            di = new Di({
                'myId': 'something',
                'myId2': 'something-else'
            });

            assert.strictEqual(di.get('myId'), 'something');
            assert.strictEqual(di.get('myId2'), 'something-else');
        });
    });

    describe('#batchSet', function () {

        it('Call with non-object values', function () {
            try {
                di.batchSet('myId');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Expected argument values type Object');
            }
        });

        it('Call (normal)', function () {
            var returned = di.batchSet({
                'myId': 'something',
                'myId2': 'something-else'
            });

            assert.strictEqual(returned, di);
            assert.strictEqual(di.get('myId'), 'something');
            assert.strictEqual(di.get('myId2'), 'something-else');
        });
    });

    describe('#set', function () {

        it('Call with non-string id', function () {
            try {
                di.set({'my': 'id'}, 'something');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Expected argument id type string');
            }
        });

        it('Call without funcOrValue', function () {
            try {
                di.set('myId');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Expected argument funcOrValue');
            }
        });

        it('Call with already set id', function () {
            di.set('myId', 'something');
            try {
                di.set('myId', 'something else');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Identifier "myId" already defined');
            }
        });

        it('Call (normal)', function () {
            var returned = di.set('myId', 'something');
            assert.strictEqual(di.get('myId'), 'something');
            assert.strictEqual(returned, di);
        });

        it('Call (normal) sync function', function (cb) {
            var returned = di.set('myId', function (injectedDi) {
                assert.strictEqual(injectedDi, di);
                return 'something';
            });

            assert.strictEqual(di.get('myId'), 'something');
            assert.strictEqual(returned, di);
        });

        it('Call (normal) async callback resolving function', function (cb) {
            var returned = di.set('myId', function (injectedDi, callback) {
                assert.strictEqual(injectedDi, di);
                callback(null, 'something');
            });

            assert.strictEqual(returned, di);
            di.get('myId', function (err, value) {
                assert.strictEqual(err, null);
                assert.strictEqual(value, 'something');
                cb();
            });
        });

        it('Call (normal) async callback rejecting function', function (cb) {
            var error = new Error('Error connection database');

            var returned = di.set('myId', function (injectedDi, callback) {
                assert.strictEqual(injectedDi, di);
                callback(new Error('Error connection database'));
            });

            assert.strictEqual(returned, di);
            di.get('myId', function (err, value) {
                assert.strictEqual(arguments.length, 1);
                assert.strictEqual(err, error);
                cb();
            });
        });

    });

    it('#register alias of #set', function () {
        assert.strictEqual(di.register, di.set);
        var returned = di.register('something', 1);
        assert.strictEqual(di.get('something'), 1);
        assert.strictEqual(returned, di);
    });

    describe('#remove', function () {

        it('Call with non-string id', function () {
            try {
                di.remove({'my': 'id'});
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Expected argument id type string');
            }
        });

        it('Call with unexisting id', function () {
            try {
                di.remove('myId');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Identifier "myId" is not defined');
            }
        });

        it('Correct call (existing id)', function () {
            di.set('server', function () {
                return {};
            });

            var returns = di.remove('server');
            assert.strictEqual(returns, di);
            assert(!di.has('server'));
        });
    });

    describe('#get', function () {

        it('Call with non-string id', function () {
            try {
                di.get({'my': 'id'});
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Expected argument id type string');
            }
        });

        it('Call with unexisting id', function () {
            try {
                di.get('myId');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Identifier "myId" is not defined');
            }
        });

        it('Call with existing id having value', function () {
            di.set('myId', 'something');
            assert.strictEqual(di.get('myId'), 'something');
        });

        it('Call with existing id having function', function () {
            var returnDi = di.set('myId', function (injectedDi) {
                assert.strictEqual(injectedDi, di);
                return ['something'];
            });

            var firstCall = di.get('myId');
            var secondCall = di.get('myId');
            assert.strictEqual(firstCall, secondCall);
            assert.deepEqual(firstCall, ['something']);
            assert(returnDi, di);
        });

    });

    describe('#keys', function () {

        it('Call (normal)', function () {
            di.set('one', 1);
            di.set('two', function () { return 2; });
            assert.deepEqual(di.keys().sort(), ['trap', 'one', 'two'].sort());
        });

    });

    describe('#has', function () {
        it('Call when has', function () {
            di.set('myId', 1);
            assert.strictEqual(di.has('myId'), true);

        });

        it('Call when has not', function () {
            assert.strictEqual(di.has('myId'), false);
        });
    });

    describe('#protect', function () {

        it('Call with non-function argument', function () {
            try {
                di.protect('Please protect me');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Expected argument func type function');
            }
        });

        it('Call on factory function', function () {
            var factoryFunc = di.factory(function (di) {
                return {};
            });

            try {
                di.protect(factoryFunc); // Non-sense !
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Cannot protect a factory function');
            }
        });

        it('Call correct', function () {
            di.set('math.add', di.protect(function (a, b) {
                return a + b;
            }));

            var mathAdd = di.get('math.add');
            assert.strictEqual(mathAdd(5, 7), 12);
        });

        it('Call (normal) queue with #set', function () {
            var mathAdd = di.protect(function (a, b) {
                    return a + b;
                }),
                mathMul = di.protect(function (a, b) {
                    return a * b;
                });

            di.set('mathAdd', mathAdd)
              .set('mathMul', mathMul);

            assert.strictEqual(di.get('mathAdd')(5, 2), 7);
            assert.strictEqual(di.get('mathMul')(5, 2), 10);
        });
    });

    describe('#factory', function () {

        it('Call with non-function argument', function () {
            try {
                di.factory('Please factorize me');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Expected argument func type function');
            }
        });

        it('Call on protected function', function () {
            var protectedFunc = di.protect(function (a, b) {
                return a + b;
            });

            try {
                di.factory(protectedFunc); // Non-sense !
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.strictEqual(e.message, 'Cannot factory a protected function');
            }
        });

        it('Call (normal) with #set', function () {
            di.set('myId', di.factory(function (injectedDi) {
                assert.strictEqual(injectedDi, di);
                return ['something'];
            }));

            var firstCall = di.get('myId');
            var secondCall = di.get('myId');
            assert.deepEqual(firstCall, ['something']);
            assert.deepEqual(secondCall, ['something']);
            assert.notEqual(firstCall, secondCall);
        });

        it('Call (normal) queue with #set', function () {
            var factoryMyId = di.factory(function (injectedDi) {
                    assert.strictEqual(injectedDi, di);
                    return ['something'];
                }),
                factoryMyId2 = di.factory(function (injectedDi) {
                    assert.strictEqual(injectedDi, di);
                    return ['something-else'];
                });

            di.set('myId', factoryMyId)
              .set('myId2', factoryMyId2);

            var firstCallMyId = di.get('myId');
            var secondCallMyId = di.get('myId');
            assert.deepEqual(firstCallMyId, ['something']);
            assert.deepEqual(secondCallMyId, ['something']);
            assert.notEqual(firstCallMyId, secondCallMyId);

            var firstCallMyId2 = di.get('myId2');
            var secondCallMyId2 = di.get('myId2');
            assert.deepEqual(firstCallMyId2, ['something-else']);
            assert.deepEqual(secondCallMyId2, ['something-else']);
            assert.notEqual(firstCallMyId2, secondCallMyId2);
        });

    });

    it('Integration test', function () {

        di.set('userCollection', function (injectedDi) {
            return {
                find: function (id) {
                    return { name: 'Paul' };
                }
            };
        })
        .set('userService', function (injectedDi) {
            return {
                getName: function (who) {
                    return injectedDi.get('userCollection').find(who).name;
                }
            };
        });

        assert.strictEqual(di.get('userService').getName(1), 'Paul');
    });

});
