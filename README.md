#JS-monads-part5

Values that are subject to updating are contained in instances of Monad. For any Monad instance mon with id 'mon' and value val, which means m.x === val returns true, an update accomplish by m.ret(newVal) does not mutate mon.x. It does return a new monad with the same name and id as the monad that called its ret method, but with the value newVal instead of val. After the call to ret, all references to "mon" now point to the newly created monad. You can save the calling monad, for example by pushing it into an array or assigning a variable to it, if you want access to the monad that was known globally as "mon" before it called its ret method, thereby replacing itself in the global object "window". 

There is no restriction on the values that a monad can hold. It can be monads within monads, objects within arrays, anything you want. Likewise, there is no restriction on the functions that serve as arguments to the bnd method. In this demo application, the functions supplied to the bnd method do not cause mutations, and most of them return new anonymous monads with id "anonymous". If you want to provide a function's return value to the monad that calls its bnd method on the function, you can do it for most practical purposes with mon.ret(mon.bnd(function).x) or its equvalent, mon.bnd(function).bnd(mon.ret). You get a new monad named "mon", but since all references to "mon" will point to it rather than the previous still-existing-until-garbage-collected entity that was named "mon", the value of mon has been changed for most practical purposes.

This demonstration uses Motorcyclejs, which is Cycle.js only using Snabbdom instead of virtual-dom, and most instead of RxJS. 

Here is how the monad instances are constructed:

```javascript
  var Monad = function Monad(z, g) {
    var _this = this;

    this.x = z;
    if (arguments.length === 1) {
      this.id = 'anonymous';
    } else {
      this.id = g;
    };

    this.bnd = function (func, ...args) {
       return func(_this.x, ...args);
    };

    this.ret = function (a) {
      window[_this.id] = new Monad(a, _this.id);
      return window[_this.id]
    };
  };          

  class MonadIter {
    var _this = this;                  
    constructor() {

      this.p = function() {};

      this.release = function () {
        return _this.p();
      }
 
      this.bnd = function (func) {
          _this.p = func;
      }
    }
  } 
```
MonadIter instances are used in conjuction with the function named "next", which is defined as folows:

```javascript
  var next = function next(x, y, mon2) {
    if (x === y) {
      mon2.release();
    }
    return ret(x);  // An anonymous monad with the value of the calling monad.
  } 
```
Moset of the functions, along with the Monad and MonadIter instances used in this demo, are defined in an index.html script. They are, therefore, always available for experimentation in the browser console.



