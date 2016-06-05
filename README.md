# simple-dijs

TDD devlopment with Pimple as sample. [![Build Status](https://travis-ci.org/avighier/simple-dijs.svg?branch=master)](https://travis-ci.org/avighier/simple-dijs)

Read the tests for documentation. You can also read the next presentation.

```javascript
    var Di = require('simple-dijs');
    var di = new Di();
    
    di.set('database', function () {
        return new Database();
    });

    di.set('userCollection', function (di) {
        return new UserCollection(di.get('database'));
    });
    
    // So, ...
    di.get('userCollection').find(1); // UserCollection instanciated now !
    di.get('userCollection').find(1); // The same UserCollection instance

    // Also during construction and method batchSet
    new Di({
        'database': function () { ... },
        'userCollection': function (di) { ... }
    });

    di.batchSet({ ..same than construct.. });
    
    // If you want to factory instead of return the same object :
    di.set('userCollection', di.factory(function (di) {
        return new UserCollection(di.get('database'));
    }));
    
    // So, ...
    di.get('userCollection').find(1); // UserCollection instanciated now !
    di.get('userCollection').find(1); // Other UserCollection instance now, instanciated now !
    
    // You can also use di.register() alias of di.set()
    
    // You can store raw values
    di.set('port', 80);
    di.get('port'); // 80
    
    // But actually, you have to protect yourself raw functions (this will be protect() method) :
    di.set('math.add', function (a, b) {
        return a + b;
    });

    // This previous example is BAD, use instead :
    di.set('math.add', function () {
        return function (a, b) {
            return a + b;
        };
    });
    
    // If you need it, i can implement di.protect() to allow to store functions
    
    // You can use promise
    
    di.set('async', function () {
        return when.promise(/*Blabla*/);
    });
    
    di.get('async').done(function () {
        // ...
    });
```

Devlopment :
- npm test must return OK
- your code must be well tested
