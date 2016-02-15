'use strict';

function _classCallCheck(instance, Constructor) { 
  if (!(instance instanceof Constructor)) { 
    throw new TypeError("Cannot call a class as a function"); 
  } 
}

var MonadIter = function MonadIter() {
  var _this = this;
  this.p = function () {};

  this.release = function () {
    return _this.p();
  };

  this.bnd = function (func) {
    _this.p = func;
  };
};

var Monad = function Monad(z, g) {
  var _this = this;  
  this.x = z;
  if (arguments.length === 1) {
    this.id = 'anonymous';
  } else {
    this.id = g;
  }

  this.bnd = function (func) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    return func.apply(undefined, [_this.x].concat(args));
  };

  this.ret = function (a) {
    _this.x = a;
    return _this;
  };
};

var ret = function ret(v) {
  var mon = new Monad(v, 'anonymous');
  return mon;
}

var cube = function(v) {
  return ret(v*v*v);
}

var add = function(a,b) {
  return ret(a+b);
}

var M = function M(a,b) {
  var mon = new Monad(a,b);
  return mon;
};

var Count = 0;
var mM1 = M([],'mM1');
var mM2 = M(0,'mM2');
var mM3 = M(0,'mM3');
var mM4 = M([],'mM4');
var mM5 = M(0,'mM5');
var mM6 = M(0,'mM6');
var mM7 = M(0,'mM7');
var mM8 = M(0,'mM8');
var mM9 = M(0,'mM9');
var mM10 = M(0,'mM10');
var mM11 = M([],'mM11');
var mM12 = M(0,'mM12');
var mM13 = M(0,'mM13');
var mM14 = M(0,'mM14');
var mM15 = M(0,'mM15');
var mM16 = M(0,'mM16');
var mM17 = M(0,'mM17');
var mM18 = M(0,'mM18');
var mM19 = M(0,'mM19');
var mMscbd = M([],'mMscbd');
var mMmessages = M([],'mMmessages');
var mMscoreboard = M([],'mMscoreboard');
var mMmsg = M([],'mMmsg');
var mMgoals = M(0,'mMgoals');
var mMgoals2 = M('','mMgoals2');
var mMnbrs = M([],'mMnbrs');
var mMnumbers = M([],'mMnumbers');
var mMname = M('', 'mMname');
var mMar = M([1,2,3,4,5], 'mMar');
var mMscores = M('', 'mMscores');
var mMprefix = M('', 'mMprefix');

var MI = function MI() {
  return new MonadIter();
};

var mMZ1 = MI();
var mMZ2 = MI();
var mMZ3 = MI();
var mMZ4 = MI();
var mMZ5 = MI();
var mMZ6 = MI();
var mMZ7 = MI();
var mMZ8 = MI();
var mMZ9 = MI();

var mMZ10 = MI();
var mMZ11 = MI();
var mMZ12 = MI();
var mMZ13 = MI();
var mMZ14 = MI();
var mMZ15 = MI();
var mMZ16 = MI();

var mMZ20 = MI();
var mMZ21 = MI();
var mMZ22 = MI();
var mMZ23 = MI();
var mMZ24 = MI();
var mMZ25 = MI();
var mMZ26 = MI();

var toNums = function toNums(x) {
  let y = x.map(x => parseFloat(x));
  return ret(y);
};

var calc = function calc(a,op,b) { 
  var result;
  switch (op) {
      case "add": result = (parseFloat(a) + parseFloat(b));
      break;
      case "subtract": result = (a - b);
      break;
      case "mult": result = (a * b);
      break;
      case "div": result = (a / b);
      break;
      case "concat": result = (a+""+b)*1.0;
      break;
      default : 'Major Malfunction in calc.';
  }
  return result;
};

var pause = function(x,t,mon2) {
  let time = t*1000;
  setTimeout( function() {
    mon2.release();
  },time );
  return mon2;
};

var wait = function wait(x, y, mon2) {
  if (x === y) {
    mon2.release();
  }
  return mon2;
};

var unshift = function unshift(x,v) {
  x.unshift(v);
  return ret(x);
};

var toFloat = function toFloat(x) {
  var newx = x.map(function (a) {
    return parseFloat(a);
  });
  return ret(newx);
};

var push = function push(x, j) {
  if (Array.isArray(x)) {
    return ret(x.push(j));
  }
  return ret(x);
}

var push = function push(x,v) {
  let ar = x;
  ar.push(v);
  let cleanX = ar.filter(v => (v !== "" && v !== undefined));
  return ret(cleanX);
};
var splice = function splice(x, j, k) {
  if (Array.isArray(x)) {
    return ret(x.splice(j,k));
  }
  return ret(x);
}

var clean = function clean(x) {
  return ret(x.filter(v => v !== ""));
}

var filter = function filter(x, condition) {
  if (Array.isArray(x)) {
    return ret(x.filter(v => condition))
  }
  return ret(x);
}

var map = function map(x, y) {
  if (Array.isArray(x)) {
    return ret(x.map(v => y))
  }
  return ret(x);
}

var reduce = function reduce(x, y) {
  if (Array.isArray(x) && x.length > 0) {
    return ret(x.reduce(y))
  }
  return ret(x);
}

var pop = function pop(x) {
  let v = x[x.length - 1];
  console.log('In pop. v = ',v);
  return ret(v);
}

var next = function next(x, y, mon2) {
  if (x === y) {
    mon2.release();
  }
  return ret(x);
}

var next2 = function next(x, condition, mon2) {
  if (condition) {
    mon2.release();
  }
  return ret(x);
}

var hyp = function hyp(x,y) {
  return Math.sqrt(x*x + y*y);
};

var doub = function doub(v) {
  return ret(v + v);
};

var square = function square(v) {
  return ret(v * v);
};

var mult = function mult(x, y) {
  return ret(x * y);
};

var cu = function cu(x) {
  return x * x * x;
};
var sq = function sq(x) {
  return x * x;
};
var du = function du(x) {
  return x * x;
};
var ad = function ad(a, b) {
  return a + b;
};
var id = function id(x) {
  return x;
};
var log = function log(x,message) {
  console.log(message);
  let mon = new Monad(x);
  return mon;
};

var delay = function delay(x, mon) {
  return new Promise(function (resolve, reject) {
    setTimeout(resolve, 2000);
  });
};


