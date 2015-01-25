# dijs (npm simple-dijs)

TDD devlopment with Pimple as sample.

Read the tests for documentation.

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
    
    // If you want to factory instead of return the same object :
    di.set('userCollection', di.factory(function (di) {
        return new UserCollection(di.get('database'));
    }));
    
    // So, ...
    di.get('userCollection').find(1); // UserCollection instanciated now !
    di.get('userCollection').find(1); // Other UserCollection instance now, instanciated now !
    
    // You can also use di.register() alias of di.set()
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
