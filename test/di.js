var assert = require("assert");
var Di = require('../di');

describe('Di', function() {

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

            assert.equal(di.get('myId'), 'something');
            assert.equal(di.get('myId2'), 'something-else');
        });
    });

    describe('#batchSet', function () {
        it('Call without required arguments', function () {
            try {
                di.batchSet();
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'One argument required');
            }
        });

        it('Call with non-object values', function () {
            try {
                di.batchSet('myId');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'Expected argument values to be Object');
            }
        });

        it('Call (normal)', function () {
            var returned = di.batchSet({
                'myId': 'something',
                'myId2': 'something-else'
            });

            assert.equal(returned, di);
            assert.equal(di.get('myId'), 'something');
            assert.equal(di.get('myId2'), 'something-else');
        });
    });

    describe('#set', function () {

        it('Call without required arguments', function () {
            try {
                di.set('myId');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'Two arguments required');
            }
        });

        it('Call with non-string id', function () {
            try {
                di.set({'my': 'id'}, 'something');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'Expected string id');
            }
        });

        it('Call with already set id', function () {
            di.set('myId', 'something');
            try {
                di.set('myId', 'something else');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'Identifier "myId" already defined');
            }
        });

        it('Call (normal)', function () {
            di.set('myId', 'something');
            assert.equal(di.get('myId'), 'something');
        });

    });

    it('#register alias of #set', function () {
        assert.equal(di.register, di.set);
        di.register('something', 1);
        assert.equal(di.get('something'), 1);
    });

    describe('#get', function () {

        it('Call without argument', function () {
            try {
                di.get();
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'One argument required');
            }
        });

        it('Call with non-string id', function () {
            try {
                di.get({'my': 'id'});
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'Expected string id');
            }
        });

        it('Call with unexisting id', function () {
            try {
                di.get('myId');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'Identifier "myId" is not defined');
            }
        });

        it('Call with existing id having value', function () {
            di.set('myId', 'something');
            assert.equal(di.get('myId'), 'something');
        });

        it('Call with existing id having function', function () {
            var returnDi = di.set('myId', function (injectedDi) {
                assert.equal(injectedDi, di);
                return ['something'];
            });

            var firstCall = di.get('myId');
            var secondCall = di.get('myId');
            assert.equal(firstCall, secondCall);
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
            assert.equal(di.has('myId'), true);

        });

        it('Call when has not', function () {
            assert.equal(di.has('myId'), false);
        });
    });

    describe('#factory', function () {

        it('Call without argument', function () {
            try {
                di.factory();
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'One argument required');
            }
        });

        it('Call with non-function argument', function () {
            try {
                di.factory('Please factorize me');
                assert.fail('Expected error');
            } catch (e) {
                assert(e instanceof Error);
                assert.equal(e.message, 'Expected function func');
            }
        });

        it('Call (normal) with #set', function () {
            di.set('myId', di.factory(function () {
                return ['something'];
            }));

            var firstCall = di.get('myId');
            var secondCall = di.get('myId');
            assert.deepEqual(firstCall, ['something']);
            assert.deepEqual(secondCall, ['something']);
            assert.notEqual(firstCall, secondCall);
        });

        it('Call (normal) queue with #set', function () {
            var factoryMyId = di.factory(function () {
                    return ['something'];
                }),
                factoryMyId2 = di.factory(function () {
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

        assert.equal(di.get('userService').getName(1), 'Paul');
    });

});
