# SIMPLE-DIJS

Simple Javascript Dependency Injection Container (DI) like Pimple

[![Build Status](https://travis-ci.org/avighier/simple-dijs.svg?branch=master)](https://travis-ci.org/avighier/simple-dijs)
[![npm](https://img.shields.io/github/issues-raw/avighier/simple-dijs/bug.svg?label=bugs)](https://github.com/avighier/simple-dijs/issues?q=is%3Aopen+is%3Aissue+label%3Abug)
[![npm](https://img.shields.io/npm/dm/simple-dijs.svg)](http://www.npm-stats.com/~packages/simple-dijs)

## Installation

- You can install from NPM

```bash
    npm install --save simple-dijs
```

- from github releases https://github.com/avighier/simple-dijs/releases/latest (downloads)

## Integration

```javascript
    // NodeJs
    var Di = require('simple-dijs');
    // Web (just an example)
    ln -s node_modules/simple-dijs/dist/di.js public/lib/di.js
```

```html
    <!-- Available global or ADM (requirejs), thanks to Browserify -->
    <!-- Exists di.min.js -->
    <script src="lib/di.js" type="text/javascript"></script>
```

## Examples to use

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
    
    // You can store raw values
    di.set('port', 80);
    di.get('port'); // 80
    
    // Protect function you want to register raw :
    di.set('math.add', di.protected(function (a, b) {
        return a + b;
    }));

    // You can use callbacks (node-style)

    di.set('database', function (di, callback) {
        dbConnect(url, callback);
    });

    di.get('database', function (err, database) {
        database.use('users').query(...);
    });

    // You can use promise (native or not)
    
    di.set('async', function () {
        return new Promise(/*Blabla*/);
    });
    
    di.get('async').then(function () {
        // ...
    });

    // You can chain the methods calls
    (new Di()).set(...).set(...);
```

## Quality and license

- A complete build is configured. Always green before release
- Tests are written before code (TDD) : The what before the how
- Uses the http://semver.org/ versionning
- Please **report issues** and suggestions https://github.com/avighier/simple-dijs/issues
- Please **watch** the github project if you **use** [![GitHub watchers](https://img.shields.io/github/watchers/avighier/simple-dijs.svg?style=social&label=Watch)](https://github.com/avighier/simple-dijs)
- Please **star** the github project if you **like** [![GitHub stars](https://img.shields.io/github/stars/avighier/simple-dijs.svg?style=social&label=Star)](https://github.com/avighier/simple-dijs)

## API Reference
<a name="Di"></a>

### Di
**Kind**: global class  

* [Di](#Di)
    * [new Di([values])](#new_Di_new)
    * [.batchSet(values)](#Di+batchSet) ⇒ <code>[Di](#Di)</code>
    * [.factory(func)](#Di+factory) ⇒ <code>function</code>
    * [.get(id, callback)](#Di+get(2)) ⇒ <code>undefined</code>
    * [.get(id)](#Di+get) ⇒ <code>\*</code>
    * [.has(id)](#Di+has) ⇒ <code>boolean</code>
    * [.keys()](#Di+keys) ⇒ <code>Array.&lt;string&gt;</code>
    * [.protect(func)](#Di+protect) ⇒ <code>function</code>
    * ~~[.register()](#Di+register)~~
    * [.remove(id)](#Di+remove) ⇒ <code>[Di](#Di)</code>
    * [.set(id, funcOrValue)](#Di+set) ⇒ <code>[Di](#Di)</code>


-

<a name="new_Di_new"></a>

#### new Di([values])
Create a new Container


| Param | Type | Description |
| --- | --- | --- |
| [values] | <code>Object.&lt;string, \*&gt;</code> | Values to set on construction (eqiv batchSet [batchSet](#Di+batchSet)) |

**Example**  
```js
var di = new Di()
```
**Example**  
```js
var di = new Di({  id1: value1,  id2: value2})
```

-

<a name="Di+batchSet"></a>

#### di.batchSet(values) ⇒ <code>[Di](#Di)</code>
Multiple set values

**Kind**: instance method of <code>[Di](#Di)</code>  
**Returns**: <code>[Di](#Di)</code> - himself  
**Throws**:

- <code>Error</code> If values is not provided or not Object


| Param | Type | Description |
| --- | --- | --- |
| values | <code>Object.&lt;string, \*&gt;</code> | Values to set |

**Example**  
```js
di.batchset({   id1: value1,   id2: value2})
```

-

<a name="Di+factory"></a>

#### di.factory(func) ⇒ <code>function</code>
Create a factory function

**Kind**: instance method of <code>[Di](#Di)</code>  
**Returns**: <code>function</code> - The same function  
**Throws**:

- <code>Error</code> Missing or incorrect argument
- <code>Error</code> Protected function

**See**: Di#set  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>function</code> | The function to factory |

**Example**  
```js
di.set('token', di.factory(function () {  return new Token();}))
```

-

<a name="Di+get(2)"></a>

#### di.get(id, callback) ⇒ <code>undefined</code>
Get a value asynchronously with callback (registered with callback)

**Kind**: instance method of <code>[Di](#Di)</code>  
**Throws**:

- <code>Error</code> Missing or incorrect argument
- <code>Error</code> Missing value (not registered)
- <code>Error</code> Unexpected callback for no-callback registered value
- <code>Error</code> Invalid callback


| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The value id |
| callback | <code>function</code> | The callback |

**Example**  
```js
di.get('database', function (err, database) {   if (err) {       // ...   }   database.find(userId);})
```

-

<a name="Di+get"></a>

#### di.get(id) ⇒ <code>\*</code>
Get a value synchronously

**Kind**: instance method of <code>[Di](#Di)</code>  
**Returns**: <code>\*</code> - The value  
**Throws**:

- <code>Error</code> Missing or incorrect argument
- <code>Error</code> Missing value (not registered)
- <code>Error</code> Missing callback for callback-registered value


| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The value id |

**Example**  
```js
di.get('database').find(userId)
```

-

<a name="Di+has"></a>

#### di.has(id) ⇒ <code>boolean</code>
Check that the container owns the provided id

**Kind**: instance method of <code>[Di](#Di)</code>  
**Returns**: <code>boolean</code> - If id is owned by the container  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | Id to check |

**Example**  
```js
di.has('database') || di.set('database', ...)
```

-

<a name="Di+keys"></a>

#### di.keys() ⇒ <code>Array.&lt;string&gt;</code>
Get all the ids

**Kind**: instance method of <code>[Di](#Di)</code>  
**Returns**: <code>Array.&lt;string&gt;</code> - the ids  

-

<a name="Di+protect"></a>

#### di.protect(func) ⇒ <code>function</code>
Protect a function to store as raw

**Kind**: instance method of <code>[Di](#Di)</code>  
**Returns**: <code>function</code> - The same function  
**Throws**:

- <code>Error</code> Missing or incorrect argument
- <code>Error</code> Factory function

**See**: Di#set  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>function</code> | The function to factory |

**Example**  
```js
di.set('math.add', di.protect(function (a, b) {  return a + b;}))
```

-

<a name="Di+register"></a>

#### ~~di.register()~~
***Deprecated***

**Kind**: instance method of <code>[Di](#Di)</code>  

-

<a name="Di+remove"></a>

#### di.remove(id) ⇒ <code>[Di](#Di)</code>
Remove a value

**Kind**: instance method of <code>[Di](#Di)</code>  
**Returns**: <code>[Di](#Di)</code> - himself  
**Throws**:

- <code>Error</code> Missing or incorrect argument
- <code>Error</code> Missing value (not registered)


| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The value id |

**Example**  
```js
di.remove('database')
```

-

<a name="Di+set"></a>

#### di.set(id, funcOrValue) ⇒ <code>[Di](#Di)</code>
Set a value in the container. The registered value is by default the returned value.In case you use a function to factory your value :   - you can use the first injected argument that is the current Di instance.   - you can register your value (for example for asynchronous) by declaring andcalling the second possible argument "callback", as a normal node callback.

**Kind**: instance method of <code>[Di](#Di)</code>  
**Summary**: Set a value in the container, synchronously or asynchronously  
**Returns**: <code>[Di](#Di)</code> - himself  
**Throws**:

- <code>Error</code> if missing or incorrect arguments
- <code>Error</code> if Id is already registered


| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The id of value |
| funcOrValue | <code>\*</code> | The value |

**Example** *(Set a raw value)*  
```js
di.set('color', '#ff0000')
```
**Example** *(Set a building function (value with be cached after first call))*  
```js
di.set('database', function (di) {
  return new Database(di.get('database_url'));
})
```
**Example** *(Set a factory function (value will be factoryed each call))*  
```js
di.set('token', di.factory(function () {
  return new Token();
}))
```
**Example** *(Set a building function that returns a promise)*  
```js
di.set('config', function () {
  return fsPromise.readFile('config.json');
})
```
**Example** *(Set a building function that use callback for async)*  
```js
di.set('config', function (di, callback) {
  fs.readFile('config.json', callback);
})
```

-


[![](https://piwik.avighier.fr/piwik.php?idsite=2&rec=1)]()