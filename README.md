# simple-dijs

Please visit our website for full documentation https://avighier.github.io/simple-dijs/

##Install

You can install from NPM or directly (manual build : `npm run build`)

```bash
    npm install --save simple-dijs
```

## Integration

```javascript
    // NodeJs
    var Di = require('simple-dijs');
    // Web (just an example)
    ln -s node_modules/simple-dijs/dist/di.js public/lib/di.js
```

```html
    <!-- Available global or ADM (requirejs), thanks to Browserify -->
    <script src="lib/di.js" type="text/javascript"></script>
```    

```javascript
    // Simple instanciation
    var di = new Di();
    // Also instanciation with services
    new Di({
        'database': function () { ... },
        'userCollection': function (di) { ... }
    });
    
    di.set('database', function () {
        return new Database();
    });

    di.set('userCollection', function (di) {
        return new UserCollection(di.get('database'));
    });
    
    // Or multiple services
    di.batchSet({ ..same than construct.. });

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
    
    // You can store raw values
    di.set('port', 80);
    di.get('port'); // 80
    
    // Protect function you want to register raw :
    di.set('math.add', di.protected(function (a, b) {
        return a + b;
    }));

    // You can use promise
    
    di.set('async', function () {
        return when.promise(/*Blabla*/);
    });
    
    di.get('async').done(function () {
        // ...
    });

    // You can chain the methods calls
    (new Di()).set(...).set(...);
```

[![](https://piwik.avighier.fr/piwik.php?idsite=2&rec=1)]()