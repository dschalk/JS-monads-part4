(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.run = undefined;

var _mostSubject = require('most-subject');

var makeSinkProxies = function makeSinkProxies(drivers) {
  return Object.keys(drivers).reduce(function (sinkProxies, driverName) {
    sinkProxies[driverName] = (0, _mostSubject.holdSubject)();
    return sinkProxies;
  }, {});
};

var callDrivers = function callDrivers(drivers, sinkProxies) {
  return Object.keys(drivers).reduce(function (sources, driverName) {
    sources[driverName] = drivers[driverName](sinkProxies[driverName].stream, driverName);
    return sources;
  }, {});
};

var runMain = function runMain(main, sources, disposableStream) {
  var sinks = main(sources);
  return Object.keys(sinks).reduce(function (accumulator, driverName) {
    accumulator[driverName] = sinks[driverName].until(disposableStream);
    return accumulator;
  }, {});
};

var logErrorToConsole = function logErrorToConsole(err) {
  if (console && console.error) {
    console.error(err.message);
  }
};

var replicateMany = function replicateMany(sinks, sinkProxies) {
  return setTimeout(function () {
    Object.keys(sinks).filter(function (driverName) {
      return sinkProxies[driverName];
    }).forEach(function (driverName) {
      sinks[driverName].forEach(sinkProxies[driverName].sink.add).then(sinkProxies[driverName].sink.end).catch(logErrorToConsole);
    });
  }, 1);
};

var isObjectEmpty = function isObjectEmpty(object) {
  return Object.keys(object).length <= 0;
};

var run = function run(main, drivers) {
  if (typeof main !== 'function') {
    throw new Error('First argument given to run() must be the ' + '\'main\' function.');
  }
  if (typeof drivers !== 'object' || drivers === null) {
    throw new Error('Second argument given to run() must be an ' + 'object with driver functions as properties.');
  }
  if (isObjectEmpty(drivers)) {
    throw new Error('Second argument given to run() must be an ' + 'object with at least one driver function declared as a property.');
  }

  var _subject = (0, _mostSubject.subject)();

  var disposableSink = _subject.sink;
  var disposableStream = _subject.stream;

  var sinkProxies = makeSinkProxies(drivers, disposableStream);
  var sources = callDrivers(drivers, sinkProxies);
  var sinks = runMain(main, sources, disposableStream);
  replicateMany(sinks, sinkProxies);

  var dispose = function dispose() {
    disposableSink.add(1);
    Object.keys(sinkProxies).forEach(function (key) {
      return sinkProxies[key].sink.end();
    });
    disposableSink.end();
  };

  return { sinks: sinks, sources: sources, dispose: dispose };
};

exports.default = { run: run };
exports.run = run;
},{"most-subject":5}],2:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define('@most/hold', ['exports', 'most/lib/source/MulticastSource'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('most/lib/source/MulticastSource'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.MulticastSource);
        global.mostHold = mod.exports;
    }
})(this, function (exports, _MulticastSource) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });

    var _MulticastSource2 = _interopRequireDefault(_MulticastSource);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = (function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    })();

    var hold = function hold(stream) {
        return new stream.constructor(new _MulticastSource2.default(new Hold(stream.source)));
    };

    var Hold = (function () {
        function Hold(source) {
            _classCallCheck(this, Hold);

            this.source = source;
            this.time = -Infinity;
            this.value = void 0;
        }

        _createClass(Hold, [{
            key: 'run',
            value: function run(sink, scheduler) {
                if (sink._hold !== this) {
                    sink._hold = this;
                    sink._holdAdd = sink.add;
                    sink.add = holdAdd;
                    sink._holdEvent = sink.event;
                    sink.event = holdEvent;
                }

                return this.source.run(sink, scheduler);
            }
        }]);

        return Hold;
    })();

    function holdAdd(sink) {
        var len = this._holdAdd(sink);

        if (this._hold.time >= 0) {
            sink.event(this._hold.time, this._hold.value);
        }

        return len;
    }

    function holdEvent(t, x) {
        if (t >= this._hold.time) {
            this._hold.time = t;
            this._hold.value = x;
        }

        return this._holdEvent(t, x);
    }

    exports.default = hold;
});

},{"most/lib/source/MulticastSource":58}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.replay = replay;
exports.ReplaySource = ReplaySource;
var most = require('most');
var MulticastSource = require('most/lib/source/MulticastSource');
var PropagateTask = require('most/lib/scheduler/PropagateTask');
var CompoundDisposable = require('most/lib/disposable/dispose').all;
var Stream = most.Stream;

function replay(stream, maxBufferSize) {
  if (stream.source instanceof ReplaySource && source.maxBufferSize !== maxBufferSize) {
    return stream;
  }
  return new Stream(new ReplaySource(stream.source, maxBufferSize));
}

function ReplaySource(source, maxBufferSize) {
  this._buffer = [];
  this._ended = false;
  this.maxBufferSize = maxBufferSize || Infinity;
  MulticastSource.call(this, source);
}
ReplaySource.prototype = Object.create(MulticastSource.prototype);

ReplaySource.prototype._run = MulticastSource.prototype.run;
ReplaySource.prototype.run = function (sink, scheduler) {
  var buffer = this._buffer;
  var self = this;
  this.sink = sink;

  if (this._ended) {
    return replay();
  }
  if (buffer.length === 0) {
    return run();
  }
  return new CompoundDisposable([replay(), run()]);

  function replay() {
    return new BufferProducer(buffer.slice(0), sink, scheduler);
  }

  function run() {
    return self._run(sink, scheduler);
  }
};

ReplaySource.prototype._event = MulticastSource.prototype.event;
ReplaySource.prototype.event = function ReplaySource_event(t, x) {
  this._addToBuffer({ type: 0, t: t, x: x });
  this._event(t, x);
};

MulticastSource.prototype._addToBuffer = function ReplaySource_addToBuffer(event) {
  if (this._buffer.length >= this.maxBufferSize) {
    this._buffer.shift();
  }
  this._buffer.push(event);
};

MulticastSource.prototype.end = function (t, x, r) {
  MulticastSource;
  var s = this.sinks;
  if (s.length === 1) {
    s[0].end(t, x);
    return;
  }
  for (var i = 0; i < s.length; ++i) {
    if (i === s.length - 1) {
      if (r) {
        break; // don't end underlying stream
      }
    }
    s[i].end(t, x);
  };
};

ReplaySource.prototype._end = MulticastSource.prototype.end;
ReplaySource.prototype.end = function ReplaySource_end(t, x) {
  var self = this;
  this._ended = true;
  this._addToBuffer({ type: 1, t: t, x: x });
  this._end(t, x, this);
  this.add(this.sink); // add an extra sink so the last values can go through
  setTimeout(function () {
    self._end(t, x);
  }, 0); // dispose after values are propagated
};

MulticastSource.prototype.error = function (t, e, r) {
  var s = this.sinks;
  if (s.length === 1) {
    s[0].error(t, e);
    return;
  }
  for (var i = 0; i < s.length; ++i) {
    if (i === s.length - 1) {
      if (r) {
        break; // don't end underlying stream
      }
    }
    s[i].error(t, e);
  };
};

ReplaySource.prototype._error = MulticastSource.prototype.error;
ReplaySource.prototype.error = function ReplaySink_error(t, e) {
  var self = this;
  this._ended = true;
  this._buffer.push({ type: 2, t: t, x: e });
  this._error(t, e, this);
  this.add(this.sink);
  setTimeout(function () {
    self._error(t, e);
  }, 0);
};

function BufferProducer(buffer, sink, scheduler) {
  this.task = new PropagateTask(runProducer, buffer, sink);
  scheduler.asap(this.task);
}

BufferProducer.prototype.dispose = function () {
  return this.task.dispose();
};

function runProducer(t, buffer, sink) {
  var emit = function emit(item) {
    sink.event(item.t, item.x);
  };
  for (var i = 0, j = buffer.length; i < j && this.active; i++) {
    var item = buffer[i];
    switch (item.type) {
      case 0:
        emit(item);break;
      case 1:
        return this.active && sink.end(item.t, item.x);
      case 2:
        return this.active && sink.error(item.t, item.x);
    }
  }
}
},{"most":71,"most/lib/disposable/dispose":39,"most/lib/scheduler/PropagateTask":47,"most/lib/source/MulticastSource":58}],4:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Subscription = function () {
  function Subscription() {
    var _this = this;

    _classCallCheck(this, Subscription);

    this.run = function (sink, scheduler) {
      return _this._run(sink, scheduler);
    };
    this.add = this.next = function (x) {
      return _this._add(x);
    };
    this.error = function (err) {
      return _this._error(err);
    };
    this.end = this.complete = function (x) {
      return _this._end(x);
    };
  }

  _createClass(Subscription, [{
    key: "_run",
    value: function _run(sink, scheduler) {
      this.sink = sink;
      this.scheduler = scheduler;
      this.active = true;
      return this;
    }
  }, {
    key: "dispose",
    value: function dispose() {
      this.active = false;
    }
  }, {
    key: "_add",
    value: function _add(x) {
      if (!this.active) {
        return;
      }
      tryEvent(this.sink, this.scheduler, x);
    }
  }, {
    key: "_error",
    value: function _error(e) {
      this.active = false;
      this.sink.error(this.scheduler.now(), e);
    }
  }, {
    key: "_end",
    value: function _end(x) {
      if (!this.active) {
        return;
      }
      this.active = false;
      tryEnd(this.sink, this.scheduler, x);
    }
  }]);

  return Subscription;
}();

function tryEvent(sink, scheduler, event) {
  try {
    sink.event(scheduler.now(), event);
  } catch (e) {
    sink.error(scheduler.now(), e);
  }
}

function tryEnd(sink, scheduler, event) {
  try {
    sink.end(scheduler.now(), event);
  } catch (e) {
    sink.error(scheduler.now(), e);
  }
}

exports.Subscription = Subscription;
},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.holdSubject = exports.subject = undefined;

var _most = require('most');

var _MulticastSource = require('most/lib/source/MulticastSource');

var _MulticastSource2 = _interopRequireDefault(_MulticastSource);

var _Subscription = require('./Subscription');

var _ReplaySource = require('./ReplaySource');

var _hold = require('@most/hold');

var _hold2 = _interopRequireDefault(_hold);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaults = {
  replay: false,
  bufferSize: 1
};

function create(replay, bufferSize, initialValue) {
  var sink = new _Subscription.Subscription();
  var stream = undefined;

  if (!replay) {
    stream = new _most.Stream(new _MulticastSource2.default(sink));
  } else {
    stream = bufferSize === 1 ? (0, _hold2.default)(new _most.Stream(sink)) : (0, _ReplaySource.replay)(new _most.Stream(sink), bufferSize);
  }

  stream.drain();

  if (typeof initialValue !== 'undefined') {
    sink.next(initialValue);
  }

  return { sink: sink, stream: stream, observer: sink };
}

function subject(initialValue) {
  return create(false, 1, initialValue);
}

function holdSubject() {
  var bufferSize = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];
  var initialValue = arguments[1];

  return create(true, bufferSize, initialValue);
}

exports.subject = subject;
exports.holdSubject = holdSubject;
},{"./ReplaySource":3,"./Subscription":4,"@most/hold":2,"most":71,"most/lib/source/MulticastSource":58}],6:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = LinkedList;

/**
 * Doubly linked list
 * @constructor
 */
function LinkedList() {
	this.head = null;
	this.length = 0;
}

/**
 * Add a node to the end of the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to add
 */
LinkedList.prototype.add = function(x) {
	if(this.head !== null) {
		this.head.prev = x;
		x.next = this.head;
	}
	this.head = x;
	++this.length;
};

/**
 * Remove the provided node from the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to remove
 */
LinkedList.prototype.remove = function(x) {
	--this.length;
	if(x === this.head) {
		this.head = this.head.next;
	}
	if(x.next !== null) {
		x.next.prev = x.prev;
		x.next = null;
	}
	if(x.prev !== null) {
		x.prev.next = x.next;
		x.prev = null;
	}
};

/**
 * @returns {boolean} true iff there are no nodes in the list
 */
LinkedList.prototype.isEmpty = function() {
	return this.length === 0;
};

/**
 * Dispose all nodes
 * @returns {Promise} promise that fulfills when all nodes have been disposed,
 *  or rejects if an error occurs while disposing
 */
LinkedList.prototype.dispose = function() {
	if(this.isEmpty()) {
		return Promise.resolve();
	}

	var promises = [];
	var x = this.head;
	this.head = null;
	this.length = 0;

	while(x !== null) {
		promises.push(x.dispose());
		x = x.next;
	}

	return Promise.all(promises);
};

},{}],7:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.isPromise = isPromise;

function isPromise(p) {
	return p !== null && typeof p === 'object' && typeof p.then === 'function';
}

},{}],8:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

// Based on https://github.com/petkaantonov/deque

module.exports = Queue;

function Queue(capPow2) {
	this._capacity = capPow2||32;
	this._length = 0;
	this._head = 0;
}

Queue.prototype.push = function (x) {
	var len = this._length;
	this._checkCapacity(len + 1);

	var i = (this._head + len) & (this._capacity - 1);
	this[i] = x;
	this._length = len + 1;
};

Queue.prototype.shift = function () {
	var head = this._head;
	var x = this[head];

	this[head] = void 0;
	this._head = (head + 1) & (this._capacity - 1);
	this._length--;
	return x;
};

Queue.prototype.isEmpty = function() {
	return this._length === 0;
};

Queue.prototype.length = function () {
	return this._length;
};

Queue.prototype._checkCapacity = function (size) {
	if (this._capacity < size) {
		this._ensureCapacity(this._capacity << 1);
	}
};

Queue.prototype._ensureCapacity = function (capacity) {
	var oldCapacity = this._capacity;
	this._capacity = capacity;

	var last = this._head + this._length;

	if (last > oldCapacity) {
		copy(this, 0, this, oldCapacity, last & (oldCapacity - 1));
	}
};

function copy(src, srcIndex, dst, dstIndex, len) {
	for (var j = 0; j < len; ++j) {
		dst[j + dstIndex] = src[j + srcIndex];
		src[j + srcIndex] = void 0;
	}
}


},{}],9:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = Stream;

function Stream(source) {
	this.source = source;
}

},{}],10:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.noop = noop;
exports.identity = identity;
exports.compose = compose;
exports.apply = apply;

exports.cons = cons;
exports.append = append;
exports.drop = drop;
exports.tail = tail;
exports.copy = copy;
exports.map = map;
exports.reduce = reduce;
exports.replace = replace;
exports.remove = remove;
exports.removeAll = removeAll;
exports.findIndex = findIndex;
exports.isArrayLike = isArrayLike;

function noop() {}

function identity(x) {
	return x;
}

function compose(f, g) {
	return function(x) {
		return f(g(x));
	};
}

function apply(f, x) {
	return f(x);
}

function cons(x, array) {
	var l = array.length;
	var a = new Array(l + 1);
	a[0] = x;
	for(var i=0; i<l; ++i) {
		a[i + 1] = array[i];
	}
	return a;
}

function append(x, a) {
	var l = a.length;
	var b = new Array(l+1);
	for(var i=0; i<l; ++i) {
		b[i] = a[i];
	}

	b[l] = x;
	return b;
}

function drop(n, array) {
	var l = array.length;
	if(n >= l) {
		return [];
	}

	l -= n;
	var a = new Array(l);
	for(var i=0; i<l; ++i) {
		a[i] = array[n+i];
	}
	return a;
}

function tail(array) {
	return drop(1, array);
}

function copy(array) {
	var l = array.length;
	var a = new Array(l);
	for(var i=0; i<l; ++i) {
		a[i] = array[i];
	}
	return a;
}

function map(f, array) {
	var l = array.length;
	var a = new Array(l);
	for(var i=0; i<l; ++i) {
		a[i] = f(array[i]);
	}
	return a;
}

function reduce(f, z, array) {
	var r = z;
	for(var i=0, l=array.length; i<l; ++i) {
		r = f(r, array[i], i);
	}
	return r;
}

function replace(x, i, array) {
	var l = array.length;
	var a = new Array(l);
	for(var j=0; j<l; ++j) {
		a[j] = i === j ? x : array[j];
	}
	return a;
}

function remove(index, array) {
	var l = array.length;
	if(l === 0 || index >= array) { // exit early if index beyond end of array
		return array;
	}

	if(l === 1) { // exit early if index in bounds and length === 1
		return [];
	}

	return unsafeRemove(index, array, l-1);
}

function unsafeRemove(index, a, l) {
	var b = new Array(l);
	var i;
	for(i=0; i<index; ++i) {
		b[i] = a[i];
	}
	for(i=index; i<l; ++i) {
		b[i] = a[i+1];
	}

	return b;
}

function removeAll(f, a) {
	var l = a.length;
	var b = new Array(l);
	for(var x, i=0, j=0; i<l; ++i) {
		x = a[i];
		if(!f(x)) {
			b[j] = x;
			++j;
		}
	}

	b.length = j;
	return b;
}

function findIndex(x, a) {
	for (var i = 0, l = a.length; i < l; ++i) {
		if (x === a[i]) {
			return i;
		}
	}
	return -1;
}

function isArrayLike(x){
   return x != null && typeof x.length === 'number' && typeof x !== 'function';
}

},{}],11:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');
var runSource = require('../runSource');
var cons = require('./build').cons;
var noop = require('../base').noop;

exports.scan = scan;
exports.reduce = reduce;

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @param {Stream} stream stream to scan
 * @returns {Stream} new stream containing successive reduce results
 */
function scan(f, initial, stream) {
	return cons(initial, new Stream(new Accumulate(ScanSink, f, initial, stream.source)));
}

function ScanSink(f, z, sink) {
	this.f = f;
	this.value = z;
	this.sink = sink;
}

ScanSink.prototype.event = function(t, x) {
	var f = this.f;
	this.value = f(this.value, x);
	this.sink.event(t, this.value);
};

ScanSink.prototype.error = Pipe.prototype.error;
ScanSink.prototype.end = Pipe.prototype.end;

/**
 * Reduce a stream to produce a single result.  Note that reducing an infinite
 * stream will return a Promise that never fulfills, but that may reject if an error
 * occurs.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @param {Stream} stream to reduce
 * @returns {Promise} promise for the file result of the reduce
 */
function reduce(f, initial, stream) {
	return runSource.withDefaultScheduler(noop, new Accumulate(AccumulateSink, f, initial, stream.source));
}

function Accumulate(SinkType, f, z, source) {
	this.SinkType = SinkType;
	this.f = f;
	this.value = z;
	this.source = source;
}

Accumulate.prototype.run = function(sink, scheduler) {
	return this.source.run(new this.SinkType(this.f, this.value, sink), scheduler);
};

function AccumulateSink(f, z, sink) {
	this.f = f;
	this.value = z;
	this.sink = sink;
}

AccumulateSink.prototype.event = function(t, x) {
	var f = this.f;
	this.value = f(this.value, x);
	this.sink.event(t, this.value);
};

AccumulateSink.prototype.error = Pipe.prototype.error;

AccumulateSink.prototype.end = function(t) {
	this.sink.end(t, this.value);
};

},{"../Stream":9,"../base":10,"../runSource":46,"../sink/Pipe":55,"./build":13}],12:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var combine = require('./combine').combine;
var apply = require('../base').apply;

exports.ap  = ap;

/**
 * Assume fs is a stream containing functions, and apply the latest function
 * in fs to the latest value in xs.
 * fs:         --f---------g--------h------>
 * xs:         -a-------b-------c-------d-->
 * ap(fs, xs): --fa-----fb-gb---gc--hc--hd->
 * @param {Stream} fs stream of functions to apply to the latest x
 * @param {Stream} xs stream of values to which to apply all the latest f
 * @returns {Stream} stream containing all the applications of fs to xs
 */
function ap(fs, xs) {
	return combine(apply, fs, xs);
}

},{"../base":10,"./combine":14}],13:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var streamOf = require('../source/core').of;
var continueWith = require('./continueWith').continueWith;

exports.concat = concat;
exports.cycle = cycle;
exports.cons = cons;

/**
 * @param {*} x value to prepend
 * @param {Stream} stream
 * @returns {Stream} new stream with x prepended
 */
function cons(x, stream) {
	return concat(streamOf(x), stream);
}

/**
 * @param {Stream} left
 * @param {Stream} right
 * @returns {Stream} new stream containing all events in left followed by all
 *  events in right.  This *timeshifts* right to the end of left.
 */
function concat(left, right) {
	return continueWith(function() {
		return right;
	}, left);
}

/**
 * Tie stream into a circle, creating an infinite stream
 * @param {Stream} stream
 * @returns {Stream} new infinite stream
 */
function cycle(stream) {
	return continueWith(function cycleNext() {
		return cycle(stream);
	}, stream);
}

},{"../source/core":60,"./continueWith":16}],14:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var transform = require('./transform');
var core = require('../source/core');
var Pipe = require('../sink/Pipe');
var IndexSink = require('../sink/IndexSink');
var mergeSources = require('./merge').mergeSources;
var dispose = require('../disposable/dispose');
var base = require('../base');
var invoke = require('../invoke');

var hasValue = IndexSink.hasValue;

//var map = base.map;
var tail = base.tail;

exports.combineArray = combineArray;
exports.combine = combine;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
function combine(f /*, ...streams */) {
	return combineArray(f, tail(arguments));
}

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @param {[Stream]} streams most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
function combineArray(f, streams) {
	var l = streams.length;
	return l === 0 ? core.empty()
		 : l === 1 ? transform.map(f, streams[0])
		 : new Stream(mergeSources(CombineSink, f, streams));
}

function CombineSink(disposables, sinks, sink, f) {
	this.sink = sink;
	this.disposables = disposables;
	this.sinks = sinks;
	this.f = f;
	this.values = new Array(sinks.length);
	this.ready = false;
	this.activeCount = sinks.length;
}

CombineSink.prototype.error = Pipe.prototype.error;

CombineSink.prototype.event = function(t, indexedValue) {
	if(!this.ready) {
		this.ready = this.sinks.every(hasValue);
	}

	this.values[indexedValue.index] = indexedValue.value;
	if(this.ready) {
		this.sink.event(t, invoke(this.f, this.values));
	}
};

CombineSink.prototype.end = function(t, indexedValue) {
	dispose.tryDispose(t, this.disposables[indexedValue.index], this.sink);
	if(--this.activeCount === 0) {
		this.sink.end(t, indexedValue.value);
	}
};

},{"../Stream":9,"../base":10,"../disposable/dispose":39,"../invoke":44,"../sink/IndexSink":53,"../sink/Pipe":55,"../source/core":60,"./merge":23,"./transform":34}],15:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var mergeConcurrently = require('./mergeConcurrently').mergeConcurrently;
var map = require('./transform').map;

exports.concatMap = concatMap;

/**
 * Map each value in stream to a new stream, and concatenate them all
 * stream:              -a---b---cX
 * f(a):                 1-1-1-1X
 * f(b):                        -2-2-2-2X
 * f(c):                                -3-3-3-3X
 * stream.concatMap(f): -1-1-1-1-2-2-2-2-3-3-3-3X
 * @param {function(x:*):Stream} f function to map each value to a stream
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function concatMap(f, stream) {
	return mergeConcurrently(1, map(f, stream));
}

},{"./mergeConcurrently":24,"./transform":34}],16:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var dispose = require('../disposable/dispose');
var isPromise = require('../Promise').isPromise;

exports.continueWith = continueWith;

function continueWith(f, stream) {
	return new Stream(new ContinueWith(f, stream.source));
}

function ContinueWith(f, source) {
	this.f = f;
	this.source = source;
}

ContinueWith.prototype.run = function(sink, scheduler) {
	return new ContinueWithSink(this.f, this.source, sink, scheduler);
};

function ContinueWithSink(f, source, sink, scheduler) {
	this.f = f;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;
	this.disposable = dispose.once(source.run(this, scheduler));
}

ContinueWithSink.prototype.error = Sink.prototype.error;

ContinueWithSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}
	this.sink.event(t, x);
};

ContinueWithSink.prototype.end = function(t, x) {
	if(!this.active) {
		return;
	}

	var result = dispose.tryDispose(t, this.disposable, this.sink);
	this.disposable = isPromise(result)
		? dispose.promised(this._thenContinue(result, x))
		: this._continue(this.f, x);
};

ContinueWithSink.prototype._thenContinue = function(p, x) {
	var self = this;
	return p.then(function () {
		return self._continue(self.f, x);
	});
};

ContinueWithSink.prototype._continue = function(f, x) {
	return f(x).source.run(this.sink, this.scheduler);
};

ContinueWithSink.prototype.dispose = function() {
	this.active = false;
	return this.disposable.dispose();
};

},{"../Promise":7,"../Stream":9,"../disposable/dispose":39,"../sink/Pipe":55}],17:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var dispose = require('../disposable/dispose');
var PropagateTask = require('../scheduler/PropagateTask');

exports.delay = delay;

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @param {Stream} stream
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
function delay(delayTime, stream) {
	return delayTime <= 0 ? stream
		 : new Stream(new Delay(delayTime, stream.source));
}

function Delay(dt, source) {
	this.dt = dt;
	this.source = source;
}

Delay.prototype.run = function(sink, scheduler) {
	var delaySink = new DelaySink(this.dt, sink, scheduler);
	return dispose.all([delaySink, this.source.run(delaySink, scheduler)]);
};

function DelaySink(dt, sink, scheduler) {
	this.dt = dt;
	this.sink = sink;
	this.scheduler = scheduler;
}

DelaySink.prototype.dispose = function() {
	var self = this;
	this.scheduler.cancelAll(function(task) {
		return task.sink === self.sink;
	});
};

DelaySink.prototype.event = function(t, x) {
	this.scheduler.delay(this.dt, PropagateTask.event(x, this.sink));
};

DelaySink.prototype.end = function(t, x) {
	this.scheduler.delay(this.dt, PropagateTask.end(x, this.sink));
};

DelaySink.prototype.error = Sink.prototype.error;

},{"../Stream":9,"../disposable/dispose":39,"../scheduler/PropagateTask":47,"../sink/Pipe":55}],18:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var ValueSource = require('../source/ValueSource');
var tryDispose = require('../disposable/dispose').tryDispose;
var tryEvent = require('../source/tryEvent');
var apply = require('../base').apply;

exports.flatMapError = recoverWith;
exports.recoverWith  = recoverWith;
exports.throwError   = throwError;

/**
 * If stream encounters an error, recover and continue with items from stream
 * returned by f.
 * @param {function(error:*):Stream} f function which returns a new stream
 * @param {Stream} stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */
function recoverWith(f, stream) {
	return new Stream(new RecoverWith(f, stream.source));
}

/**
 * Create a stream containing only an error
 * @param {*} e error value, preferably an Error or Error subtype
 * @returns {Stream} new stream containing only an error
 */
function throwError(e) {
	return new Stream(new ValueSource(error, e));
}

function error(t, e, sink) {
	sink.error(t, e);
}

function RecoverWith(f, source) {
	this.f = f;
	this.source = source;
}

RecoverWith.prototype.run = function(sink, scheduler) {
	return new RecoverWithSink(this.f, this.source, sink, scheduler);
};

function RecoverWithSink(f, source, sink, scheduler) {
	this.f = f;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;
	this.disposable = source.run(this, scheduler);
}

RecoverWithSink.prototype.error = function(t, e) {
	if(!this.active) {
		return;
	}

	// TODO: forward dispose errors
	tryDispose(t, this.disposable, this);

	var stream = apply(this.f, e);
	this.disposable = stream.source.run(this.sink, this.scheduler);
};

RecoverWithSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}
	tryEvent.tryEvent(t, x, this.sink);
};

RecoverWithSink.prototype.end = function(t, x) {
	if(!this.active) {
		return;
	}
	tryEvent.tryEnd(t, x, this.sink);
};

RecoverWithSink.prototype.dispose = function() {
	this.active = false;
	return this.disposable.dispose();
};

},{"../Stream":9,"../base":10,"../disposable/dispose":39,"../source/ValueSource":59,"../source/tryEvent":69}],19:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var Filter = require('../fusion/Filter');

exports.filter = filter;
exports.skipRepeats = skipRepeats;
exports.skipRepeatsWith = skipRepeatsWith;

/**
 * Retain only items matching a predicate
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @param {Stream} stream stream to filter
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
function filter(p, stream) {
	return new Stream(Filter.create(p, stream.source));
}

/**
 * Skip repeated events, using === to detect duplicates
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeats(stream) {
	return skipRepeatsWith(same, stream);
}

/**
 * Skip repeated events using the provided equals function to detect duplicates
 * @param {function(a:*, b:*):boolean} equals optional function to compare items
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeatsWith(equals, stream) {
	return new Stream(new SkipRepeats(equals, stream.source));
}

function SkipRepeats(equals, source) {
	this.equals = equals;
	this.source = source;
}

SkipRepeats.prototype.run = function(sink, scheduler) {
	return this.source.run(new SkipRepeatsSink(this.equals, sink), scheduler);
};

function SkipRepeatsSink(equals, sink) {
	this.equals = equals;
	this.sink = sink;
	this.value = void 0;
	this.init = true;
}

SkipRepeatsSink.prototype.end   = Sink.prototype.end;
SkipRepeatsSink.prototype.error = Sink.prototype.error;

SkipRepeatsSink.prototype.event = function(t, x) {
	if(this.init) {
		this.init = false;
		this.value = x;
		this.sink.event(t, x);
	} else if(!this.equals(this.value, x)) {
		this.value = x;
		this.sink.event(t, x);
	}
};

function same(a, b) {
	return a === b;
}

},{"../Stream":9,"../fusion/Filter":41,"../sink/Pipe":55}],20:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var mergeConcurrently = require('./mergeConcurrently').mergeConcurrently;
var map = require('./transform').map;

exports.flatMap = flatMap;
exports.join = join;

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function flatMap(f, stream) {
	return join(map(f, stream));
}

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @param {Stream<Stream<X>>} stream stream of streams
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
function join(stream) {
	return mergeConcurrently(Infinity, stream);
}

},{"./mergeConcurrently":24,"./transform":34}],21:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var dispose = require('../disposable/dispose');
var PropagateTask = require('../scheduler/PropagateTask');

exports.throttle = throttle;
exports.debounce = debounce;

/**
 * Limit the rate of events by suppressing events that occur too often
 * @param {Number} period time to suppress events
 * @param {Stream} stream
 * @returns {Stream}
 */
function throttle(period, stream) {
	return new Stream(new Throttle(period, stream.source));
}

function Throttle(period, source) {
	this.dt = period;
	this.source = source;
}

Throttle.prototype.run = function(sink, scheduler) {
	return this.source.run(new ThrottleSink(this.dt, sink), scheduler);
};

function ThrottleSink(dt, sink) {
	this.time = 0;
	this.dt = dt;
	this.sink = sink;
}

ThrottleSink.prototype.event = function(t, x) {
	if(t >= this.time) {
		this.time = t + this.dt;
		this.sink.event(t, x);
	}
};

ThrottleSink.prototype.end   = Sink.prototype.end;

ThrottleSink.prototype.error = Sink.prototype.error;

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * @param {Number} period events occuring more frequently than this
 *  will be suppressed
 * @param {Stream} stream stream to debounce
 * @returns {Stream} new debounced stream
 */
function debounce(period, stream) {
	return new Stream(new Debounce(period, stream.source));
}

function Debounce(dt, source) {
	this.dt = dt;
	this.source = source;
}

Debounce.prototype.run = function(sink, scheduler) {
	return new DebounceSink(this.dt, this.source, sink, scheduler);
};

function DebounceSink(dt, source, sink, scheduler) {
	this.dt = dt;
	this.sink = sink;
	this.scheduler = scheduler;
	this.value = void 0;
	this.timer = null;

	var sourceDisposable = source.run(this, scheduler);
	this.disposable = dispose.all([this, sourceDisposable]);
}

DebounceSink.prototype.event = function(t, x) {
	this._clearTimer();
	this.value = x;
	this.timer = this.scheduler.delay(this.dt, PropagateTask.event(x, this.sink));
};

DebounceSink.prototype.end = function(t, x) {
	if(this._clearTimer()) {
		this.sink.event(t, this.value);
		this.value = void 0;
	}
	this.sink.end(t, x);
};

DebounceSink.prototype.error = function(t, x) {
	this._clearTimer();
	this.sink.error(t, x);
};

DebounceSink.prototype.dispose = function() {
	this._clearTimer();
};

DebounceSink.prototype._clearTimer = function() {
	if(this.timer === null) {
		return false;
	}
	this.timer.cancel();
	this.timer = null;
	return true;
};

},{"../Stream":9,"../disposable/dispose":39,"../scheduler/PropagateTask":47,"../sink/Pipe":55}],22:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');

exports.loop = loop;

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @param {Stream} stream event stream
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */
function loop(stepper, seed, stream) {
	return new Stream(new Loop(stepper, seed, stream.source));
}

function Loop(stepper, seed, source) {
	this.step = stepper;
	this.seed = seed;
	this.source = source;
}

Loop.prototype.run = function(sink, scheduler) {
	return this.source.run(new LoopSink(this.step, this.seed, sink), scheduler);
};

function LoopSink(stepper, seed, sink) {
	this.step = stepper;
	this.seed = seed;
	this.sink = sink;
}

LoopSink.prototype.error = Pipe.prototype.error;

LoopSink.prototype.event = function(t, x) {
	var result = this.step(this.seed, x);
	this.seed = result.seed;
	this.sink.event(t, result.value);
};

LoopSink.prototype.end = function(t) {
	this.sink.end(t, this.seed);
};

},{"../Stream":9,"../sink/Pipe":55}],23:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');
var IndexSink = require('../sink/IndexSink');
var empty = require('../source/core').empty;
var dispose = require('../disposable/dispose');
var base = require('../base');

var copy = base.copy;
var map = base.map;

exports.merge = merge;
exports.mergeArray = mergeArray;
exports.mergeSources = mergeSources;

/**
 * @returns {Stream} stream containing events from all streams in the argument
 * list in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
function merge(/*...streams*/) {
	return mergeArray(copy(arguments));
}

/**
 * @param {Array} streams array of stream to merge
 * @returns {Stream} stream containing events from all input observables
 * in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
function mergeArray(streams) {
    var l = streams.length;
    return l === 0 ? empty()
		 : l === 1 ? streams[0]
		 : new Stream(mergeSources(MergeSink, void 0, streams));
}

function mergeSources(Sink, arg, streams) {
	return new Merge(Sink, arg, map(getSource, streams))
}

function getSource(stream) {
	return stream.source;
}

function Merge(Sink, arg, sources) {
	this.Sink = Sink;
	this.arg = arg;
	this.sources = sources;
}

Merge.prototype.run = function(sink, scheduler) {
	var l = this.sources.length;
	var disposables = new Array(l);
	var sinks = new Array(l);

	var mergeSink = new this.Sink(disposables, sinks, sink, this.arg);

	for(var indexSink, i=0; i<l; ++i) {
		indexSink = sinks[i] = new IndexSink(i, mergeSink);
		disposables[i] = this.sources[i].run(indexSink, scheduler);
	}

	return dispose.all(disposables);
};

function MergeSink(disposables, sinks, sink) {
	this.sink = sink;
	this.disposables = disposables;
	this.activeCount = sinks.length;
}

MergeSink.prototype.error = Pipe.prototype.error;

MergeSink.prototype.event = function(t, indexValue) {
	this.sink.event(t, indexValue.value);
};

MergeSink.prototype.end = function(t, indexedValue) {
	dispose.tryDispose(t, this.disposables[indexedValue.index], this.sink);
	if(--this.activeCount === 0) {
		this.sink.end(t, indexedValue.value);
	}
};

},{"../Stream":9,"../base":10,"../disposable/dispose":39,"../sink/IndexSink":53,"../sink/Pipe":55,"../source/core":60}],24:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var dispose = require('../disposable/dispose');
var LinkedList = require('../LinkedList');

exports.mergeConcurrently = mergeConcurrently;

function mergeConcurrently(concurrency, stream) {
	return new Stream(new MergeConcurrently(concurrency, stream.source));
}

function MergeConcurrently(concurrency, source) {
	this.concurrency = concurrency;
	this.source = source;
}

MergeConcurrently.prototype.run = function(sink, scheduler) {
	return new Outer(this.concurrency, this.source, sink, scheduler);
};

function Outer(concurrency, source, sink, scheduler) {
	this.concurrency = concurrency;
	this.sink = sink;
	this.scheduler = scheduler;
	this.pending = [];
	this.current = new LinkedList();
	this.disposable = dispose.once(source.run(this, scheduler));
	this.active = true;
}

Outer.prototype.event = function(t, x) {
	this._addInner(t, x);
};

Outer.prototype._addInner = function(t, stream) {
	if(this.current.length < this.concurrency) {
		this._startInner(t, stream);
	} else {
		this.pending.push(stream);
	}
};

Outer.prototype._startInner = function(t, stream) {
	var innerSink = new Inner(t, this, this.sink);
	this.current.add(innerSink);
	innerSink.disposable = stream.source.run(innerSink, this.scheduler);
};

Outer.prototype.end = function(t, x) {
	this.active = false;
	this.disposable.dispose();
	this._checkEnd(t, x);
};

Outer.prototype.error = function(t, e) {
	this.active = false;
	this.sink.error(t, e);
};

Outer.prototype.dispose = function() {
	this.active = false;
	this.pending.length = 0;
	return Promise.all([this.disposable.dispose(), this.current.dispose()]);
};

Outer.prototype._endInner = function(t, x, inner) {
	this.current.remove(inner);
	dispose.tryDispose(t, inner, this);

	if(this.pending.length === 0) {
		this._checkEnd(t, x);
	} else {
		this._startInner(t, this.pending.shift());
	}
};

Outer.prototype._checkEnd = function(t, x) {
	if(!this.active && this.current.isEmpty()) {
		this.sink.end(t, x);
	}
};

function Inner(time, outer, sink) {
	this.prev = this.next = null;
	this.time = time;
	this.outer = outer;
	this.sink = sink;
	this.disposable = void 0;
}

Inner.prototype.event = function(t, x) {
	this.sink.event(Math.max(t, this.time), x);
};

Inner.prototype.end = function(t, x) {
	this.outer._endInner(Math.max(t, this.time), x, this);
};

Inner.prototype.error = function(t, e) {
	this.outer.error(Math.max(t, this.time), e);
};

Inner.prototype.dispose = function() {
	return this.disposable.dispose();
};

},{"../LinkedList":6,"../Stream":9,"../disposable/dispose":39}],25:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
/** @contributor Maciej Ligenza */

var Stream = require('../Stream');
var MulticastSource = require('../source/MulticastSource');

exports.multicast = multicast;

/**
 * Transform the stream into a multicast stream, allowing it to be shared
 * more efficiently by many observers, without causing multiple invocation
 * of internal machinery.  Multicast is idempotent:
 * stream.multicast() === stream.multicast().multicast()
 * @param {Stream} stream to ensure is multicast.
 * @returns {Stream} new stream which will multicast events to all observers.
 */
function multicast(stream) {
	var source = stream.source;
	return source instanceof MulticastSource ? stream
		: new Stream(new MulticastSource(source));
}

},{"../Stream":9,"../source/MulticastSource":58}],26:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var runSource = require('../runSource');
var noop = require('../base').noop;

exports.observe = observe;
exports.drain = drain;

/**
 * Observe all the event values in the stream in time order. The
 * provided function `f` will be called for each event value
 * @param {function(x:T):*} f function to call with each event value
 * @param {Stream<T>} stream stream to observe
 * @return {Promise} promise that fulfills after the stream ends without
 *  an error, or rejects if the stream ends with an error.
 */
function observe(f, stream) {
	return runSource.withDefaultScheduler(f, stream.source);
}

/**
 * "Run" a stream by
 * @param stream
 * @return {*}
 */
function drain(stream) {
	return runSource.withDefaultScheduler(noop, stream.source);
}

},{"../base":10,"../runSource":46}],27:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var fatal = require('../fatalError');

exports.fromPromise = fromPromise;
exports.awaitPromises = awaitPromises;

/**
 * Create a stream containing only the promise's fulfillment
 * value at the time it fulfills.
 * @param {Promise<T>} p promise
 * @return {Stream<T>} stream containing promise's fulfillment value.
 *  If the promise rejects, the stream will error
 */
function fromPromise(p) {
	return new Stream(new PromiseSource(p));
}

function PromiseSource(p) {
	this.promise = p;
}

PromiseSource.prototype.run = function(sink, scheduler) {
	return new PromiseProducer(this.promise, sink, scheduler);
};

function PromiseProducer(p, sink, scheduler) {
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var self = this;
	Promise.resolve(p).then(function(x) {
		self._emit(self.scheduler.now(), x);
	}).catch(function(e) {
		self._error(self.scheduler.now(), e);
	});
}

PromiseProducer.prototype._emit = function(t, x) {
	if(!this.active) {
		return;
	}

	this.sink.event(t, x);
	this.sink.end(t, void 0);
};

PromiseProducer.prototype._error = function(t, e) {
	if(!this.active) {
		return;
	}

	this.sink.error(t, e);
};

PromiseProducer.prototype.dispose = function() {
	this.active = false;
};

/**
 * Turn a Stream<Promise<T>> into Stream<T> by awaiting each promise.
 * Event order is preserved.
 * @param {Stream<Promise<T>>} stream
 * @return {Stream<T>} stream of fulfillment values.  The stream will
 * error if any promise rejects.
 */
function awaitPromises(stream) {
	return new Stream(new Await(stream.source));
}

function Await(source) {
	this.source = source;
}

Await.prototype.run = function(sink, scheduler) {
	return this.source.run(new AwaitSink(sink, scheduler), scheduler);
};

function AwaitSink(sink, scheduler) {
	this.sink = sink;
	this.scheduler = scheduler;
	this.queue = Promise.resolve();
	var self = this;

	// Pre-create closures, to avoid creating them per event
	this._eventBound = function(x) {
		self.sink.event(self.scheduler.now(), x);
	};

	this._endBound = function(x) {
		self.sink.end(self.scheduler.now(), x);
	};

	this._errorBound = function(e) {
		self.sink.error(self.scheduler.now(), e);
	};
}

AwaitSink.prototype.event = function(t, promise) {
	var self = this;
	this.queue = this.queue.then(function() {
		return self._event(promise);
	}).catch(this._errorBound);
};

AwaitSink.prototype.end = function(t, x) {
	var self = this;
	this.queue = this.queue.then(function() {
		return self._end(x);
	}).catch(this._errorBound);
};

AwaitSink.prototype.error = function(t, e) {
	var self = this;
	// Don't resolve error values, propagate directly
	this.queue = this.queue.then(function() {
		return self._errorBound(e);
	}).catch(fatal);
};

AwaitSink.prototype._event = function(promise) {
	return promise.then(this._eventBound);
};

AwaitSink.prototype._end = function(x) {
	return Promise.resolve(x).then(this._endBound);
};

},{"../Stream":9,"../fatalError":40}],28:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');
var dispose = require('../disposable/dispose');
var base = require('../base');
var invoke = require('../invoke');

exports.sample = sample;
exports.sampleWith = sampleWith;
exports.sampleArray = sampleArray;

/**
 * When an event arrives on sampler, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @param {Stream} sampler streams will be sampled whenever an event arrives
 *  on sampler
 * @returns {Stream} stream of sampled and transformed values
 */
function sample(f, sampler /*, ...streams */) {
	return sampleArray(f, sampler, base.drop(2, arguments));
}

/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  stream's latest value will be propagated
 * @param {Stream} stream stream of values
 * @returns {Stream} sampled stream of values
 */
function sampleWith(sampler, stream) {
	return new Stream(new Sampler(base.identity, sampler.source, [stream.source]));
}

function sampleArray(f, sampler, streams) {
	return new Stream(new Sampler(f, sampler.source, base.map(getSource, streams)));
}

function getSource(stream) {
	return stream.source;
}

function Sampler(f, sampler, sources) {
	this.f = f;
	this.sampler = sampler;
	this.sources = sources;
}

Sampler.prototype.run = function(sink, scheduler) {
	var l = this.sources.length;
	var disposables = new Array(l+1);
	var sinks = new Array(l);

	var sampleSink = new SampleSink(this.f, sinks, sink);

	for(var hold, i=0; i<l; ++i) {
		hold = sinks[i] = new Hold(sampleSink);
		disposables[i] = this.sources[i].run(hold, scheduler);
	}

	disposables[i] = this.sampler.run(sampleSink, scheduler);

	return dispose.all(disposables);
};

function Hold(sink) {
	this.sink = sink;
	this.hasValue = false;
}

Hold.prototype.event = function(t, x) {
	this.value = x;
	this.hasValue = true;
	this.sink._notify(this);
};

Hold.prototype.end = base.noop;
Hold.prototype.error = Pipe.prototype.error;

function SampleSink(f, sinks, sink) {
	this.f = f;
	this.sinks = sinks;
	this.sink = sink;
	this.active = false;
}

SampleSink.prototype._notify = function() {
	if(!this.active) {
		this.active = this.sinks.every(hasValue);
	}
};

SampleSink.prototype.event = function(t) {
	if(this.active) {
		this.sink.event(t, invoke(this.f, base.map(getValue, this.sinks)));
	}
};

SampleSink.prototype.end = Pipe.prototype.end;
SampleSink.prototype.error = Pipe.prototype.error;

function hasValue(hold) {
	return hold.hasValue;
}

function getValue(hold) {
	return hold.value;
}

},{"../Stream":9,"../base":10,"../disposable/dispose":39,"../invoke":44,"../sink/Pipe":55}],29:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');
var core = require('../source/core');
var dispose = require('../disposable/dispose');

exports.take = take;
exports.skip = skip;
exports.slice = slice;
exports.takeWhile = takeWhile;
exports.skipWhile = skipWhile;

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream containing only up to the first n items from stream
 */
function take(n, stream) {
	return slice(0, n, stream);
}

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream with the first n items removed
 */
function skip(n, stream) {
	return slice(n, Infinity, stream);
}

/**
 * Slice a stream by index. Negative start/end indexes are not supported
 * @param {number} start
 * @param {number} end
 * @param {Stream} stream
 * @returns {Stream} stream containing items where start <= index < end
 */
function slice(start, end, stream) {
	return end <= start ? core.empty()
		: new Stream(new Slice(start, end, stream.source));
}

function Slice(min, max, source) {
	this.skip = min;
	this.take = max - min;
	this.source = source;
}

Slice.prototype.run = function(sink, scheduler) {
	return new SliceSink(this.skip, this.take, this.source, sink, scheduler);
};

function SliceSink(skip, take, source, sink, scheduler) {
	this.skip = skip;
	this.take = take;
	this.sink = sink;
	this.disposable = dispose.once(source.run(this, scheduler));
}

SliceSink.prototype.end   = Sink.prototype.end;
SliceSink.prototype.error = Sink.prototype.error;

SliceSink.prototype.event = function(t, x) {
	if(this.skip > 0) {
		this.skip -= 1;
		return;
	}

	if(this.take === 0) {
		return;
	}

	this.take -= 1;
	this.sink.event(t, x);
	if(this.take === 0) {
		this.dispose();
		this.sink.end(t, x);
	}
};

SliceSink.prototype.dispose = function() {
	return this.disposable.dispose();
};

function takeWhile(p, stream) {
	return new Stream(new TakeWhile(p, stream.source));
}

function TakeWhile(p, source) {
	this.p = p;
	this.source = source;
}

TakeWhile.prototype.run = function(sink, scheduler) {
	return new TakeWhileSink(this.p, this.source, sink, scheduler);
};

function TakeWhileSink(p, source, sink, scheduler) {
	this.p = p;
	this.sink = sink;
	this.active = true;
	this.disposable = dispose.once(source.run(this, scheduler));
}

TakeWhileSink.prototype.end   = Sink.prototype.end;
TakeWhileSink.prototype.error = Sink.prototype.error;

TakeWhileSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}

	var p = this.p;
	this.active = p(x);
	if(this.active) {
		this.sink.event(t, x);
	} else {
		this.dispose();
		this.sink.end(t, x);
	}
};

TakeWhileSink.prototype.dispose = function() {
	return this.disposable.dispose();
};

function skipWhile(p, stream) {
	return new Stream(new SkipWhile(p, stream.source));
}

function SkipWhile(p, source) {
	this.p = p;
	this.source = source;
}

SkipWhile.prototype.run = function(sink, scheduler) {
	return this.source.run(new SkipWhileSink(this.p, sink), scheduler);
};

function SkipWhileSink(p, sink) {
	this.p = p;
	this.sink = sink;
	this.skipping = true;
}

SkipWhileSink.prototype.end   = Sink.prototype.end;
SkipWhileSink.prototype.error = Sink.prototype.error;

SkipWhileSink.prototype.event = function(t, x) {
	if(this.skipping) {
		var p = this.p;
		this.skipping = p(x);
		if(this.skipping) {
			return;
		}
	}

	this.sink.event(t, x);
};

},{"../Stream":9,"../disposable/dispose":39,"../sink/Pipe":55,"../source/core":60}],30:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var MulticastSource = require('../source/MulticastSource');
var until = require('./timeslice').takeUntil;
var mergeConcurrently = require('./mergeConcurrently').mergeConcurrently;
var map = require('./transform').map;

exports.switch = switchLatest;

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @param {Stream} stream of streams on which to switch
 * @returns {Stream} switching stream
 */
function switchLatest(stream) {
	var upstream = new Stream(new MulticastSource(stream.source));

	return mergeConcurrently(1, map(untilNext, upstream));

	function untilNext(s) {
		return until(upstream, s);
	}
}

},{"../Stream":9,"../source/MulticastSource":58,"./mergeConcurrently":24,"./timeslice":31,"./transform":34}],31:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Pipe = require('../sink/Pipe');
var dispose = require('../disposable/dispose');
var join = require('../combinator/flatMap').join;
var noop = require('../base').noop;

exports.during    = during;
exports.takeUntil = takeUntil;
exports.skipUntil = skipUntil;

function takeUntil(signal, stream) {
	return new Stream(new Until(signal.source, stream.source));
}

function skipUntil(signal, stream) {
	return new Stream(new Since(signal.source, stream.source));
}

function during(timeWindow, stream) {
	return takeUntil(join(timeWindow), skipUntil(timeWindow, stream));
}

function Until(maxSignal, source) {
	this.maxSignal = maxSignal;
	this.source = source;
}

Until.prototype.run = function(sink, scheduler) {
	var min = new Bound(-Infinity, sink);
	var max = new UpperBound(this.maxSignal, sink, scheduler);
	var disposable = this.source.run(new TimeWindowSink(min, max, sink), scheduler);

	return dispose.all([min, max, disposable]);
};

function Since(minSignal, source) {
	this.minSignal = minSignal;
	this.source = source;
}

Since.prototype.run = function(sink, scheduler) {
	var min = new LowerBound(this.minSignal, sink, scheduler);
	var max = new Bound(Infinity, sink);
	var disposable = this.source.run(new TimeWindowSink(min, max, sink), scheduler);

	return dispose.all([min, max, disposable]);
};

function Bound(value, sink) {
	this.value = value;
	this.sink = sink;
}

Bound.prototype.error = Pipe.prototype.error;
Bound.prototype.event = noop;
Bound.prototype.end = noop;
Bound.prototype.dispose = noop;

function TimeWindowSink(min, max, sink) {
	this.min = min;
	this.max = max;
	this.sink = sink;
}

TimeWindowSink.prototype.event = function(t, x) {
	if(t >= this.min.value && t < this.max.value) {
		this.sink.event(t, x);
	}
};

TimeWindowSink.prototype.error = Pipe.prototype.error;
TimeWindowSink.prototype.end = Pipe.prototype.end;

function LowerBound(signal, sink, scheduler) {
	this.value = Infinity;
	this.sink = sink;
	this.disposable = signal.run(this, scheduler);
}

LowerBound.prototype.event = function(t /*, x */) {
	if(t < this.value) {
		this.value = t;
	}
};

LowerBound.prototype.end = noop;
LowerBound.prototype.error = Pipe.prototype.error;

LowerBound.prototype.dispose = function() {
	return this.disposable.dispose();
};

function UpperBound(signal, sink, scheduler) {
	this.value = Infinity;
	this.sink = sink;
	this.disposable = signal.run(this, scheduler);
}

UpperBound.prototype.event = function(t, x) {
	if(t < this.value) {
		this.value = t;
		this.sink.end(t, x);
	}
};

UpperBound.prototype.end = noop;
UpperBound.prototype.error = Pipe.prototype.error;

UpperBound.prototype.dispose = function() {
	return this.disposable.dispose();
};

},{"../Stream":9,"../base":10,"../combinator/flatMap":20,"../disposable/dispose":39,"../sink/Pipe":55}],32:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Sink = require('../sink/Pipe');

exports.timestamp = timestamp;

function timestamp(stream) {
	return new Stream(new Timestamp(stream.source));
}

function Timestamp(source) {
	this.source = source;
}

Timestamp.prototype.run = function(sink, scheduler) {
	return this.source.run(new TimestampSink(sink), scheduler);
};

function TimestampSink(sink) {
	this.sink = sink;
}

TimestampSink.prototype.end   = Sink.prototype.end;
TimestampSink.prototype.error = Sink.prototype.error;

TimestampSink.prototype.event = function(t, x) {
	this.sink.event(t, { time: t, value: x });
};

},{"../Stream":9,"../sink/Pipe":55}],33:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');

exports.transduce = transduce;

/**
 * Transform a stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @param  {Stream} stream stream whose events will be passed through the
 *  transducer
 * @return {Stream} stream of events transformed by the transducer
 */
function transduce(transducer, stream) {
	return new Stream(new Transduce(transducer, stream.source));
}

function Transduce(transducer, source) {
	this.transducer = transducer;
	this.source = source;
}

Transduce.prototype.run = function(sink, scheduler) {
	var xf = this.transducer(new Transformer(sink));
	return this.source.run(new TransduceSink(getTxHandler(xf), sink), scheduler);
};

function TransduceSink(adapter, sink) {
	this.xf = adapter;
	this.sink = sink;
}

TransduceSink.prototype.event = function(t, x) {
	var next = this.xf.step(t, x);

	return this.xf.isReduced(next)
		? this.sink.end(t, this.xf.getResult(next))
		: next;
};

TransduceSink.prototype.end = function(t, x) {
	return this.xf.result(x);
};

TransduceSink.prototype.error = function(t, e) {
	return this.sink.error(t, e);
};

function Transformer(sink) {
	this.time = -Infinity;
	this.sink = sink;
}

Transformer.prototype['@@transducer/init'] = Transformer.prototype.init = function() {};

Transformer.prototype['@@transducer/step'] = Transformer.prototype.step = function(t, x) {
	if(!isNaN(t)) {
		this.time = Math.max(t, this.time);
	}
	return this.sink.event(this.time, x);
};

Transformer.prototype['@@transducer/result'] = Transformer.prototype.result = function(x) {
	return this.sink.end(this.time, x);
};

/**
 * Given an object supporting the new or legacy transducer protocol,
 * create an adapter for it.
 * @param {object} tx transform
 * @returns {TxAdapter|LegacyTxAdapter}
 */
function getTxHandler(tx) {
	return typeof tx['@@transducer/step'] === 'function'
		? new TxAdapter(tx)
		: new LegacyTxAdapter(tx);
}

/**
 * Adapter for new official transducer protocol
 * @param {object} tx transform
 * @constructor
 */
function TxAdapter(tx) {
	this.tx = tx;
}

TxAdapter.prototype.step = function(t, x) {
	return this.tx['@@transducer/step'](t, x);
};
TxAdapter.prototype.result = function(x) {
	return this.tx['@@transducer/result'](x);
};
TxAdapter.prototype.isReduced = function(x) {
	return x != null && x['@@transducer/reduced'];
};
TxAdapter.prototype.getResult = function(x) {
	return x['@@transducer/value'];
};

/**
 * Adapter for older transducer protocol
 * @param {object} tx transform
 * @constructor
 */
function LegacyTxAdapter(tx) {
	this.tx = tx;
}

LegacyTxAdapter.prototype.step = function(t, x) {
	return this.tx.step(t, x);
};
LegacyTxAdapter.prototype.result = function(x) {
	return this.tx.result(x);
};
LegacyTxAdapter.prototype.isReduced = function(x) {
	return x != null && x.__transducers_reduced__;
};
LegacyTxAdapter.prototype.getResult = function(x) {
	return x.value;
};

},{"../Stream":9}],34:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var Map = require('../fusion/Map');

exports.map = map;
exports.constant = constant;
exports.tap = tap;

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @param {Stream} stream stream to map
 * @returns {Stream} stream containing items transformed by f
 */
function map(f, stream) {
	return new Stream(Map.create(f, stream.source));
}

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @param {Stream} stream
 * @returns {Stream} stream containing items replaced with x
 */
function constant(x, stream) {
	return map(function() {
		return x;
	}, stream);
}

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @param {Stream} stream stream to tap
 * @returns {Stream} new stream containing the same items as this stream
 */
function tap(f, stream) {
	return map(function(x) {
		f(x);
		return x;
	}, stream);
}

},{"../Stream":9,"../fusion/Map":43}],35:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var transform = require('./transform');
var core = require('../source/core');
var Sink = require('../sink/Pipe');
var IndexSink = require('../sink/IndexSink');
var dispose = require('../disposable/dispose');
var base = require('../base');
var invoke = require('../invoke');
var Queue = require('../Queue');

var map = base.map;
var tail = base.tail;

exports.zip = zip;
exports.zipArray = zipArray;

/**
 * Combine streams pairwise (or tuple-wise) by index by applying f to values
 * at corresponding indices.  The returned stream ends when any of the input
 * streams ends.
 * @param {function} f function to combine values
 * @returns {Stream} new stream with items at corresponding indices combined
 *  using f
 */
function zip(f /*,...streams */) {
	return zipArray(f, tail(arguments));
}

/**
 * Combine streams pairwise (or tuple-wise) by index by applying f to values
 * at corresponding indices.  The returned stream ends when any of the input
 * streams ends.
 * @param {function} f function to combine values
 * @param {[Stream]} streams streams to zip using f
 * @returns {Stream} new stream with items at corresponding indices combined
 *  using f
 */
function zipArray(f, streams) {
	return streams.length === 0 ? core.empty()
		 : streams.length === 1 ? transform.map(f, streams[0])
		 : new Stream(new Zip(f, map(getSource, streams)));
}

function getSource(stream) {
	return stream.source;
}

function Zip(f, sources) {
	this.f = f;
	this.sources = sources;
}

Zip.prototype.run = function(sink, scheduler) {
	var l = this.sources.length;
	var disposables = new Array(l);
	var sinks = new Array(l);
	var buffers = new Array(l);

	var zipSink = new ZipSink(this.f, buffers, sinks, sink);

	for(var indexSink, i=0; i<l; ++i) {
		buffers[i] = new Queue();
		indexSink = sinks[i] = new IndexSink(i, zipSink);
		disposables[i] = this.sources[i].run(indexSink, scheduler);
	}

	return dispose.all(disposables);
};

function ZipSink(f, buffers, sinks, sink) {
	this.f = f;
	this.sinks = sinks;
	this.sink = sink;
	this.buffers = buffers;
}

ZipSink.prototype.event = function(t, indexedValue) {
	var buffers = this.buffers;
	var buffer = buffers[indexedValue.index];

	buffer.push(indexedValue.value);

	if(buffer.length() === 1) {
		if(!ready(this.buffers)) {
			return;
		}

		emitZipped(this.f, t, buffers, this.sink);

		if (ended(this.buffers, this.sinks)) {
			this.sink.end(t, void 0);
		}
	}
};

ZipSink.prototype.end = function(t, indexedValue) {
	var buffer = this.buffers[indexedValue.index];
	if(buffer.isEmpty()) {
		this.sink.end(t, indexedValue.value);
	}
};

ZipSink.prototype.error = Sink.prototype.error;

function emitZipped (f, t, buffers, sink) {
	sink.event(t, invoke(f, map(head, buffers)));
}

function head(buffer) {
	return buffer.shift();
}

function ended(buffers, sinks) {
	for(var i=0, l=buffers.length; i<l; ++i) {
		if(buffers[i].isEmpty() && !sinks[i].active) {
			return true;
		}
	}
	return false;
}

function ready(buffers) {
	for(var i=0, l=buffers.length; i<l; ++i) {
		if(buffers[i].isEmpty()) {
			return false;
		}
	}
	return true;
}

},{"../Queue":8,"../Stream":9,"../base":10,"../disposable/dispose":39,"../invoke":44,"../sink/IndexSink":53,"../sink/Pipe":55,"../source/core":60,"./transform":34}],36:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = defer;

function defer(task) {
	return Promise.resolve(task).then(runTask);
}

function runTask(task) {
	try {
		return task.run();
	} catch(e) {
		return task.error(e);
	}
}

},{}],37:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = Disposable;

/**
 * Create a new Disposable which will dispose its underlying resource.
 * @param {function} dispose function
 * @param {*?} data any data to be passed to disposer function
 * @constructor
 */
function Disposable(dispose, data) {
	this._dispose = dispose;
	this._data = data;
}

Disposable.prototype.dispose = function() {
	return this._dispose(this._data);
};

},{}],38:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = SettableDisposable;

function SettableDisposable() {
	this.disposable = void 0;
	this.disposed = false;
	this._resolve = void 0;

	var self = this;
	this.result = new Promise(function(resolve) {
		self._resolve = resolve;
	});
}

SettableDisposable.prototype.setDisposable = function(disposable) {
	if(this.disposable !== void 0) {
		throw new Error('setDisposable called more than once');
	}

	this.disposable = disposable;

	if(this.disposed) {
		this._resolve(disposable.dispose());
	}
};

SettableDisposable.prototype.dispose = function() {
	if(this.disposed) {
		return this.result;
	}

	this.disposed = true;

	if(this.disposable !== void 0) {
		this.result = this.disposable.dispose();
	}

	return this.result;
};

},{}],39:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Disposable = require('./Disposable');
var SettableDisposable = require('./SettableDisposable');
var isPromise = require('../Promise').isPromise;
var base = require('../base');

var map = base.map;
var identity = base.identity;

exports.tryDispose = tryDispose;
exports.create = create;
exports.once = once;
exports.empty = empty;
exports.all = all;
exports.settable = settable;
exports.promised = promised;

/**
 * Call disposable.dispose.  If it returns a promise, catch promise
 * error and forward it through the provided sink.
 * @param {number} t time
 * @param {{dispose: function}} disposable
 * @param {{error: function}} sink
 * @return {*} result of disposable.dispose
 */
function tryDispose(t, disposable, sink) {
	var result = disposeSafely(disposable);
	return isPromise(result)
		? result.catch(function (e) {
			sink.error(t, e);
		})
		: result;
}

/**
 * Create a new Disposable which will dispose its underlying resource
 * at most once.
 * @param {function} dispose function
 * @param {*?} data any data to be passed to disposer function
 * @return {Disposable}
 */
function create(dispose, data) {
	return once(new Disposable(dispose, data));
}

/**
 * Create a noop disposable. Can be used to satisfy a Disposable
 * requirement when no actual resource needs to be disposed.
 * @return {Disposable|exports|module.exports}
 */
function empty() {
	return new Disposable(identity, void 0);
}

/**
 * Create a disposable that will dispose all input disposables in parallel.
 * @param {Array<Disposable>} disposables
 * @return {Disposable}
 */
function all(disposables) {
	return create(disposeAll, disposables);
}

function disposeAll(disposables) {
	return Promise.all(map(disposeSafely, disposables));
}

function disposeSafely(disposable) {
	try {
		return disposable.dispose();
	} catch(e) {
		return Promise.reject(e);
	}
}

/**
 * Create a disposable from a promise for another disposable
 * @param {Promise<Disposable>} disposablePromise
 * @return {Disposable}
 */
function promised(disposablePromise) {
	return create(disposePromise, disposablePromise);
}

function disposePromise(disposablePromise) {
	return disposablePromise.then(disposeOne);
}

function disposeOne(disposable) {
	return disposable.dispose();
}

/**
 * Create a disposable proxy that allows its underlying disposable to
 * be set later.
 * @return {SettableDisposable}
 */
function settable() {
	return new SettableDisposable();
}

/**
 * Wrap an existing disposable (which may not already have been once()d)
 * so that it will only dispose its underlying resource at most once.
 * @param {{ dispose: function() }} disposable
 * @return {Disposable} wrapped disposable
 */
function once(disposable) {
	return new Disposable(disposeMemoized, memoized(disposable));
}

function disposeMemoized(memoized) {
	if(!memoized.disposed) {
		memoized.disposed = true;
		memoized.value = disposeSafely(memoized.disposable);
		memoized.disposable = void 0;
	}

	return memoized.value;
}

function memoized(disposable) {
	return { disposed: false, disposable: disposable, value: void 0 };
}

},{"../Promise":7,"../base":10,"./Disposable":37,"./SettableDisposable":38}],40:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = fatalError;

function fatalError (e) {
	setTimeout(function() {
		throw e;
	}, 0);
}

},{}],41:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Pipe = require('../sink/Pipe');

module.exports = Filter;

function Filter(p, source) {
	this.p = p;
	this.source = source;
}

/**
 * Create a filtered source, fusing adjacent filter.filter if possible
 * @param {function(x:*):boolean} p filtering predicate
 * @param {{run:function}} source source to filter
 * @returns {Filter} filtered source
 */
Filter.create = function createFilter(p, source) {
	if (source instanceof Filter) {
		return new Filter(and(source.p, p), source.source);
	}

	return new Filter(p, source);
};

Filter.prototype.run = function(sink, scheduler) {
	return this.source.run(new FilterSink(this.p, sink), scheduler);
};

function FilterSink(p, sink) {
	this.p = p;
	this.sink = sink;
}

FilterSink.prototype.end   = Pipe.prototype.end;
FilterSink.prototype.error = Pipe.prototype.error;

FilterSink.prototype.event = function(t, x) {
	var p = this.p;
	p(x) && this.sink.event(t, x);
};

function and(p, q) {
	return function(x) {
		return p(x) && q(x);
	};
}

},{"../sink/Pipe":55}],42:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Pipe = require('../sink/Pipe');

module.exports = FilterMap;

function FilterMap(p, f, source) {
	this.p = p;
	this.f = f;
	this.source = source;
}

FilterMap.prototype.run = function(sink, scheduler) {
	return this.source.run(new FilterMapSink(this.p, this.f, sink), scheduler);
};

function FilterMapSink(p, f, sink) {
	this.p = p;
	this.f = f;
	this.sink = sink;
}

FilterMapSink.prototype.event = function(t, x) {
	var f = this.f;
	var p = this.p;
	p(x) && this.sink.event(t, f(x));
};

FilterMapSink.prototype.end = Pipe.prototype.end;
FilterMapSink.prototype.error = Pipe.prototype.error;

},{"../sink/Pipe":55}],43:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Pipe = require('../sink/Pipe');
var Filter = require('./Filter');
var FilterMap = require('./FilterMap');
var base = require('../base');

module.exports = Map;

function Map(f, source) {
	this.f = f;
	this.source = source;
}

/**
 * Create a mapped source, fusing adjacent map.map, filter.map,
 * and filter.map.map if possible
 * @param {function(*):*} f mapping function
 * @param {{run:function}} source source to map
 * @returns {Map|FilterMap} mapped source, possibly fused
 */
Map.create = function createMap(f, source) {
	if(source instanceof Map) {
		return new Map(base.compose(f, source.f), source.source);
	}

	if(source instanceof Filter) {
		return new FilterMap(source.p, f, source.source);
	}

	if(source instanceof FilterMap) {
		return new FilterMap(source.p, base.compose(f, source.f), source.source);
	}

	return new Map(f, source);
};

Map.prototype.run = function(sink, scheduler) {
	return this.source.run(new MapSink(this.f, sink), scheduler);
};

function MapSink(f, sink) {
	this.f = f;
	this.sink = sink;
}

MapSink.prototype.end   = Pipe.prototype.end;
MapSink.prototype.error = Pipe.prototype.error;

MapSink.prototype.event = function(t, x) {
	var f = this.f;
	this.sink.event(t, f(x));
};

},{"../base":10,"../sink/Pipe":55,"./Filter":41,"./FilterMap":42}],44:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = invoke;

function invoke(f, args) {
	/*eslint complexity: [2,7]*/
	switch(args.length) {
		case 0: return f();
		case 1: return f(args[0]);
		case 2: return f(args[0], args[1]);
		case 3: return f(args[0], args[1], args[2]);
		case 4: return f(args[0], args[1], args[2], args[3]);
		case 5: return f(args[0], args[1], args[2], args[3], args[4]);
		default:
			return f.apply(void 0, args);
	}
}

},{}],45:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.isIterable = isIterable;
exports.getIterator = getIterator;
exports.makeIterable = makeIterable;

/*global Set, Symbol*/
var iteratorSymbol;
// Firefox ships a partial implementation using the name @@iterator.
// https://bugzilla.mozilla.org/show_bug.cgi?id=907077#c14
if (typeof Set === 'function' && typeof new Set()['@@iterator'] === 'function') {
	iteratorSymbol = '@@iterator';
} else {
	iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator ||
	'_es6shim_iterator_';
}

function isIterable(o) {
	return typeof o[iteratorSymbol] === 'function';
}

function getIterator(o) {
	return o[iteratorSymbol]();
}

function makeIterable(f, o) {
	o[iteratorSymbol] = f;
	return o;
}

},{}],46:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Observer = require('./sink/Observer');
var dispose = require('./disposable/dispose');
var defaultScheduler = require('./scheduler/defaultScheduler');

exports.withDefaultScheduler = withDefaultScheduler;
exports.withScheduler = withScheduler;

function withDefaultScheduler(f, source) {
	return withScheduler(f, source, defaultScheduler);
}

function withScheduler(f, source, scheduler) {
	return new Promise(function (resolve, reject) {
		runSource(f, source, scheduler, resolve, reject);
	});
}

function runSource(f, source, scheduler, resolve, reject) {
	var disposable = dispose.settable();
	var observer = new Observer(f, resolve, reject, disposable);

	disposable.setDisposable(source.run(observer, scheduler));
}

},{"./disposable/dispose":39,"./scheduler/defaultScheduler":49,"./sink/Observer":54}],47:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var fatal = require('../fatalError');

module.exports = PropagateTask;

function PropagateTask(run, value, sink) {
	this._run = run;
	this.value = value;
	this.sink = sink;
	this.active = true;
}

PropagateTask.event = function(value, sink) {
	return new PropagateTask(emit, value, sink);
};

PropagateTask.end = function(value, sink) {
	return new PropagateTask(end, value, sink);
};

PropagateTask.error = function(value, sink) {
	return new PropagateTask(error, value, sink);
};

PropagateTask.prototype.dispose = function() {
	this.active = false;
};

PropagateTask.prototype.run = function(t) {
	if(!this.active) {
		return;
	}
	this._run(t, this.value, this.sink);
};

PropagateTask.prototype.error = function(t, e) {
	if(!this.active) {
		return fatal(e);
	}
	this.sink.error(t, e);
};

function error(t, e, sink) {
	sink.error(t, e);
}

function emit(t, x, sink) {
	sink.event(t, x);
}

function end(t, x, sink) {
	sink.end(t, x);
}

},{"../fatalError":40}],48:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var base = require('./../base');

module.exports = Scheduler;

function ScheduledTask(delay, period, task, scheduler) {
	this.time = delay;
	this.period = period;
	this.task = task;
	this.scheduler = scheduler;
	this.active = true;
}

ScheduledTask.prototype.run = function() {
	return this.task.run(this.time);
};

ScheduledTask.prototype.error = function(e) {
	return this.task.error(this.time, e);
};

ScheduledTask.prototype.cancel = function() {
	this.scheduler.cancel(this);
	return this.task.dispose();
};

function runTask(task) {
	try {
		return task.run();
	} catch(e) {
		return task.error(e);
	}
}

function Scheduler(timer) {
	this.timer = timer;

	this._timer = null;
	this._nextArrival = 0;
	this._tasks = [];

	var self = this;
	this._runReadyTasksBound = function() {
		self._runReadyTasks(self.now());
	};
}

Scheduler.prototype.now = function() {
	return this.timer.now();
};

Scheduler.prototype.asap = function(task) {
	return this.schedule(0, -1, task);
};

Scheduler.prototype.delay = function(delay, task) {
	return this.schedule(delay, -1, task);
};

Scheduler.prototype.periodic = function(period, task) {
	return this.schedule(0, period, task);
};

Scheduler.prototype.schedule = function(delay, period, task) {
	var now = this.now();
    var st = new ScheduledTask(now + Math.max(0, delay), period, task, this);

	insertByTime(st, this._tasks);
	this._scheduleNextRun(now);
	return st;
};

Scheduler.prototype.cancel = function(task) {
	task.active = false;
	var i = binarySearch(task.time, this._tasks);

	if(i >= 0 && i < this._tasks.length) {
		var at = base.findIndex(task, this._tasks[i].events);
        this._tasks[i].events.splice(at, 1);
		this._reschedule();
	}
};

Scheduler.prototype.cancelAll = function(f) {
	this._tasks = base.removeAll(f, this._tasks);
	this._reschedule();
};

Scheduler.prototype._reschedule = function() {
	if(this._tasks.length === 0) {
		this._unschedule();
	} else {
		this._scheduleNextRun(this.now());
	}
};

Scheduler.prototype._unschedule = function() {
	this.timer.clearTimer(this._timer);
	this._timer = null;
};

Scheduler.prototype._scheduleNextRun = function(now) {
	if(this._tasks.length === 0) {
		return;
	}

	var nextArrival = this._tasks[0].time;

	if(this._timer === null) {
		this._scheduleNextArrival(nextArrival, now);
	} else if(nextArrival < this._nextArrival) {
		this._unschedule();
		this._scheduleNextArrival(nextArrival, now);
	}
};

Scheduler.prototype._scheduleNextArrival = function(nextArrival, now) {
	this._nextArrival = nextArrival;
	var delay = Math.max(0, nextArrival - now);
	this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};


Scheduler.prototype._runReadyTasks = function(now) {
	this._timer = null;

	this._tasks = this._findAndRunTasks(now);

	this._scheduleNextRun(this.now());
};

Scheduler.prototype._findAndRunTasks = function(now) {
	var tasks = this._tasks;
	var l = tasks.length;
	var i = 0;

	while(i < l && tasks[i].time <= now) {
		++i;
	}

	this._tasks = tasks.slice(i);

	// Run all ready tasks
	for (var j = 0; j < i; ++j) {
		this._tasks = runTasks(tasks[j], this._tasks);
	}
	return this._tasks;
};

function runTasks(timeslot, tasks) {
	var events = timeslot.events;
	for(var i=0; i<events.length; ++i) {
		var task = events[i];

		if(task.active) {
			runTask(task);

			// Reschedule periodic repeating tasks
			// Check active again, since a task may have canceled itself
			if(task.period >= 0) {
				task.time = task.time + task.period;
				insertByTime(task, tasks);
			}
		}
	}

	return tasks;
}

function insertByTime(task, timeslots) {
	var l = timeslots.length;

	if(l === 0) {
		timeslots.push(newTimeslot(task.time, [task]));
		return;
	}

	var i = binarySearch(task.time, timeslots);

	if(i >= l) {
		timeslots.push(newTimeslot(task.time, [task]));
	} else if(task.time === timeslots[i].time) {
		timeslots[i].events.push(task);
	} else {
		timeslots.splice(i, 0, newTimeslot(task.time, [task]));
	}
}

function binarySearch(t, sortedArray) {
	var lo = 0;
	var hi = sortedArray.length;
	var mid, y;

	while (lo < hi) {
		mid = Math.floor((lo + hi) / 2);
		y = sortedArray[mid];

		if (t === y.time) {
			return mid;
		} else if (t < y.time) {
			hi = mid;
		} else {
			lo = mid + 1;
		}
	}
	return hi;
}

function newTimeslot(t, events) {
	return { time: t, events: events };
}

},{"./../base":10}],49:[function(require,module,exports){
(function (process){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Scheduler = require('./Scheduler');
var setTimeoutTimer = require('./timeoutTimer');
var nodeTimer = require('./nodeTimer');

var isNode = typeof process === 'object'
		&& typeof process.nextTick === 'function';

module.exports = new Scheduler(isNode ? nodeTimer : setTimeoutTimer);

}).call(this,require('_process'))
},{"./Scheduler":48,"./nodeTimer":50,"./timeoutTimer":51,"_process":166}],50:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var defer = require('../defer');

/*global setTimeout, clearTimeout*/

function Task(f) {
	this.f = f;
	this.active = true;
}

Task.prototype.run = function() {
	if(!this.active) {
		return;
	}
	var f = this.f;
	return f();
};

Task.prototype.error = function(e) {
	throw e;
};

Task.prototype.cancel = function() {
	this.active = false;
};

function runAsTask(f) {
	var task = new Task(f);
	defer(task);
	return task;
}

module.exports = {
	now: Date.now,
	setTimer: function(f, dt) {
		return dt <= 0 ? runAsTask(f) : setTimeout(f, dt);
	},
	clearTimer: function(t) {
		return t instanceof Task ? t.cancel() : clearTimeout(t);
	}
};

},{"../defer":36}],51:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/*global setTimeout, clearTimeout*/

module.exports = {
	now: Date.now,
	setTimer: function(f, dt) {
		return setTimeout(f, dt);
	},
	clearTimer: function(t) {
		return clearTimeout(t);
	}
};

},{}],52:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var defer = require('../defer');

module.exports = DeferredSink;

function DeferredSink(sink) {
	this.sink = sink;
	this.events = [];
	this.length = 0;
	this.active = true;
}

DeferredSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}

	if(this.length === 0) {
		defer(new PropagateAllTask(this));
	}

	this.events[this.length++] = { time: t, value: x };
};

DeferredSink.prototype.error = function(t, e) {
	this.active = false;
	defer(new ErrorTask(t, e, this.sink));
};

DeferredSink.prototype.end = function(t, x) {
	this.active = false;
	defer(new EndTask(t, x, this.sink));
};

function PropagateAllTask(deferred) {
	this.deferred = deferred;
}

PropagateAllTask.prototype.run = function() {
	var p = this.deferred;
	var events = p.events;
	var sink = p.sink;
	var event;

	for(var i = 0, l = p.length; i<l; ++i) {
		event = events[i];
		sink.event(event.time, event.value);
		events[i] = void 0;
	}

	p.length = 0;
};

PropagateAllTask.prototype.error = function(e) {
	this.deferred.error(0, e);
};

function EndTask(t, x, sink) {
	this.time = t;
	this.value = x;
	this.sink = sink;
}

EndTask.prototype.run = function() {
	this.sink.end(this.time, this.value);
};

EndTask.prototype.error = function(e) {
	this.sink.error(this.time, e);
};

function ErrorTask(t, e, sink) {
	this.time = t;
	this.value = e;
	this.sink = sink;
}

ErrorTask.prototype.run = function() {
	this.sink.error(this.time, this.value);
};

ErrorTask.prototype.error = function(e) {
	throw e;
};

},{"../defer":36}],53:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Sink = require('./Pipe');

module.exports = IndexSink;

IndexSink.hasValue = hasValue;

function hasValue(indexSink) {
	return indexSink.hasValue;
}

function IndexSink(i, sink) {
	this.index = i;
	this.sink = sink;
	this.active = true;
	this.hasValue = false;
	this.value = void 0;
}

IndexSink.prototype.event = function(t, x) {
	if(!this.active) {
		return;
	}
	this.value = x;
	this.hasValue = true;
	this.sink.event(t, this);
};

IndexSink.prototype.end = function(t, x) {
	if(!this.active) {
		return;
	}
	this.active = false;
	this.sink.end(t, { index: this.index, value: x });
};

IndexSink.prototype.error = Sink.prototype.error;

},{"./Pipe":55}],54:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = Observer;

/**
 * Sink that accepts functions to apply to each event, and to end, and error
 * signals.
 * @constructor
 */
function Observer(event, end, error, disposable) {
	this._event = event;
	this._end = end;
	this._error = error;
	this._disposable = disposable;
	this.active = true;
}

Observer.prototype.event = function(t, x) {
	if (!this.active) {
		return;
	}
	this._event(x);
};

Observer.prototype.end = function(t, x) {
	if (!this.active) {
		return;
	}
	this.active = false;
	disposeThen(this._end, this._error, this._disposable, x);
};

Observer.prototype.error = function(t, e) {
	this.active = false;
	disposeThen(this._error, this._error, this._disposable, e);
};

function disposeThen(end, error, disposable, x) {
	Promise.resolve(disposable.dispose()).then(function () {
		end(x);
	}, error);
}

},{}],55:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

module.exports = Pipe;

/**
 * A sink mixin that simply forwards event, end, and error to
 * another sink.
 * @param sink
 * @constructor
 */
function Pipe(sink) {
	this.sink = sink;
}

Pipe.prototype.event = function(t, x) {
	return this.sink.event(t, x);
};

Pipe.prototype.end = function(t, x) {
	return this.sink.end(t, x);
};

Pipe.prototype.error = function(t, e) {
	return this.sink.error(t, e);
};

},{}],56:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var DeferredSink = require('../sink/DeferredSink');
var dispose = require('../disposable/dispose');
var tryEvent = require('./tryEvent');

module.exports = EventEmitterSource;

function EventEmitterSource(event, source) {
	this.event = event;
	this.source = source;
}

EventEmitterSource.prototype.run = function(sink, scheduler) {
	// NOTE: Because EventEmitter allows events in the same call stack as
	// a listener is added, use a DeferredSink to buffer events
	// until the stack clears, then propagate.  This maintains most.js's
	// invariant that no event will be delivered in the same call stack
	// as an observer begins observing.
	var dsink = new DeferredSink(sink);

	function addEventVariadic(a) {
		var l = arguments.length;
		if(l > 1) {
			var arr = new Array(l);
			for(var i=0; i<l; ++i) {
				arr[i] = arguments[i];
			}
			tryEvent.tryEvent(scheduler.now(), arr, dsink);
		} else {
			tryEvent.tryEvent(scheduler.now(), a, dsink);
		}
	}

	this.source.addListener(this.event, addEventVariadic);

	return dispose.create(disposeEventEmitter, { target: this, addEvent: addEventVariadic });
};

function disposeEventEmitter(info) {
	var target = info.target;
	target.source.removeListener(target.event, info.addEvent);
}

},{"../disposable/dispose":39,"../sink/DeferredSink":52,"./tryEvent":69}],57:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var dispose = require('../disposable/dispose');
var tryEvent = require('./tryEvent');

module.exports = EventTargetSource;

function EventTargetSource(event, source, capture) {
	this.event = event;
	this.source = source;
	this.capture = capture;
}

EventTargetSource.prototype.run = function(sink, scheduler) {
	function addEvent(e) {
		tryEvent.tryEvent(scheduler.now(), e, sink);
	}

	this.source.addEventListener(this.event, addEvent, this.capture);

	return dispose.create(disposeEventTarget,
		{ target: this, addEvent: addEvent });
};

function disposeEventTarget(info) {
	var target = info.target;
	target.source.removeEventListener(target.event, info.addEvent, target.capture);
}

},{"../disposable/dispose":39,"./tryEvent":69}],58:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var base = require('../base');

module.exports = MulticastSource;

function MulticastSource(source) {
	this.source = source;
	this.sinks = [];
	this._disposable = void 0;
}

MulticastSource.prototype.run = function(sink, scheduler) {
	var n = this.add(sink);
	if(n === 1) {
		this._disposable = this.source.run(this, scheduler);
	}

	return new MulticastDisposable(this, sink);
};

MulticastSource.prototype._dispose = function() {
	var disposable = this._disposable;
	this._disposable = void 0;
	return Promise.resolve(disposable).then(dispose);
};

function dispose(disposable) {
	if(disposable === void 0) {
		return;
	}
	return disposable.dispose();
}

function MulticastDisposable(source, sink) {
	this.source = source;
	this.sink = sink;
}

MulticastDisposable.prototype.dispose = function() {
	var s = this.source;
	var remaining = s.remove(this.sink);
	return remaining === 0 && s._dispose();
};

MulticastSource.prototype.add = function(sink) {
	this.sinks = base.append(sink, this.sinks);
	return this.sinks.length;
};

MulticastSource.prototype.remove = function(sink) {
	this.sinks = base.remove(base.findIndex(sink, this.sinks), this.sinks);
	return this.sinks.length;
};

MulticastSource.prototype.event = function(t, x) {
	var s = this.sinks;
	if(s.length === 1) {
		s[0].event(t, x);
		return;
	}
	for(var i=0; i<s.length; ++i) {
		s[i].event(t, x);
	}
};

MulticastSource.prototype.end = function(t, x) {
	var s = this.sinks;
	if(s.length === 1) {
		s[0].end(t, x);
		return;
	}
	for(var i=0; i<s.length; ++i) {
		s[i].end(t, x);
	}
};

MulticastSource.prototype.error = function(t, e) {
	var s = this.sinks;
	if(s.length === 1) {
		s[0].error(t, e);
		return;
	}
	for (var i=0; i<s.length; ++i) {
		s[i].error(t, e);
	}
};

},{"../base":10}],59:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var PropagateTask = require('../scheduler/PropagateTask');

module.exports = ValueSource;

function ValueSource(emit, x) {
	this.emit = emit;
	this.value = x;
}

ValueSource.prototype.run = function(sink, scheduler) {
	return new ValueProducer(this.emit, this.value, sink, scheduler);
};

function ValueProducer(emit, x, sink, scheduler) {
	this.task = new PropagateTask(emit, x, sink);
	scheduler.asap(this.task);
}

ValueProducer.prototype.dispose = function() {
	return this.task.dispose();
};

},{"../scheduler/PropagateTask":47}],60:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var ValueSource = require('../source/ValueSource');
var dispose = require('../disposable/dispose');
var PropagateTask = require('../scheduler/PropagateTask');

exports.of = streamOf;
exports.empty = empty;
exports.never = never;

/**
 * Stream containing only x
 * @param {*} x
 * @returns {Stream}
 */
function streamOf(x) {
	return new Stream(new ValueSource(emit, x));
}

function emit(t, x, sink) {
	sink.event(0, x);
	sink.end(0, void 0);
}

/**
 * Stream containing no events and ends immediately
 * @returns {Stream}
 */
function empty() {
	return EMPTY;
}

function EmptySource() {}

EmptySource.prototype.run = function(sink, scheduler) {
	var task = PropagateTask.end(void 0, sink);
	scheduler.asap(task);

	return dispose.create(disposeEmpty, task);
};

function disposeEmpty(task) {
	return task.dispose();
}

var EMPTY = new Stream(new EmptySource());

/**
 * Stream containing no events and never ends
 * @returns {Stream}
 */
function never() {
	return NEVER;
}

function NeverSource() {}

NeverSource.prototype.run = function() {
	return dispose.empty();
};

var NEVER = new Stream(new NeverSource());

},{"../Stream":9,"../disposable/dispose":39,"../scheduler/PropagateTask":47,"../source/ValueSource":59}],61:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var MulticastSource = require('./MulticastSource');
var DeferredSink = require('../sink/DeferredSink');
var tryEvent = require('./tryEvent');

exports.create = create;

function create(run) {
	return new Stream(new MulticastSource(new SubscriberSource(run)));
}

function SubscriberSource(subscribe) {
	this._subscribe = subscribe;
}

SubscriberSource.prototype.run = function(sink, scheduler) {
	return new Subscription(new DeferredSink(sink), scheduler, this._subscribe);
};

function Subscription(sink, scheduler, subscribe) {
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;
	this._unsubscribe = this._init(subscribe);
}

Subscription.prototype._init = function(subscribe) {
	var s = this;

	try {
		return subscribe(add, end, error);
	} catch(e) {
		error(e);
	}

	function add(x) {
		s._add(x);
	}
	function end(x) {
		s._end(x);
	}
	function error(e) {
		s._error(e);
	}
};

Subscription.prototype._add = function(x) {
	if(!this.active) {
		return;
	}
	tryEvent.tryEvent(this.scheduler.now(), x, this.sink);
};

Subscription.prototype._end = function(x) {
	if(!this.active) {
		return;
	}
	this.active = false;
	tryEvent.tryEnd(this.scheduler.now(), x, this.sink);
};

Subscription.prototype._error = function(x) {
	this.active = false;
	this.sink.error(this.scheduler.now(), x);
};

Subscription.prototype.dispose = function() {
	this.active = false;
	if(typeof this._unsubscribe === 'function') {
		return this._unsubscribe.call(void 0);
	}
};

},{"../Stream":9,"../sink/DeferredSink":52,"./MulticastSource":58,"./tryEvent":69}],62:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var fromArray = require('./fromArray').fromArray;
var isIterable = require('../iterable').isIterable;
var fromIterable = require('./fromIterable').fromIterable;
var isArrayLike = require('../base').isArrayLike;

exports.from = from;

function from(a) {
	if(Array.isArray(a) || isArrayLike(a)) {
		return fromArray(a);
	}

	if(isIterable(a)) {
		return fromIterable(a);
	}

	throw new TypeError('not iterable: ' + a);
}

},{"../base":10,"../iterable":45,"./fromArray":63,"./fromIterable":65}],63:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var PropagateTask = require('../scheduler/PropagateTask');

exports.fromArray = fromArray;

function fromArray (a) {
	return new Stream(new ArraySource(a));
}

function ArraySource(a) {
	this.array = a;
}

ArraySource.prototype.run = function(sink, scheduler) {
	return new ArrayProducer(this.array, sink, scheduler);
};

function ArrayProducer(array, sink, scheduler) {
	this.scheduler = scheduler;
	this.task = new PropagateTask(runProducer, array, sink);
	scheduler.asap(this.task);
}

ArrayProducer.prototype.dispose = function() {
	return this.task.dispose();
};

function runProducer(t, array, sink) {
	produce(this, array, sink);
}

function produce(task, array, sink) {
	for(var i=0, l=array.length; i<l && task.active; ++i) {
		sink.event(0, array[i]);
	}

	task.active && end();

	function end() {
		sink.end(0);
	}
}

},{"../Stream":9,"../scheduler/PropagateTask":47}],64:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var MulticastSource = require('./MulticastSource');
var EventTargetSource = require('./EventTargetSource');
var EventEmitterSource = require('./EventEmitterSource');

exports.fromEvent = fromEvent;

/**
 * Create a stream from an EventTarget, such as a DOM Node, or EventEmitter.
 * @param {String} event event type name, e.g. 'click'
 * @param {EventTarget|EventEmitter} source EventTarget or EventEmitter
 * @param {boolean?} useCapture for DOM events, whether to use
 *  capturing--passed as 3rd parameter to addEventListener.
 * @returns {Stream} stream containing all events of the specified type
 * from the source.
 */
function fromEvent(event, source /*, useCapture = false */) {
	var s;

	if(typeof source.addEventListener === 'function' && typeof source.removeEventListener === 'function') {
		var capture = arguments.length > 2 && !!arguments[2];
		s = new MulticastSource(new EventTargetSource(event, source, capture));
	} else if(typeof source.addListener === 'function' && typeof source.removeListener === 'function') {
		s = new EventEmitterSource(event, source);
	} else {
		throw new Error('source must support addEventListener/removeEventListener or addListener/removeListener');
	}

	return new Stream(s);
}

},{"../Stream":9,"./EventEmitterSource":56,"./EventTargetSource":57,"./MulticastSource":58}],65:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var getIterator = require('../iterable').getIterator;
var PropagateTask = require('../scheduler/PropagateTask');

exports.fromIterable = fromIterable;

function fromIterable(iterable) {
	return new Stream(new IterableSource(iterable));
}

function IterableSource(iterable) {
	this.iterable = iterable;
}

IterableSource.prototype.run = function(sink, scheduler) {
	return new IteratorProducer(getIterator(this.iterable), sink, scheduler);
};

function IteratorProducer(iterator, sink, scheduler) {
	this.scheduler = scheduler;
	this.iterator = iterator;
	this.task = new PropagateTask(runProducer, this, sink);
	scheduler.asap(this.task);
}

IteratorProducer.prototype.dispose = function() {
	return this.task.dispose();
};

function runProducer(t, producer, sink) {
	var x = producer.iterator.next();
	if(x.done) {
		sink.end(t, x.value);
	} else {
		sink.event(t, x.value);
	}

	producer.scheduler.asap(producer.task);
}

},{"../Stream":9,"../iterable":45,"../scheduler/PropagateTask":47}],66:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var base = require('../base');

exports.generate = generate;

/**
 * Compute a stream using an *async* generator, which yields promises
 * to control event times.
 * @param f
 * @returns {Stream}
 */
function generate(f /*, ...args */) {
	return new Stream(new GenerateSource(f, base.tail(arguments)));
}

function GenerateSource(f, args) {
	this.f = f;
	this.args = args;
}

GenerateSource.prototype.run = function(sink, scheduler) {
	return new Generate(this.f.apply(void 0, this.args), sink, scheduler);
};

function Generate(iterator, sink, scheduler) {
	this.iterator = iterator;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var self = this;
	function err(e) {
		self.sink.error(self.scheduler.now(), e);
	}

	Promise.resolve(this).then(next).catch(err);
}

function next(generate, x) {
	return generate.active ? handle(generate, generate.iterator.next(x)) : x;
}

function handle(generate, result) {
	if (result.done) {
		return generate.sink.end(generate.scheduler.now(), result.value);
	}

	return Promise.resolve(result.value).then(function (x) {
		return emit(generate, x);
	}, function(e) {
		return error(generate, e);
	});
}

function emit(generate, x) {
	generate.sink.event(generate.scheduler.now(), x);
	return next(generate, x);
}

function error(generate, e) {
	return handle(generate, generate.iterator.throw(e));
}

Generate.prototype.dispose = function() {
	this.active = false;
};

},{"../Stream":9,"../base":10}],67:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');

exports.iterate = iterate;

/**
 * Compute a stream by iteratively calling f to produce values
 * Event times may be controlled by returning a Promise from f
 * @param {function(x:*):*|Promise<*>} f
 * @param {*} x initial value
 * @returns {Stream}
 */
function iterate(f, x) {
	return new Stream(new IterateSource(f, x));
}

function IterateSource(f, x) {
	this.f = f;
	this.value = x;
}

IterateSource.prototype.run = function(sink, scheduler) {
	return new Iterate(this.f, this.value, sink, scheduler);
};

function Iterate(f, initial, sink, scheduler) {
	this.f = f;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var x = initial;

	var self = this;
	function err(e) {
		self.sink.error(self.scheduler.now(), e);
	}

	function start(iterate) {
		return stepIterate(iterate, x);
	}

	Promise.resolve(this).then(start).catch(err);
}

Iterate.prototype.dispose = function() {
	this.active = false;
};

function stepIterate(iterate, x) {
	iterate.sink.event(iterate.scheduler.now(), x);

	if(!iterate.active) {
		return x;
	}

	var f = iterate.f;
	return Promise.resolve(f(x)).then(function(y) {
		return continueIterate(iterate, y);
	});
}

function continueIterate(iterate, x) {
	return !iterate.active ? iterate.value : stepIterate(iterate, x);
}

},{"../Stream":9}],68:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');
var dispose = require('../disposable/dispose');
var MulticastSource = require('./MulticastSource');
var PropagateTask = require('../scheduler/PropagateTask');

exports.periodic = periodic;

/**
 * Create a stream that emits the current time periodically
 * @param {Number} period periodicity of events in millis
 * @param {*) value value to emit each period
 * @returns {Stream} new stream that emits the current time every period
 */
function periodic(period, value) {
	return new Stream(new MulticastSource(new Periodic(period, value)));
}

function Periodic(period, value) {
	this.period = period;
	this.value = value;
}

Periodic.prototype.run = function(sink, scheduler) {
	var task = scheduler.periodic(this.period, new PropagateTask(emit, this.value, sink));
	return dispose.create(cancelTask, task);
};

function cancelTask(task) {
	task.cancel();
}

function emit(t, x, sink) {
	sink.event(t, x);
}

},{"../Stream":9,"../disposable/dispose":39,"../scheduler/PropagateTask":47,"./MulticastSource":58}],69:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.tryEvent = tryEvent;
exports.tryEnd = tryEnd;

function tryEvent(t, x, sink) {
	try {
		sink.event(t, x);
	} catch(e) {
		sink.error(t, e);
	}
}

function tryEnd(t, x, sink) {
	try {
		sink.end(t, x);
	} catch(e) {
		sink.error(t, e);
	}
}

},{}],70:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('../Stream');

exports.unfold = unfold;

/**
 * Compute a stream by unfolding tuples of future values from a seed value
 * Event times may be controlled by returning a Promise from f
 * @param {function(seed:*):{value:*, seed:*, done:boolean}|Promise<{value:*, seed:*, done:boolean}>} f unfolding function accepts
 *  a seed and returns a new tuple with a value, new seed, and boolean done flag.
 *  If tuple.done is true, the stream will end.
 * @param {*} seed seed value
 * @returns {Stream} stream containing all value of all tuples produced by the
 *  unfolding function.
 */
function unfold(f, seed) {
	return new Stream(new UnfoldSource(f, seed));
}

function UnfoldSource(f, seed) {
	this.f = f;
	this.value = seed;
}

UnfoldSource.prototype.run = function(sink, scheduler) {
	return new Unfold(this.f, this.value, sink, scheduler);
};

function Unfold(f, x, sink, scheduler) {
	this.f = f;
	this.sink = sink;
	this.scheduler = scheduler;
	this.active = true;

	var self = this;
	function err(e) {
		self.sink.error(self.scheduler.now(), e);
	}

	function start(unfold) {
		return stepUnfold(unfold, x);
	}

	Promise.resolve(this).then(start).catch(err);
}

Unfold.prototype.dispose = function() {
	this.active = false;
};

function stepUnfold(unfold, x) {
	var f = unfold.f;
	return Promise.resolve(f(x)).then(function(tuple) {
		return continueUnfold(unfold, tuple);
	});
}

function continueUnfold(unfold, tuple) {
	if(tuple.done) {
		unfold.sink.end(unfold.scheduler.now(), tuple.value);
		return tuple.value;
	}

	unfold.sink.event(unfold.scheduler.now(), tuple.value);

	if(!unfold.active) {
		return tuple.value;
	}
	return stepUnfold(unfold, tuple.seed);
}

},{"../Stream":9}],71:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('./lib/Stream');
var base = require('./lib/base');
var core = require('./lib/source/core');
var from = require('./lib/source/from').from;
var periodic = require('./lib/source/periodic').periodic;

/**
 * Core stream type
 * @type {Stream}
 */
exports.Stream = Stream;

// Add of and empty to constructor for fantasy-land compat
exports.of       = Stream.of    = core.of;
exports.just     = core.of; // easier ES6 import alias
exports.empty    = Stream.empty = core.empty;
exports.never    = core.never;
exports.from     = from;
exports.periodic = periodic;

//-----------------------------------------------------------------------
// Creating

var create = require('./lib/source/create');

/**
 * Create a stream by imperatively pushing events.
 * @param {function(add:function(x), end:function(e)):function} run function
 *  that will receive 2 functions as arguments, the first to add new values to the
 *  stream and the second to end the stream. It may *return* a function that
 *  will be called once all consumers have stopped observing the stream.
 * @returns {Stream} stream containing all events added by run before end
 */
exports.create = create.create;

//-----------------------------------------------------------------------
// Adapting other sources

var events = require('./lib/source/fromEvent');

/**
 * Create a stream of events from the supplied EventTarget or EventEmitter
 * @param {String} event event name
 * @param {EventTarget|EventEmitter} source EventTarget or EventEmitter. The source
 *  must support either addEventListener/removeEventListener (w3c EventTarget:
 *  http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget),
 *  or addListener/removeListener (node EventEmitter: http://nodejs.org/api/events.html)
 * @returns {Stream} stream of events of the specified type from the source
 */
exports.fromEvent = events.fromEvent;

//-----------------------------------------------------------------------
// Observing

var observe = require('./lib/combinator/observe');

exports.observe = observe.observe;
exports.forEach = observe.observe;
exports.drain   = observe.drain;

/**
 * Process all the events in the stream
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
Stream.prototype.observe = Stream.prototype.forEach = function(f) {
	return observe.observe(f, this);
};

/**
 * Consume all events in the stream, without providing a function to process each.
 * This causes a stream to become active and begin emitting events, and is useful
 * in cases where all processing has been setup upstream via other combinators, and
 * there is no need to process the terminal events.
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
Stream.prototype.drain = function() {
	return observe.drain(this);
};

//-------------------------------------------------------

var loop = require('./lib/combinator/loop').loop;

exports.loop = loop;

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */
Stream.prototype.loop = function(stepper, seed) {
	return loop(stepper, seed, this);
};

//-------------------------------------------------------

var accumulate = require('./lib/combinator/accumulate');

exports.scan   = accumulate.scan;
exports.reduce = accumulate.reduce;

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @returns {Stream} new stream containing successive reduce results
 */
Stream.prototype.scan = function(f, initial) {
	return accumulate.scan(f, initial, this);
};

/**
 * Reduce the stream to produce a single result.  Note that reducing an infinite
 * stream will return a Promise that never fulfills, but that may reject if an error
 * occurs.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial optional initial value
 * @returns {Promise} promise for the file result of the reduce
 */
Stream.prototype.reduce = function(f, initial) {
	return accumulate.reduce(f, initial, this);
};

//-----------------------------------------------------------------------
// Building and extending

var unfold = require('./lib/source/unfold');
var iterate = require('./lib/source/iterate');
var generate = require('./lib/source/generate');
var build = require('./lib/combinator/build');

exports.unfold    = unfold.unfold;
exports.iterate   = iterate.iterate;
exports.generate  = generate.generate;
exports.cycle     = build.cycle;
exports.concat    = build.concat;
exports.startWith = build.cons;

/**
 * Tie this stream into a circle, thus creating an infinite stream
 * @returns {Stream} new infinite stream
 */
Stream.prototype.cycle = function() {
	return build.cycle(this);
};

/**
 * @param {Stream} tail
 * @returns {Stream} new stream containing all items in this followed by
 *  all items in tail
 */
Stream.prototype.concat = function(tail) {
	return build.concat(this, tail);
};

/**
 * @param {*} x value to prepend
 * @returns {Stream} a new stream with x prepended
 */
Stream.prototype.startWith = function(x) {
	return build.cons(x, this);
};

//-----------------------------------------------------------------------
// Transforming

var transform = require('./lib/combinator/transform');
var applicative = require('./lib/combinator/applicative');

exports.map      = transform.map;
exports.constant = transform.constant;
exports.tap      = transform.tap;
exports.ap       = applicative.ap;

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @returns {Stream} stream containing items transformed by f
 */
Stream.prototype.map = function(f) {
	return transform.map(f, this);
};

/**
 * Assume this stream contains functions, and apply each function to each item
 * in the provided stream.  This generates, in effect, a cross product.
 * @param {Stream} xs stream of items to which
 * @returns {Stream} stream containing the cross product of items
 */
Stream.prototype.ap = function(xs) {
	return applicative.ap(this, xs);
};

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @returns {Stream} stream containing items replaced with x
 */
Stream.prototype.constant = function(x) {
	return transform.constant(x, this);
};

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @returns {Stream} new stream containing the same items as this stream
 */
Stream.prototype.tap = function(f) {
	return transform.tap(f, this);
};

//-----------------------------------------------------------------------
// Transducer support

var transduce = require('./lib/combinator/transduce');

exports.transduce = transduce.transduce;

/**
 * Transform this stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @return {Stream} stream of events transformed by the transducer
 */
Stream.prototype.transduce = function(transducer) {
	return transduce.transduce(transducer, this);
};

//-----------------------------------------------------------------------
// FlatMapping

var flatMap = require('./lib/combinator/flatMap');

exports.flatMap = exports.chain = flatMap.flatMap;
exports.join    = flatMap.join;

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
Stream.prototype.flatMap = Stream.prototype.chain = function(f) {
	return flatMap.flatMap(f, this);
};

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
Stream.prototype.join = function() {
	return flatMap.join(this);
};

var continueWith = require('./lib/combinator/continueWith').continueWith;

exports.continueWith = continueWith;
exports.flatMapEnd = continueWith;

/**
 * Map the end event to a new stream, and begin emitting its values.
 * @param {function(x:*):Stream} f function that receives the end event value,
 * and *must* return a new Stream to continue with.
 * @returns {Stream} new stream that emits all events from the original stream,
 * followed by all events from the stream returned by f.
 */
Stream.prototype.continueWith = Stream.prototype.flatMapEnd = function(f) {
	return continueWith(f, this);
};

var concatMap = require('./lib/combinator/concatMap').concatMap;

exports.concatMap = concatMap;

Stream.prototype.concatMap = function(f) {
	return concatMap(f, this);
};

//-----------------------------------------------------------------------
// Concurrent merging

var mergeConcurrently = require('./lib/combinator/mergeConcurrently');

exports.mergeConcurrently = mergeConcurrently.mergeConcurrently;

/**
 * Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer, limiting the number of inner streams that may
 * be active concurrently.
 * @param {number} concurrency at most this many inner streams will be
 *  allowed to be active concurrently.
 * @return {Stream<X>} new stream containing all events of all inner
 *  streams, with limited concurrency.
 */
Stream.prototype.mergeConcurrently = function(concurrency) {
	return mergeConcurrently.mergeConcurrently(concurrency, this);
};

//-----------------------------------------------------------------------
// Merging

var merge = require('./lib/combinator/merge');

exports.merge = merge.merge;
exports.mergeArray = merge.mergeArray;

/**
 * Merge this stream and all the provided streams
 * @returns {Stream} stream containing items from this stream and s in time
 * order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
Stream.prototype.merge = function(/*...streams*/) {
	return merge.mergeArray(base.cons(this, arguments));
};

//-----------------------------------------------------------------------
// Combining

var combine = require('./lib/combinator/combine');

exports.combine = combine.combine;
exports.combineArray = combine.combineArray;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
Stream.prototype.combine = function(f /*, ...streams*/) {
	return combine.combineArray(f, base.replace(this, 0, arguments));
};

//-----------------------------------------------------------------------
// Sampling

var sample = require('./lib/combinator/sample');

exports.sample = sample.sample;
exports.sampleWith = sample.sampleWith;

/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  signal's latest value will be propagated
 * @returns {Stream} sampled stream of values
 */
Stream.prototype.sampleWith = function(sampler) {
	return sample.sampleWith(sampler, this);
};

/**
 * When an event arrives on this stream, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @returns {Stream} stream of sampled and transformed values
 */
Stream.prototype.sample = function(f /* ...streams */) {
	return sample.sampleArray(f, this, base.tail(arguments));
};

//-----------------------------------------------------------------------
// Zipping

var zip = require('./lib/combinator/zip');

exports.zip = zip.zip;

/**
 * Pair-wise combine items with those in s. Given 2 streams:
 * [1,2,3] zipWith f [4,5,6] -> [f(1,4),f(2,5),f(3,6)]
 * Note: zip causes fast streams to buffer and wait for slow streams.
 * @param {function(a:Stream, b:Stream, ...):*} f function to combine items
 * @returns {Stream} new stream containing pairs
 */
Stream.prototype.zip = function(f /*, ...streams*/) {
	return zip.zipArray(f, base.replace(this, 0, arguments));
};

//-----------------------------------------------------------------------
// Switching

var switchLatest = require('./lib/combinator/switch').switch;

exports.switch       = switchLatest;
exports.switchLatest = switchLatest;

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @returns {Stream} switching stream
 */
Stream.prototype.switch = Stream.prototype.switchLatest = function() {
	return switchLatest(this);
};

//-----------------------------------------------------------------------
// Filtering

var filter = require('./lib/combinator/filter');

exports.filter          = filter.filter;
exports.skipRepeats     = exports.distinct   = filter.skipRepeats;
exports.skipRepeatsWith = exports.distinctBy = filter.skipRepeatsWith;

/**
 * Retain only items matching a predicate
 * stream:                           -12345678-
 * filter(x => x % 2 === 0, stream): --2-4-6-8-
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
Stream.prototype.filter = function(p) {
	return filter.filter(p, this);
};

/**
 * Skip repeated events, using === to compare items
 * stream:           -abbcd-
 * distinct(stream): -ab-cd-
 * @returns {Stream} stream with no repeated events
 */
Stream.prototype.skipRepeats = function() {
	return filter.skipRepeats(this);
};

/**
 * Skip repeated events, using supplied equals function to compare items
 * @param {function(a:*, b:*):boolean} equals function to compare items
 * @returns {Stream} stream with no repeated events
 */
Stream.prototype.skipRepeatsWith = function(equals) {
	return filter.skipRepeatsWith(equals, this);
};

//-----------------------------------------------------------------------
// Slicing

var slice = require('./lib/combinator/slice');

exports.take      = slice.take;
exports.skip      = slice.skip;
exports.slice     = slice.slice;
exports.takeWhile = slice.takeWhile;
exports.skipWhile = slice.skipWhile;

/**
 * stream:          -abcd-
 * take(2, stream): -ab|
 * @param {Number} n take up to this many events
 * @returns {Stream} stream containing at most the first n items from this stream
 */
Stream.prototype.take = function(n) {
	return slice.take(n, this);
};

/**
 * stream:          -abcd->
 * skip(2, stream): ---cd->
 * @param {Number} n skip this many events
 * @returns {Stream} stream not containing the first n events
 */
Stream.prototype.skip = function(n) {
	return slice.skip(n, this);
};

/**
 * Slice a stream by event index. Equivalent to, but more efficient than
 * stream.take(end).skip(start);
 * NOTE: Negative start and end are not supported
 * @param {Number} start skip all events before the start index
 * @param {Number} end allow all events from the start index to the end index
 * @returns {Stream} stream containing items where start <= index < end
 */
Stream.prototype.slice = function(start, end) {
	return slice.slice(start, end, this);
};

/**
 * stream:                        -123451234->
 * takeWhile(x => x < 5, stream): -1234|
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items up to, but not including, the
 * first item for which p returns falsy.
 */
Stream.prototype.takeWhile = function(p) {
	return slice.takeWhile(p, this);
};

/**
 * stream:                        -123451234->
 * skipWhile(x => x < 5, stream): -----51234->
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items following *and including* the
 * first item for which p returns falsy.
 */
Stream.prototype.skipWhile = function(p) {
	return slice.skipWhile(p, this);
};

//-----------------------------------------------------------------------
// Time slicing

var timeslice = require('./lib/combinator/timeslice');

exports.until  = exports.takeUntil = timeslice.takeUntil;
exports.since  = exports.skipUntil = timeslice.skipUntil;
exports.during = timeslice.during;

/**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -a-b-c-|
 * @param {Stream} signal retain only events in stream before the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur before
 * the first event in signal.
 */
Stream.prototype.until = Stream.prototype.takeUntil = function(signal) {
	return timeslice.takeUntil(signal, this);
};

/**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -------d-e-f-g->
 * @param {Stream} signal retain only events in stream at or after the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur after
 * the first event in signal.
 */
Stream.prototype.since = Stream.prototype.skipUntil = function(signal) {
	return timeslice.skipUntil(signal, this);
};

/**
 * stream:                    -a-b-c-d-e-f-g->
 * timeWindow:                -----s
 * s:                               -----t
 * stream.during(timeWindow): -----c-d-e-|
 * @param {Stream<Stream>} timeWindow a stream whose first event (s) represents
 *  the window start time.  That event (s) is itself a stream whose first event (t)
 *  represents the window end time
 * @returns {Stream} new stream containing only events within the provided timespan
 */
Stream.prototype.during = function(timeWindow) {
	return timeslice.during(timeWindow, this);
};

//-----------------------------------------------------------------------
// Delaying

var delay = require('./lib/combinator/delay').delay;

exports.delay = delay;

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
Stream.prototype.delay = function(delayTime) {
	return delay(delayTime, this);
};

//-----------------------------------------------------------------------
// Getting event timestamp

var timestamp = require('./lib/combinator/timestamp').timestamp;

exports.timestamp = timestamp;

/**
 * Expose event timestamps into the stream. Turns a Stream<X> into
 * Stream<{time:t, value:X}>
 * @returns {Stream<{time:number, value:*}>}
 */
Stream.prototype.timestamp = function() {
	return timestamp(this);
};

//-----------------------------------------------------------------------
// Rate limiting

var limit = require('./lib/combinator/limit');

exports.throttle = limit.throttle;
exports.debounce = limit.debounce;

/**
 * Limit the rate of events
 * stream:              abcd----abcd----
 * throttle(2, stream): a-c-----a-c-----
 * @param {Number} period time to suppress events
 * @returns {Stream} new stream that skips events for throttle period
 */
Stream.prototype.throttle = function(period) {
	return limit.throttle(period, this);
};

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * stream:              abcd----abcd----
 * debounce(2, stream): -----d-------d--
 * @param {Number} period events occuring more frequently than this
 *  on the provided scheduler will be suppressed
 * @returns {Stream} new debounced stream
 */
Stream.prototype.debounce = function(period) {
	return limit.debounce(period, this);
};

//-----------------------------------------------------------------------
// Awaiting Promises

var promises = require('./lib/combinator/promises');

exports.fromPromise = promises.fromPromise;
exports.await       = promises.awaitPromises;

/**
 * Await promises, turning a Stream<Promise<X>> into Stream<X>.  Preserves
 * event order, but timeshifts events based on promise resolution time.
 * @returns {Stream<X>} stream containing non-promise values
 */
Stream.prototype.await = function() {
	return promises.awaitPromises(this);
};

//-----------------------------------------------------------------------
// Error handling

var errors = require('./lib/combinator/errors');

exports.recoverWith  = errors.flatMapError;
exports.flatMapError = errors.flatMapError;
exports.throwError   = errors.throwError;

/**
 * If this stream encounters an error, recover and continue with items from stream
 * returned by f.
 * stream:                  -a-b-c-X-
 * f(X):                           d-e-f-g-
 * flatMapError(f, stream): -a-b-c-d-e-f-g-
 * @param {function(error:*):Stream} f function which returns a new stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */
Stream.prototype.recoverWith = Stream.prototype.flatMapError = function(f) {
	return errors.flatMapError(f, this);
};

//-----------------------------------------------------------------------
// Multicasting

var multicast = require('./lib/combinator/multicast').multicast;

exports.multicast = multicast;

/**
 * Transform the stream into multicast stream.  That means that many subscribers
 * to the stream will not cause multiple invocations of the internal machinery.
 * @returns {Stream} new stream which will multicast events to all observers.
 */
Stream.prototype.multicast = function() {
	return multicast(this);
};

},{"./lib/Stream":9,"./lib/base":10,"./lib/combinator/accumulate":11,"./lib/combinator/applicative":12,"./lib/combinator/build":13,"./lib/combinator/combine":14,"./lib/combinator/concatMap":15,"./lib/combinator/continueWith":16,"./lib/combinator/delay":17,"./lib/combinator/errors":18,"./lib/combinator/filter":19,"./lib/combinator/flatMap":20,"./lib/combinator/limit":21,"./lib/combinator/loop":22,"./lib/combinator/merge":23,"./lib/combinator/mergeConcurrently":24,"./lib/combinator/multicast":25,"./lib/combinator/observe":26,"./lib/combinator/promises":27,"./lib/combinator/sample":28,"./lib/combinator/slice":29,"./lib/combinator/switch":30,"./lib/combinator/timeslice":31,"./lib/combinator/timestamp":32,"./lib/combinator/transduce":33,"./lib/combinator/transform":34,"./lib/combinator/zip":35,"./lib/source/core":60,"./lib/source/create":61,"./lib/source/from":62,"./lib/source/fromEvent":64,"./lib/source/generate":66,"./lib/source/iterate":67,"./lib/source/periodic":68,"./lib/source/unfold":70}],72:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeEventsSelector = undefined;

var _domEvent = require('@most/dom-event');

var _select = require('./select');

var matchesSelector = undefined;
try {
  matchesSelector = require('matches-selector');
} catch (e) {
  matchesSelector = function matchesSelector() {};
}

var eventTypesThatDontBubble = ['load', 'unload', 'focus', 'blur', 'mouseenter', 'mouseleave', 'submit', 'change', 'reset'];

function maybeMutateEventPropagationAttributes(event) {
  if (!event.hasOwnProperty('propagationHasBeenStopped')) {
    (function () {
      event.propagationHasBeenStopped = false;
      var oldStopPropagation = event.stopPropagation;
      event.stopPropagation = function stopPropagation() {
        oldStopPropagation.call(this);
        this.propagationHasBeenStopped = true;
      };
    })();
  }
}

function mutateEventCurrentTarget(event, currentTargetElement) {
  try {
    Object.defineProperty(event, 'currentTarget', {
      value: currentTargetElement,
      configurable: true
    });
  } catch (err) {
    console.log('please use event.ownerTarget');
  }
  event.ownerTarget = currentTargetElement;
}

function makeSimulateBubbling(namespace, rootEl) {
  var isStrictlyInRootScope = (0, _select.makeIsStrictlyInRootScope)(namespace);
  var descendantSel = namespace.join(' ');
  var topSel = namespace.join('');
  var roof = rootEl.parentElement;

  return function simulateBubbling(ev) {
    maybeMutateEventPropagationAttributes(ev);
    if (ev.propagationHasBeenStopped) {
      return false;
    }
    for (var el = ev.target; el && el !== roof; el = el.parentElement) {
      if (!isStrictlyInRootScope(el)) {
        continue;
      }
      if (matchesSelector(el, descendantSel) || matchesSelector(el, topSel)) {
        mutateEventCurrentTarget(ev, el);
        return true;
      }
    }
    return false;
  };
}

var defaults = {
  useCapture: false
};

function makeEventsSelector(rootElement$, namespace) {
  return function eventsSelector(type) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? defaults : arguments[1];

    if (typeof type !== 'string') {
      throw new Error('DOM driver\'s events() expects argument to be a ' + 'string representing the event type to listen for.');
    }
    var useCapture = false;
    if (eventTypesThatDontBubble.indexOf(type) !== -1) {
      useCapture = true;
    }
    if (typeof options.useCapture === 'boolean') {
      useCapture = options.useCapture;
    }

    return rootElement$.map(function (rootElement) {
      return { rootElement: rootElement, namespace: namespace };
    }).skipRepeatsWith(function (prev, curr) {
      return prev.namespace.join('') === curr.namespace.join('');
    }).map(function (_ref) {
      var rootElement = _ref.rootElement;

      if (!namespace || namespace.length === 0) {
        return (0, _domEvent.domEvent)(type, rootElement, useCapture);
      }
      var simulateBubbling = makeSimulateBubbling(namespace, rootElement);
      return (0, _domEvent.domEvent)(type, rootElement, useCapture).filter(simulateBubbling);
    }).switch().multicast();
  };
}

exports.makeEventsSelector = makeEventsSelector;
},{"./select":81,"@most/dom-event":84,"matches-selector":87}],73:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _vnode = require('snabbdom/vnode');

var _vnode2 = _interopRequireDefault(_vnode);

var _is = require('snabbdom/is');

var _is2 = _interopRequireDefault(_is);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isObservable = function isObservable(x) {
  return typeof x.observe === 'function';
};

var addNSToObservable = function addNSToObservable(vNode) {
  addNS(vNode.data, vNode.children); // eslint-disable-line
};

function addNS(data, children) {
  data.ns = 'http://www.w3.org/2000/svg';
  if (typeof children !== 'undefined' && _is2.default.array(children)) {
    for (var i = 0; i < children.length; ++i) {
      if (isObservable(children[i])) {
        children[i] = children[i].tap(addNSToObservable);
      } else {
        addNS(children[i].data, children[i].children);
      }
    }
  }
}

/* eslint-disable */
function h(sel, b, c) {
  var data = {};
  var children = undefined;
  var text = undefined;
  var i = undefined;
  if (arguments.length === 3) {
    data = b;
    if (_is2.default.array(c)) {
      children = c;
    } else if (_is2.default.primitive(c)) {
      text = c;
    }
  } else if (arguments.length === 2) {
    if (_is2.default.array(b)) {
      children = b;
    } else if (_is2.default.primitive(b)) {
      text = b;
    } else {
      data = b;
    }
  }
  if (_is2.default.array(children)) {
    for (i = 0; i < children.length; ++i) {
      if (_is2.default.primitive(children[i])) {
        children[i] = (0, _vnode2.default)(undefined, undefined, undefined, children[i]);
      }
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children);
  }
  return (0, _vnode2.default)(sel, data, children, text, undefined);
}
/* eslint-enable */

exports.default = h;
},{"snabbdom/is":92,"snabbdom/vnode":99}],74:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockDOMSource = exports.makeDOMDriver = exports.video = exports.ul = exports.u = exports.tr = exports.title = exports.thead = exports.th = exports.tfoot = exports.textarea = exports.td = exports.tbody = exports.table = exports.sup = exports.sub = exports.style = exports.strong = exports.span = exports.source = exports.small = exports.select = exports.section = exports.script = exports.samp = exports.s = exports.ruby = exports.rt = exports.rp = exports.q = exports.pre = exports.param = exports.p = exports.option = exports.optgroup = exports.ol = exports.object = exports.noscript = exports.nav = exports.meta = exports.menu = exports.mark = exports.map = exports.main = exports.link = exports.li = exports.legend = exports.label = exports.keygen = exports.kbd = exports.ins = exports.input = exports.img = exports.iframe = exports.i = exports.html = exports.hr = exports.hgroup = exports.header = exports.head = exports.h6 = exports.h5 = exports.h4 = exports.h3 = exports.h2 = exports.h1 = exports.form = exports.footer = exports.figure = exports.figcaption = exports.fieldset = exports.embed = exports.em = exports.dt = exports.dl = exports.div = exports.dir = exports.dfn = exports.del = exports.dd = exports.colgroup = exports.col = exports.code = exports.cite = exports.caption = exports.canvas = exports.button = exports.br = exports.body = exports.blockquote = exports.bdo = exports.bdi = exports.base = exports.b = exports.audio = exports.aside = exports.article = exports.area = exports.address = exports.abbr = exports.a = exports.h = exports.thunk = exports.modules = undefined;

var _makeDOMDriver = require('./makeDOMDriver');

Object.defineProperty(exports, 'makeDOMDriver', {
  enumerable: true,
  get: function get() {
    return _makeDOMDriver.makeDOMDriver;
  }
});

var _mockDOMSource = require('./mockDOMSource');

Object.defineProperty(exports, 'mockDOMSource', {
  enumerable: true,
  get: function get() {
    return _mockDOMSource.mockDOMSource;
  }
});

var _modules = require('./modules');

var modules = _interopRequireWildcard(_modules);

var _thunk = require('snabbdom/thunk');

var _thunk2 = _interopRequireDefault(_thunk);

var _hyperscript = require('./hyperscript');

var _hyperscript2 = _interopRequireDefault(_hyperscript);

var _hyperscriptHelpers = require('hyperscript-helpers');

var _hyperscriptHelpers2 = _interopRequireDefault(_hyperscriptHelpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.modules = modules;
exports.thunk = _thunk2.default;
exports.h = _hyperscript2.default;

var _hh = (0, _hyperscriptHelpers2.default)(_hyperscript2.default);

var a = _hh.a;
var abbr = _hh.abbr;
var address = _hh.address;
var area = _hh.area;
var article = _hh.article;
var aside = _hh.aside;
var audio = _hh.audio;
var b = _hh.b;
var base = _hh.base;
var bdi = _hh.bdi;
var bdo = _hh.bdo;
var blockquote = _hh.blockquote;
var body = _hh.body;
var br = _hh.br;
var button = _hh.button;
var canvas = _hh.canvas;
var caption = _hh.caption;
var cite = _hh.cite;
var code = _hh.code;
var col = _hh.col;
var colgroup = _hh.colgroup;
var dd = _hh.dd;
var del = _hh.del;
var dfn = _hh.dfn;
var dir = _hh.dir;
var div = _hh.div;
var dl = _hh.dl;
var dt = _hh.dt;
var em = _hh.em;
var embed = _hh.embed;
var fieldset = _hh.fieldset;
var figcaption = _hh.figcaption;
var figure = _hh.figure;
var footer = _hh.footer;
var form = _hh.form;
var h1 = _hh.h1;
var h2 = _hh.h2;
var h3 = _hh.h3;
var h4 = _hh.h4;
var h5 = _hh.h5;
var h6 = _hh.h6;
var head = _hh.head;
var header = _hh.header;
var hgroup = _hh.hgroup;
var hr = _hh.hr;
var html = _hh.html;
var i = _hh.i;
var iframe = _hh.iframe;
var img = _hh.img;
var input = _hh.input;
var ins = _hh.ins;
var kbd = _hh.kbd;
var keygen = _hh.keygen;
var label = _hh.label;
var legend = _hh.legend;
var li = _hh.li;
var link = _hh.link;
var main = _hh.main;
var map = _hh.map;
var mark = _hh.mark;
var menu = _hh.menu;
var meta = _hh.meta;
var nav = _hh.nav;
var noscript = _hh.noscript;
var object = _hh.object;
var ol = _hh.ol;
var optgroup = _hh.optgroup;
var option = _hh.option;
var p = _hh.p;
var param = _hh.param;
var pre = _hh.pre;
var q = _hh.q;
var rp = _hh.rp;
var rt = _hh.rt;
var ruby = _hh.ruby;
var s = _hh.s;
var samp = _hh.samp;
var script = _hh.script;
var section = _hh.section;
var select = _hh.select;
var small = _hh.small;
var source = _hh.source;
var span = _hh.span;
var strong = _hh.strong;
var style = _hh.style;
var sub = _hh.sub;
var sup = _hh.sup;
var table = _hh.table;
var tbody = _hh.tbody;
var td = _hh.td;
var textarea = _hh.textarea;
var tfoot = _hh.tfoot;
var th = _hh.th;
var thead = _hh.thead;
var title = _hh.title;
var tr = _hh.tr;
var u = _hh.u;
var ul = _hh.ul;
var video = _hh.video;
exports.a = a;
exports.abbr = abbr;
exports.address = address;
exports.area = area;
exports.article = article;
exports.aside = aside;
exports.audio = audio;
exports.b = b;
exports.base = base;
exports.bdi = bdi;
exports.bdo = bdo;
exports.blockquote = blockquote;
exports.body = body;
exports.br = br;
exports.button = button;
exports.canvas = canvas;
exports.caption = caption;
exports.cite = cite;
exports.code = code;
exports.col = col;
exports.colgroup = colgroup;
exports.dd = dd;
exports.del = del;
exports.dfn = dfn;
exports.dir = dir;
exports.div = div;
exports.dl = dl;
exports.dt = dt;
exports.em = em;
exports.embed = embed;
exports.fieldset = fieldset;
exports.figcaption = figcaption;
exports.figure = figure;
exports.footer = footer;
exports.form = form;
exports.h1 = h1;
exports.h2 = h2;
exports.h3 = h3;
exports.h4 = h4;
exports.h5 = h5;
exports.h6 = h6;
exports.head = head;
exports.header = header;
exports.hgroup = hgroup;
exports.hr = hr;
exports.html = html;
exports.i = i;
exports.iframe = iframe;
exports.img = img;
exports.input = input;
exports.ins = ins;
exports.kbd = kbd;
exports.keygen = keygen;
exports.label = label;
exports.legend = legend;
exports.li = li;
exports.link = link;
exports.main = main;
exports.map = map;
exports.mark = mark;
exports.menu = menu;
exports.meta = meta;
exports.nav = nav;
exports.noscript = noscript;
exports.object = object;
exports.ol = ol;
exports.optgroup = optgroup;
exports.option = option;
exports.p = p;
exports.param = param;
exports.pre = pre;
exports.q = q;
exports.rp = rp;
exports.rt = rt;
exports.ruby = ruby;
exports.s = s;
exports.samp = samp;
exports.script = script;
exports.section = section;
exports.select = select;
exports.small = small;
exports.source = source;
exports.span = span;
exports.strong = strong;
exports.style = style;
exports.sub = sub;
exports.sup = sup;
exports.table = table;
exports.tbody = tbody;
exports.td = td;
exports.textarea = textarea;
exports.tfoot = tfoot;
exports.th = th;
exports.thead = thead;
exports.title = title;
exports.tr = tr;
exports.u = u;
exports.ul = ul;
exports.video = video;
},{"./hyperscript":73,"./makeDOMDriver":76,"./mockDOMSource":77,"./modules":79,"hyperscript-helpers":86,"snabbdom/thunk":98}],75:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isolateSource = exports.isolateSink = undefined;

var _utils = require('./utils');

var isolateSource = function isolateSource(source_, scope) {
  return source_.select('.' + _utils.SCOPE_PREFIX + scope);
};

var isolateSink = function isolateSink(sink, scope) {
  return sink.map(function (vTree) {
    if (vTree.sel.indexOf('' + _utils.SCOPE_PREFIX + scope) === -1) {
      if (vTree.data.ns) {
        // svg elements
        var _vTree$data$attrs = vTree.data.attrs;
        var attrs = _vTree$data$attrs === undefined ? {} : _vTree$data$attrs;

        attrs.class = (attrs.class || '') + ' ' + _utils.SCOPE_PREFIX + scope;
      } else {
        vTree.sel = vTree.sel + '.' + _utils.SCOPE_PREFIX + scope;
      }
    }
    return vTree;
  });
};

exports.isolateSink = isolateSink;
exports.isolateSource = isolateSource;
},{"./utils":83}],76:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeDOMDriver = undefined;

var _hold = require('@most/hold');

var _hold2 = _interopRequireDefault(_hold);

var _snabbdom = require('snabbdom');

var _h = require('snabbdom/h');

var _h2 = _interopRequireDefault(_h);

var _classNameFromVNode = require('snabbdom-selector/lib/classNameFromVNode');

var _classNameFromVNode2 = _interopRequireDefault(_classNameFromVNode);

var _selectorParser2 = require('snabbdom-selector/lib/selectorParser');

var _selectorParser3 = _interopRequireDefault(_selectorParser2);

var _utils = require('./utils');

var _modules = require('./modules');

var _modules2 = _interopRequireDefault(_modules);

var _transposition = require('./transposition');

var _isolate = require('./isolate');

var _select = require('./select');

var _events = require('./events');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function makeVNodeWrapper(rootElement) {
  return function vNodeWrapper(vNode) {
    var _selectorParser = (0, _selectorParser3.default)(vNode.sel);

    var selectorTagName = _selectorParser.tagName;
    var selectorId = _selectorParser.id;

    var vNodeClassName = (0, _classNameFromVNode2.default)(vNode);
    var _vNode$data = vNode.data;
    var vNodeData = _vNode$data === undefined ? {} : _vNode$data;
    var _vNodeData$props = vNodeData.props;
    var vNodeDataProps = _vNodeData$props === undefined ? {} : _vNodeData$props;
    var _vNodeDataProps$id = vNodeDataProps.id;
    var vNodeId = _vNodeDataProps$id === undefined ? selectorId : _vNodeDataProps$id;

    var isVNodeAndRootElementIdentical = vNodeId.toUpperCase() === rootElement.id.toUpperCase() && selectorTagName.toUpperCase() === rootElement.tagName.toUpperCase() && vNodeClassName.toUpperCase() === rootElement.className.toUpperCase();

    if (isVNodeAndRootElementIdentical) {
      return vNode;
    }

    var tagName = rootElement.tagName;
    var id = rootElement.id;
    var className = rootElement.className;

    var elementId = id ? '#' + id : '';
    var elementClassName = className ? '.' + className.split(' ').join('.') : '';
    return (0, _h2.default)('' + tagName + elementId + elementClassName, {}, [vNode]);
  };
}

function DOMDriverInputGuard(view$) {
  if (!view$ || typeof view$.observe !== 'function') {
    throw new Error('The DOM driver function expects as input an ' + 'Observable of virtual DOM elements');
  }
}

var defaults = {
  modules: _modules2.default
};

function makeDOMDriver(container) {
  var _ref = arguments.length <= 1 || arguments[1] === undefined ? defaults : arguments[1];

  var _ref$modules = _ref.modules;
  var modules = _ref$modules === undefined ? _modules2.default : _ref$modules;

  var patch = (0, _snabbdom.init)(modules);
  var rootElement = (0, _utils.domSelectorParser)(container);

  if (!Array.isArray(modules)) {
    throw new Error('Optional modules option must be ' + 'an array for snabbdom modules');
  }

  function DOMDriver(view$) {
    DOMDriverInputGuard(view$);

    var rootElement$ = (0, _hold2.default)(view$.map(_transposition.transposeVTree).switch().map(makeVNodeWrapper(rootElement)).scan(patch, rootElement).skip(1).map(function (_ref2) {
      var elm = _ref2.elm;
      return elm;
    }));

    rootElement$.drain();

    return {
      observable: rootElement$,
      namespace: [],
      select: (0, _select.makeElementSelector)(rootElement$),
      events: (0, _events.makeEventsSelector)(rootElement$),
      isolateSink: _isolate.isolateSink,
      isolateSource: _isolate.isolateSource
    };
  }

  return DOMDriver;
}

exports.makeDOMDriver = makeDOMDriver;
},{"./events":72,"./isolate":75,"./modules":79,"./select":81,"./transposition":82,"./utils":83,"@most/hold":85,"snabbdom":97,"snabbdom-selector/lib/classNameFromVNode":88,"snabbdom-selector/lib/selectorParser":89,"snabbdom/h":91}],77:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mockDOMSource = undefined;

var _most = require('most');

var _most2 = _interopRequireDefault(_most);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var emptyStream = _most2.default.empty();

function getEventsStreamForSelector(mockedEventTypes) {
  return function getEventsStream(eventType) {
    for (var key in mockedEventTypes) {
      if (mockedEventTypes.hasOwnProperty(key) && key === eventType) {
        return mockedEventTypes[key];
      }
    }
    return emptyStream;
  };
}

function mockDOMSource() {
  var mockedSelectors = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

  return {
    select: function select(selector) {
      for (var key in mockedSelectors) {
        if (mockedSelectors.hasOwnProperty(key) && key === selector) {
          var observable = emptyStream;
          if (mockedSelectors[key].hasOwnProperty('observable')) {
            observable = mockedSelectors[key].observable;
          }
          return {
            observable: observable,
            events: getEventsStreamForSelector(mockedSelectors[key])
          };
        }
      }
      return {
        observable: emptyStream,
        events: function events() {
          return emptyStream;
        }
      };
    }
  };
}

exports.mockDOMSource = mockDOMSource;
},{"most":165}],78:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var raf = undefined;
if (typeof window !== 'undefined') {
  raf = window && window.requestAnimationFrame || setTimeout;
} else {
  raf = setTimeout;
}

var nextFrame = function nextFrame(fn) {
  return raf(function () {
    return raf(fn);
  });
};
/* eslint-disable */
function setNextFrame(obj, prop, val) {
  nextFrame(function () {
    obj[prop] = val;
  });
}

function getTextNodeRect(textNode) {
  var rect;
  if (document.createRange) {
    var range = document.createRange();
    range.selectNodeContents(textNode);
    if (range.getBoundingClientRect) {
      rect = range.getBoundingClientRect();
    }
  }
  return rect;
}

function calcTransformOrigin(isTextNode, textRect, boundingRect) {
  if (isTextNode) {
    if (textRect) {
      //calculate pixels to center of text from left edge of bounding box
      var relativeCenterX = textRect.left + textRect.width / 2 - boundingRect.left;
      var relativeCenterY = textRect.top + textRect.height / 2 - boundingRect.top;
      return relativeCenterX + 'px ' + relativeCenterY + 'px';
    }
  }
  return '0 0'; //top left
}

function getTextDx(oldTextRect, newTextRect) {
  if (oldTextRect && newTextRect) {
    return oldTextRect.left + oldTextRect.width / 2 - (newTextRect.left + newTextRect.width / 2);
  }
  return 0;
}
function getTextDy(oldTextRect, newTextRect) {
  if (oldTextRect && newTextRect) {
    return oldTextRect.top + oldTextRect.height / 2 - (newTextRect.top + newTextRect.height / 2);
  }
  return 0;
}

function isTextElement(elm) {
  return elm.childNodes.length === 1 && elm.childNodes[0].nodeType === 3;
}

var removed, created;

function pre(oldVnode, vnode) {
  removed = {};
  created = [];
}

function create(oldVnode, vnode) {
  var hero = vnode.data.hero;
  if (hero && hero.id) {
    created.push(hero.id);
    created.push(vnode);
  }
}

function destroy(vnode) {
  var hero = vnode.data.hero;
  if (hero && hero.id) {
    var elm = vnode.elm;
    vnode.isTextNode = isTextElement(elm); //is this a text node?
    vnode.boundingRect = elm.getBoundingClientRect(); //save the bounding rectangle to a new property on the vnode
    vnode.textRect = vnode.isTextNode ? getTextNodeRect(elm.childNodes[0]) : null; //save bounding rect of inner text node
    var computedStyle = window.getComputedStyle(elm, null); //get current styles (includes inherited properties)
    vnode.savedStyle = JSON.parse(JSON.stringify(computedStyle)); //save a copy of computed style values
    removed[hero.id] = vnode;
  }
}

function post() {
  var i, id, newElm, oldVnode, oldElm, hRatio, wRatio, oldRect, newRect, dx, dy, origTransform, origTransition, newStyle, oldStyle, newComputedStyle, isTextNode, newTextRect, oldTextRect;
  for (i = 0; i < created.length; i += 2) {
    id = created[i];
    newElm = created[i + 1].elm;
    oldVnode = removed[id];
    if (oldVnode) {
      isTextNode = oldVnode.isTextNode && isTextElement(newElm); //Are old & new both text?
      newStyle = newElm.style;
      newComputedStyle = window.getComputedStyle(newElm, null); //get full computed style for new element
      oldElm = oldVnode.elm;
      oldStyle = oldElm.style;
      //Overall element bounding boxes
      newRect = newElm.getBoundingClientRect();
      oldRect = oldVnode.boundingRect; //previously saved bounding rect
      //Text node bounding boxes & distances
      if (isTextNode) {
        newTextRect = getTextNodeRect(newElm.childNodes[0]);
        oldTextRect = oldVnode.textRect;
        dx = getTextDx(oldTextRect, newTextRect);
        dy = getTextDy(oldTextRect, newTextRect);
      } else {
        //Calculate distances between old & new positions
        dx = oldRect.left - newRect.left;
        dy = oldRect.top - newRect.top;
      }
      hRatio = newRect.height / Math.max(oldRect.height, 1);
      wRatio = isTextNode ? hRatio : newRect.width / Math.max(oldRect.width, 1); //text scales based on hRatio
      // Animate new element
      origTransform = newStyle.transform;
      origTransition = newStyle.transition;
      if (newComputedStyle.display === 'inline') //inline elements cannot be transformed
        newStyle.display = 'inline-block'; //this does not appear to have any negative side effects
      newStyle.transition = origTransition + 'transform 0s';
      newStyle.transformOrigin = calcTransformOrigin(isTextNode, newTextRect, newRect);
      newStyle.opacity = '0';
      newStyle.transform = origTransform + 'translate(' + dx + 'px, ' + dy + 'px) ' + 'scale(' + 1 / wRatio + ', ' + 1 / hRatio + ')';
      setNextFrame(newStyle, 'transition', origTransition);
      setNextFrame(newStyle, 'transform', origTransform);
      setNextFrame(newStyle, 'opacity', '1');
      // Animate old element
      for (var key in oldVnode.savedStyle) {
        //re-apply saved inherited properties
        if (parseInt(key) != key) {
          var ms = key.substring(0, 2) === 'ms';
          var moz = key.substring(0, 3) === 'moz';
          var webkit = key.substring(0, 6) === 'webkit';
          if (!ms && !moz && !webkit) //ignore prefixed style properties
            oldStyle[key] = oldVnode.savedStyle[key];
        }
      }
      oldStyle.position = 'absolute';
      oldStyle.top = oldRect.top + 'px'; //start at existing position
      oldStyle.left = oldRect.left + 'px';
      oldStyle.width = oldRect.width + 'px'; //Needed for elements who were sized relative to their parents
      oldStyle.height = oldRect.height + 'px'; //Needed for elements who were sized relative to their parents
      oldStyle.margin = 0; //Margin on hero element leads to incorrect positioning
      oldStyle.transformOrigin = calcTransformOrigin(isTextNode, oldTextRect, oldRect);
      oldStyle.transform = '';
      oldStyle.opacity = '1';
      document.body.appendChild(oldElm);
      setNextFrame(oldStyle, 'transform', 'translate(' + -dx + 'px, ' + -dy + 'px) scale(' + wRatio + ', ' + hRatio + ')'); //scale must be on far right for translate to be correct
      setNextFrame(oldStyle, 'opacity', '0');
      oldElm.addEventListener('transitionend', function (ev) {
        if (ev.propertyName === 'transform') document.body.removeChild(ev.target);
      });
    }
  }
  removed = created = undefined;
}
/* eslint-enable */

var HeroModule = {
  pre: pre,
  create: create,
  destroy: destroy,
  post: post
};

exports.HeroModule = HeroModule;
},{}],79:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.EventsModule = exports.HeroModule = exports.AttrsModule = exports.PropsModule = exports.ClassModule = exports.StyleModule = undefined;

var _class = require('snabbdom/modules/class');

var _class2 = _interopRequireDefault(_class);

var _props = require('snabbdom/modules/props');

var _props2 = _interopRequireDefault(_props);

var _attributes = require('snabbdom/modules/attributes');

var _attributes2 = _interopRequireDefault(_attributes);

var _eventlisteners = require('snabbdom/modules/eventlisteners');

var _eventlisteners2 = _interopRequireDefault(_eventlisteners);

var _styleModule = require('./style-module');

var _heroModule = require('./hero-module');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = [_styleModule.StyleModule, _class2.default, _props2.default, _attributes2.default];
exports.StyleModule = _styleModule.StyleModule;
exports.ClassModule = _class2.default;
exports.PropsModule = _props2.default;
exports.AttrsModule = _attributes2.default;
exports.HeroModule = _heroModule.HeroModule;
exports.EventsModule = _eventlisteners2.default;
},{"./hero-module":78,"./style-module":80,"snabbdom/modules/attributes":93,"snabbdom/modules/class":94,"snabbdom/modules/eventlisteners":95,"snabbdom/modules/props":96}],80:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var raf = undefined;
if (typeof window !== 'undefined') {
  raf = window && window.requestAnimationFrame || setTimeout;
} else {
  raf = setTimeout;
}

var nextFrame = function nextFrame(fn) {
  return raf(function () {
    return raf(fn);
  });
};

function setNextFrame(obj, prop, val) {
  nextFrame(function () {
    obj[prop] = val;
  });
}
/* eslint-disable */
function updateStyle(oldVnode, vnode) {
  var cur,
      name,
      elm = vnode.elm,
      oldStyle = oldVnode.data.style || {},
      style = vnode.data.style || {},
      oldHasDel = 'delayed' in oldStyle;
  for (name in oldStyle) {
    if (!style[name]) {
      elm.style[name] = '';
    }
  }
  for (name in style) {
    cur = style[name];
    if (name === 'delayed') {
      for (name in style.delayed) {
        cur = style.delayed[name];
        if (!oldHasDel || cur !== oldStyle.delayed[name]) {
          setNextFrame(elm.style, name, cur);
        }
      }
    } else if (name !== 'remove' && cur !== oldStyle[name]) {
      elm.style[name] = cur;
    }
  }
}

function applyDestroyStyle(vnode) {
  var style,
      name,
      elm = vnode.elm,
      s = vnode.data.style;
  if (!s || !(style = s.destroy)) return;
  for (name in style) {
    elm.style[name] = style[name];
  }
}

function applyRemoveStyle(vnode, rm) {
  var s = vnode.data.style;
  if (!s || !s.remove) {
    rm();
    return;
  }
  var name,
      elm = vnode.elm,
      idx,
      i = 0,
      maxDur = 0,
      compStyle,
      style = s.remove,
      amount = 0,
      applied = [];
  for (name in style) {
    applied.push(name);
    elm.style[name] = style[name];
  }
  compStyle = getComputedStyle(elm);
  var props = compStyle['transition-property'].split(', ');
  for (; i < props.length; ++i) {
    if (applied.indexOf(props[i]) !== -1) amount++;
  }
  elm.addEventListener('transitionend', function (ev) {
    if (ev.target === elm) --amount;
    if (amount === 0) rm();
  });
}
/* eslint-enable */

var StyleModule = {
  create: updateStyle,
  update: updateStyle,
  destroy: applyDestroyStyle,
  remove: applyRemoveStyle
};

exports.StyleModule = StyleModule;
},{}],81:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makeIsStrictlyInRootScope = exports.makeElementSelector = undefined;

var _events = require('./events');

var _isolate = require('./isolate');

function makeIsStrictlyInRootScope(namespace) {
  var classIsForeign = function classIsForeign(c) {
    var matched = c.match(/cycle-scope-(\S+)/);
    return matched && namespace.indexOf('.' + c) === -1;
  };
  var classIsDomestic = function classIsDomestic(c) {
    var matched = c.match(/cycle-scope-(\S+)/);
    return matched && namespace.indexOf('.' + c) !== -1;
  };
  return function isStrictlyInRootScope(leaf) {
    var some = Array.prototype.some;
    var split = String.prototype.split;
    for (var el = leaf; el; el = el.parentElement) {
      var classList = el.classList || split.call(el.className, ' ');
      if (some.call(classList, classIsDomestic)) {
        return true;
      }
      if (some.call(classList, classIsForeign)) {
        return false;
      }
    }
    return true;
  };
}

var isValidString = function isValidString(param) {
  return typeof param === 'string' && param.length > 0;
};

var contains = function contains(str, match) {
  return str.indexOf(match) > -1;
};

var isNotTagName = function isNotTagName(param) {
  return isValidString(param) && contains(param, '.') || contains(param, '#') || contains(param, ':');
};

function sortNamespace(a, b) {
  if (isNotTagName(a) && isNotTagName(b)) {
    return 0;
  }
  return isNotTagName(a) ? 1 : -1;
}

function removeDuplicates(arr) {
  var newArray = [];
  arr.forEach(function (element) {
    if (newArray.indexOf(element) === -1) {
      newArray.push(element);
    }
  });
  return newArray;
}

var getScope = function getScope(namespace) {
  return namespace.filter(function (c) {
    return c.indexOf('.cycle-scope') > -1;
  });
};

function makeFindElements(namespace) {
  return function findElements(rootElement) {
    if (namespace.join('') === '') {
      return rootElement;
    }
    var slice = Array.prototype.slice;

    var scope = getScope(namespace);
    // Uses global selector && is isolated
    if (namespace.indexOf('*') > -1 && scope.length > 0) {
      // grab top-level boundary of scope
      var topNode = rootElement.querySelector(scope.join(' '));
      // grab all children
      var childNodes = topNode.getElementsByTagName('*');
      return removeDuplicates([topNode].concat(slice.call(childNodes))).filter(makeIsStrictlyInRootScope(namespace));
    }

    return removeDuplicates(slice.call(rootElement.querySelectorAll(namespace.join(' '))).concat(slice.call(rootElement.querySelectorAll(namespace.join(''))))).filter(makeIsStrictlyInRootScope(namespace));
  };
}

function makeElementSelector(rootElement$) {
  return function elementSelector(selector) {
    if (typeof selector !== 'string') {
      throw new Error('DOM driver\'s select() expects the argument to be a ' + 'string as a CSS selector');
    }

    var namespace = this.namespace;
    var trimmedSelector = selector.trim();
    var childNamespace = trimmedSelector === ':root' ? namespace : namespace.concat(trimmedSelector).sort(sortNamespace);

    return {
      observable: rootElement$.map(makeFindElements(childNamespace)),
      namespace: childNamespace,
      select: makeElementSelector(rootElement$),
      events: (0, _events.makeEventsSelector)(rootElement$, childNamespace),
      isolateSource: _isolate.isolateSource,
      isolateSink: _isolate.isolateSink
    };
  };
}

exports.makeElementSelector = makeElementSelector;
exports.makeIsStrictlyInRootScope = makeIsStrictlyInRootScope;
},{"./events":72,"./isolate":75}],82:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transposeVTree = undefined;

var _most = require('most');

var _most2 = _interopRequireDefault(_most);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createVTree(vTree, children) {
  return {
    sel: vTree.sel,
    data: vTree.data,
    text: vTree.text,
    elm: vTree.elm,
    key: vTree.key,
    children: children
  };
}

function transposeVTree(vTree) {
  if (!vTree) {
    return null;
  } else if (vTree && typeof vTree.data === 'object' && vTree.data.static) {
    return _most2.default.just(vTree);
  } else if (typeof vTree.observe === 'function') {
    return vTree.map(transposeVTree).switch();
  } else if (typeof vTree === 'object') {
    if (!vTree.children || vTree.children.length === 0) {
      return _most2.default.just(vTree);
    }

    var vTreeChildren = vTree.children.map(transposeVTree).filter(function (x) {
      return x !== null;
    });

    return vTreeChildren.length === 0 ? _most2.default.just(createVTree(vTree, vTreeChildren)) : _most2.default.combineArray(function () {
      for (var _len = arguments.length, children = Array(_len), _key = 0; _key < _len; _key++) {
        children[_key] = arguments[_key];
      }

      return createVTree(vTree, children);
    }, vTreeChildren);
  } else {
    throw new Error('Unhandled vTree Value');
  }
}

exports.transposeVTree = transposeVTree;
},{"most":165}],83:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var SCOPE_PREFIX = "cycle-scope-";

var isElement = function isElement(obj) {
  return typeof HTMLElement === "object" ? obj instanceof HTMLElement || obj instanceof DocumentFragment : obj && typeof obj === "object" && obj !== null && (obj.nodeType === 1 || obj.nodeType === 11) && typeof obj.nodeName === "string";
};

var domSelectorParser = function domSelectorParser(selectors) {
  var domElement = typeof selectors === "string" ? document.querySelector(selectors) : selectors;

  if (typeof domElement === "string" && domElement === null) {
    throw new Error("Cannot render into unknown element `" + selectors + "`");
  } else if (!isElement(domElement)) {
    throw new Error("Given container is not a DOM element neither a " + "selector string.");
  }
  return domElement;
};

exports.domSelectorParser = domSelectorParser;
exports.SCOPE_PREFIX = SCOPE_PREFIX;
},{}],84:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define('@most/dom-event', ['exports', 'most'], factory);
    } else if (typeof exports !== "undefined") {
        factory(exports, require('most'));
    } else {
        var mod = {
            exports: {}
        };
        factory(mod.exports, global.most);
        global.mostDomEvent = mod.exports;
    }
})(this, function (exports, _most) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.touchcancel = exports.touchmove = exports.touchend = exports.touchstart = exports.pointerleave = exports.pointerout = exports.pointerenter = exports.pointerover = exports.pointermove = exports.pointerup = exports.pointerdown = exports.unload = exports.load = exports.popstate = exports.hashchange = exports.error = exports.scroll = exports.resize = exports.contextmenu = exports.input = exports.keyup = exports.keypress = exports.keydown = exports.submit = exports.select = exports.change = exports.mouseleave = exports.mouseout = exports.mouseenter = exports.mouseover = exports.mousemove = exports.mouseup = exports.mousedown = exports.dblclick = exports.click = exports.focusout = exports.focusin = exports.focus = exports.blur = exports.domEvent = undefined;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var domEvent = function domEvent(event, node) {
        var capture = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];
        return new _most.Stream(new DomEvent(event, node, capture));
    };

    var blur = function blur(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('blur', node, capture);
    };

    var focus = function focus(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('focus', node, capture);
    };

    var focusin = function focusin(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('focusin', node, capture);
    };

    var focusout = function focusout(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('focusout', node, capture);
    };

    var click = function click(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('click', node, capture);
    };

    var dblclick = function dblclick(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('dblclick', node, capture);
    };

    var mousedown = function mousedown(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('mousedown', node, capture);
    };

    var mouseup = function mouseup(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('mouseup', node, capture);
    };

    var mousemove = function mousemove(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('mousemove', node, capture);
    };

    var mouseover = function mouseover(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('mouseover', node, capture);
    };

    var mouseenter = function mouseenter(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('mouseenter', node, capture);
    };

    var mouseout = function mouseout(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('mouseout', node, capture);
    };

    var mouseleave = function mouseleave(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('mouseleave', node, capture);
    };

    var change = function change(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('change', node, capture);
    };

    var select = function select(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('select', node, capture);
    };

    var submit = function submit(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('submit', node, capture);
    };

    var keydown = function keydown(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('keydown', node, capture);
    };

    var keypress = function keypress(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('keypress', node, capture);
    };

    var keyup = function keyup(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('keyup', node, capture);
    };

    var input = function input(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('input', node, capture);
    };

    var contextmenu = function contextmenu(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('contextmenu', node, capture);
    };

    var resize = function resize(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('resize', node, capture);
    };

    var scroll = function scroll(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('scroll', node, capture);
    };

    var error = function error(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('error', node, capture);
    };

    var hashchange = function hashchange(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('hashchange', node, capture);
    };

    var popstate = function popstate(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('popstate', node, capture);
    };

    var load = function load(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('load', node, capture);
    };

    var unload = function unload(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('unload', node, capture);
    };

    var pointerdown = function pointerdown(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('pointerdown', node, capture);
    };

    var pointerup = function pointerup(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('pointerup', node, capture);
    };

    var pointermove = function pointermove(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('pointermove', node, capture);
    };

    var pointerover = function pointerover(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('pointerover', node, capture);
    };

    var pointerenter = function pointerenter(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('pointerenter', node, capture);
    };

    var pointerout = function pointerout(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('pointerout', node, capture);
    };

    var pointerleave = function pointerleave(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('pointerleave', node, capture);
    };

    var touchstart = function touchstart(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('touchstart', node, capture);
    };

    var touchend = function touchend(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('touchend', node, capture);
    };

    var touchmove = function touchmove(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('touchmove', node, capture);
    };

    var touchcancel = function touchcancel(node) {
        var capture = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
        return domEvent('touchcancel', node, capture);
    };

    var DomEvent = function () {
        function DomEvent(event, node, capture) {
            _classCallCheck(this, DomEvent);

            this.event = event;
            this.node = node;
            this.capture = capture;
        }

        _createClass(DomEvent, [{
            key: 'run',
            value: function run(sink, scheduler) {
                var _this = this;

                var send = function send(e) {
                    return tryEvent(scheduler.now(), e, sink);
                };

                var dispose = function dispose() {
                    return _this.node.removeEventListener(_this.event, send, _this.capture);
                };

                this.node.addEventListener(this.event, send, this.capture);
                return {
                    dispose: dispose
                };
            }
        }]);

        return DomEvent;
    }();

    function tryEvent(t, x, sink) {
        try {
            sink.event(t, x);
        } catch (e) {
            sink.error(t, e);
        }
    }

    exports.domEvent = domEvent;
    exports.blur = blur;
    exports.focus = focus;
    exports.focusin = focusin;
    exports.focusout = focusout;
    exports.click = click;
    exports.dblclick = dblclick;
    exports.mousedown = mousedown;
    exports.mouseup = mouseup;
    exports.mousemove = mousemove;
    exports.mouseover = mouseover;
    exports.mouseenter = mouseenter;
    exports.mouseout = mouseout;
    exports.mouseleave = mouseleave;
    exports.change = change;
    exports.select = select;
    exports.submit = submit;
    exports.keydown = keydown;
    exports.keypress = keypress;
    exports.keyup = keyup;
    exports.input = input;
    exports.contextmenu = contextmenu;
    exports.resize = resize;
    exports.scroll = scroll;
    exports.error = error;
    exports.hashchange = hashchange;
    exports.popstate = popstate;
    exports.load = load;
    exports.unload = unload;
    exports.pointerdown = pointerdown;
    exports.pointerup = pointerup;
    exports.pointermove = pointermove;
    exports.pointerover = pointerover;
    exports.pointerenter = pointerenter;
    exports.pointerout = pointerout;
    exports.pointerleave = pointerleave;
    exports.touchstart = touchstart;
    exports.touchend = touchend;
    exports.touchmove = touchmove;
    exports.touchcancel = touchcancel;
});

},{"most":165}],85:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2,"most/lib/source/MulticastSource":152}],86:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var isValidString = function isValidString(param) {
  return typeof param === 'string' && param.length > 0;
};

var startsWith = function startsWith(string, start) {
  return string[0] === start;
};

var isSelector = function isSelector(param) {
  return isValidString(param) && (startsWith(param, '.') || startsWith(param, '#'));
};

var node = function node(h) {
  return function (tagName) {
    return function (first) {
      for (var _len = arguments.length, rest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        rest[_key - 1] = arguments[_key];
      }

      if (isSelector(first)) {
        return h.apply(undefined, [tagName + first].concat(rest));
      } else {
        return h.apply(undefined, [tagName, first].concat(rest));
      }
    };
  };
};

var TAG_NAMES = ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'dd', 'del', 'dfn', 'dir', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'menu', 'meta', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'p', 'param', 'pre', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'title', 'tr', 'u', 'ul', 'video'];

exports['default'] = function (h) {
  var createTag = node(h);
  var exported = { TAG_NAMES: TAG_NAMES, isSelector: isSelector, createTag: createTag };
  TAG_NAMES.forEach(function (n) {
    exported[n] = createTag(n);
  });
  return exported;
};

module.exports = exports['default'];

},{}],87:[function(require,module,exports){
'use strict';

var proto = Element.prototype;
var vendor = proto.matches
  || proto.matchesSelector
  || proto.webkitMatchesSelector
  || proto.mozMatchesSelector
  || proto.msMatchesSelector
  || proto.oMatchesSelector;

module.exports = match;

/**
 * Match `el` to `selector`.
 *
 * @param {Element} el
 * @param {String} selector
 * @return {Boolean}
 * @api public
 */

function match(el, selector) {
  if (vendor) return vendor.call(el, selector);
  var nodes = el.parentNode.querySelectorAll(selector);
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i] == el) return true;
  }
  return false;
}
},{}],88:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = classNameFromVNode;

var _selectorParser2 = require('./selectorParser');

var _selectorParser3 = _interopRequireDefault(_selectorParser2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function classNameFromVNode(vNode) {
  var _selectorParser = (0, _selectorParser3.default)(vNode.sel);

  var cn = _selectorParser.className;

  if (!vNode.data) {
    return cn;
  }

  var _vNode$data = vNode.data;
  var dataClass = _vNode$data.class;
  var props = _vNode$data.props;

  if (dataClass) {
    var c = Object.keys(vNode.data.class).filter(function (cl) {
      return vNode.data.class[cl];
    });
    cn += ' ' + c.join(' ');
  }

  if (props && props.className) {
    cn += ' ' + props.className;
  }

  return cn.trim();
}
},{"./selectorParser":89}],89:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = selectorParser;

var _browserSplit = require('browser-split');

var _browserSplit2 = _interopRequireDefault(_browserSplit);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

function selectorParser() {
  var selector = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  var tagName = undefined;
  var id = '';
  var classes = [];

  var tagParts = (0, _browserSplit2.default)(selector, classIdSplit);

  if (notClassId.test(tagParts[1]) || selector === '') {
    tagName = 'div';
  }

  var part = undefined;
  var type = undefined;
  var i = undefined;

  for (i = 0; i < tagParts.length; i++) {
    part = tagParts[i];

    if (!part) {
      continue;
    }

    type = part.charAt(0);

    if (!tagName) {
      tagName = part;
    } else if (type === '.') {
      classes.push(part.substring(1, part.length));
    } else if (type === '#') {
      id = part.substring(1, part.length);
    }
  }

  return {
    tagName: tagName,
    id: id,
    className: classes.join(' ')
  };
}
},{"browser-split":90}],90:[function(require,module,exports){
/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
module.exports = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

},{}],91:[function(require,module,exports){
var VNode = require('./vnode');
var is = require('./is');

function addNS(data, children) {
  data.ns = 'http://www.w3.org/2000/svg';
  if (children !== undefined) {
    for (var i = 0; i < children.length; ++i) {
      addNS(children[i].data, children[i].children);
    }
  }
}

module.exports = function h(sel, b, c) {
  var data = {}, children, text, i;
  if (arguments.length === 3) {
    data = b;
    if (is.array(c)) { children = c; }
    else if (is.primitive(c)) { text = c; }
  } else if (arguments.length === 2) {
    if (is.array(b)) { children = b; }
    else if (is.primitive(b)) { text = b; }
    else { data = b; }
  }
  if (is.array(children)) {
    for (i = 0; i < children.length; ++i) {
      if (is.primitive(children[i])) children[i] = VNode(undefined, undefined, undefined, children[i]);
    }
  }
  if (sel[0] === 's' && sel[1] === 'v' && sel[2] === 'g') {
    addNS(data, children);
  }
  return VNode(sel, data, children, text, undefined);
};

},{"./is":92,"./vnode":99}],92:[function(require,module,exports){
module.exports = {
  array: Array.isArray,
  primitive: function(s) { return typeof s === 'string' || typeof s === 'number'; },
};

},{}],93:[function(require,module,exports){
var booleanAttrs = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "compact", "controls", "declare", 
                "default", "defaultchecked", "defaultmuted", "defaultselected", "defer", "disabled", "draggable", 
                "enabled", "formnovalidate", "hidden", "indeterminate", "inert", "ismap", "itemscope", "loop", "multiple", 
                "muted", "nohref", "noresize", "noshade", "novalidate", "nowrap", "open", "pauseonexit", "readonly", 
                "required", "reversed", "scoped", "seamless", "selected", "sortable", "spellcheck", "translate", 
                "truespeed", "typemustmatch", "visible"];
    
var booleanAttrsDict = {};
for(var i=0, len = booleanAttrs.length; i < len; i++) {
  booleanAttrsDict[booleanAttrs[i]] = true;
}
    
function updateAttrs(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldAttrs = oldVnode.data.attrs || {}, attrs = vnode.data.attrs || {};
  
  // update modified attributes, add new attributes
  for (key in attrs) {
    cur = attrs[key];
    old = oldAttrs[key];
    if (old !== cur) {
      // TODO: add support to namespaced attributes (setAttributeNS)
      if(!cur && booleanAttrsDict[key])
        elm.removeAttribute(key);
      else
        elm.setAttribute(key, cur);
    }
  }
  //remove removed attributes
  // use `in` operator since the previous `for` iteration uses it (.i.e. add even attributes with undefined value)
  // the other option is to remove all attributes with value == undefined
  for (key in oldAttrs) {
    if (!(key in attrs)) {
      elm.removeAttribute(key);
    }
  }
}

module.exports = {create: updateAttrs, update: updateAttrs};

},{}],94:[function(require,module,exports){
function updateClass(oldVnode, vnode) {
  var cur, name, elm = vnode.elm,
      oldClass = oldVnode.data.class || {},
      klass = vnode.data.class || {};
  for (name in oldClass) {
    if (!klass[name]) {
      elm.classList.remove(name);
    }
  }
  for (name in klass) {
    cur = klass[name];
    if (cur !== oldClass[name]) {
      elm.classList[cur ? 'add' : 'remove'](name);
    }
  }
}

module.exports = {create: updateClass, update: updateClass};

},{}],95:[function(require,module,exports){
var is = require('../is');

function arrInvoker(arr) {
  return function() {
    // Special case when length is two, for performance
    arr.length === 2 ? arr[0](arr[1]) : arr[0].apply(undefined, arr.slice(1));
  };
}

function fnInvoker(o) {
  return function(ev) { o.fn(ev); };
}

function updateEventListeners(oldVnode, vnode) {
  var name, cur, old, elm = vnode.elm,
      oldOn = oldVnode.data.on || {}, on = vnode.data.on;
  if (!on) return;
  for (name in on) {
    cur = on[name];
    old = oldOn[name];
    if (old === undefined) {
      if (is.array(cur)) {
        elm.addEventListener(name, arrInvoker(cur));
      } else {
        cur = {fn: cur};
        on[name] = cur;
        elm.addEventListener(name, fnInvoker(cur));
      }
    } else if (is.array(old)) {
      // Deliberately modify old array since it's captured in closure created with `arrInvoker`
      old.length = cur.length;
      for (var i = 0; i < old.length; ++i) old[i] = cur[i];
      on[name]  = old;
    } else {
      old.fn = cur;
      on[name] = old;
    }
  }
}

module.exports = {create: updateEventListeners, update: updateEventListeners};

},{"../is":92}],96:[function(require,module,exports){
function updateProps(oldVnode, vnode) {
  var key, cur, old, elm = vnode.elm,
      oldProps = oldVnode.data.props || {}, props = vnode.data.props || {};
  for (key in oldProps) {
    if (!props[key]) {
      delete elm[key];
    }
  }
  for (key in props) {
    cur = props[key];
    old = oldProps[key];
    if (old !== cur) {
      elm[key] = cur;
    }
  }
}

module.exports = {create: updateProps, update: updateProps};

},{}],97:[function(require,module,exports){
// jshint newcap: false
/* global require, module, document, Element */
'use strict';

var VNode = require('./vnode');
var is = require('./is');

function isUndef(s) { return s === undefined; }
function isDef(s) { return s !== undefined; }

function emptyNodeAt(elm) {
  return VNode(elm.tagName, {}, [], undefined, elm);
}

var emptyNode = VNode('', {}, [], undefined, undefined);

function sameVnode(vnode1, vnode2) {
  return vnode1.key === vnode2.key && vnode1.sel === vnode2.sel;
}

function createKeyToOldIdx(children, beginIdx, endIdx) {
  var i, map = {}, key;
  for (i = beginIdx; i <= endIdx; ++i) {
    key = children[i].key;
    if (isDef(key)) map[key] = i;
  }
  return map;
}

function createRmCb(childElm, listeners) {
  return function() {
    if (--listeners === 0) childElm.parentElement.removeChild(childElm);
  };
}

var hooks = ['create', 'update', 'remove', 'destroy', 'pre', 'post'];

function init(modules) {
  var i, j, cbs = {};
  for (i = 0; i < hooks.length; ++i) {
    cbs[hooks[i]] = [];
    for (j = 0; j < modules.length; ++j) {
      if (modules[j][hooks[i]] !== undefined) cbs[hooks[i]].push(modules[j][hooks[i]]);
    }
  }

  function createElm(vnode, insertedVnodeQueue) {
    var i, data = vnode.data;
    if (isDef(data)) {
      if (isDef(i = data.hook) && isDef(i = i.init)) i(vnode);
      if (isDef(i = data.vnode)) vnode = i;
    }
    var elm, children = vnode.children, sel = vnode.sel;
    if (isDef(sel)) {
      // Parse selector
      var hashIdx = sel.indexOf('#');
      var dotIdx = sel.indexOf('.', hashIdx);
      var hash = hashIdx > 0 ? hashIdx : sel.length;
      var dot = dotIdx > 0 ? dotIdx : sel.length;
      var tag = hashIdx !== -1 || dotIdx !== -1 ? sel.slice(0, Math.min(hash, dot)) : sel;
      elm = vnode.elm = isDef(data) && isDef(i = data.ns) ? document.createElementNS(i, tag)
                                                          : document.createElement(tag);
      if (hash < dot) elm.id = sel.slice(hash + 1, dot);
      if (dotIdx > 0) elm.className = sel.slice(dot+1).replace(/\./g, ' ');
      if (is.array(children)) {
        for (i = 0; i < children.length; ++i) {
          elm.appendChild(createElm(children[i], insertedVnodeQueue));
        }
      } else if (is.primitive(vnode.text)) {
        elm.appendChild(document.createTextNode(vnode.text));
      }
      for (i = 0; i < cbs.create.length; ++i) cbs.create[i](emptyNode, vnode);
      i = vnode.data.hook; // Reuse variable
      if (isDef(i)) {
        if (i.create) i.create(emptyNode, vnode);
        if (i.insert) insertedVnodeQueue.push(vnode);
      }
    } else {
      elm = vnode.elm = document.createTextNode(vnode.text);
    }
    return vnode.elm;
  }

  function addVnodes(parentElm, before, vnodes, startIdx, endIdx, insertedVnodeQueue) {
    for (; startIdx <= endIdx; ++startIdx) {
      parentElm.insertBefore(createElm(vnodes[startIdx], insertedVnodeQueue), before);
    }
  }

  function invokeDestroyHook(vnode) {
    var i = vnode.data, j;
    if (isDef(i)) {
      if (isDef(i = i.hook) && isDef(i = i.destroy)) i(vnode);
      for (i = 0; i < cbs.destroy.length; ++i) cbs.destroy[i](vnode);
      if (isDef(i = vnode.children)) {
        for (j = 0; j < vnode.children.length; ++j) {
          invokeDestroyHook(vnode.children[j]);
        }
      }
    }
  }

  function removeVnodes(parentElm, vnodes, startIdx, endIdx) {
    for (; startIdx <= endIdx; ++startIdx) {
      var i, listeners, rm, ch = vnodes[startIdx];
      if (isDef(ch)) {
        if (isDef(ch.sel)) {
          invokeDestroyHook(ch);
          listeners = cbs.remove.length + 1;
          rm = createRmCb(ch.elm, listeners);
          for (i = 0; i < cbs.remove.length; ++i) cbs.remove[i](ch, rm);
          if (isDef(i = ch.data) && isDef(i = i.hook) && isDef(i = i.remove)) {
            i(ch, rm);
          } else {
            rm();
          }
        } else { // Text node
          parentElm.removeChild(ch.elm);
        }
      }
    }
  }

  function updateChildren(parentElm, oldCh, newCh, insertedVnodeQueue) {
    var oldStartIdx = 0, newStartIdx = 0;
    var oldEndIdx = oldCh.length - 1;
    var oldStartVnode = oldCh[0];
    var oldEndVnode = oldCh[oldEndIdx];
    var newEndIdx = newCh.length - 1;
    var newStartVnode = newCh[0];
    var newEndVnode = newCh[newEndIdx];
    var oldKeyToIdx, idxInOld, elmToMove, before;

    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
      if (isUndef(oldStartVnode)) {
        oldStartVnode = oldCh[++oldStartIdx]; // Vnode has been moved left
      } else if (isUndef(oldEndVnode)) {
        oldEndVnode = oldCh[--oldEndIdx];
      } else if (sameVnode(oldStartVnode, newStartVnode)) {
        patchVnode(oldStartVnode, newStartVnode, insertedVnodeQueue);
        oldStartVnode = oldCh[++oldStartIdx];
        newStartVnode = newCh[++newStartIdx];
      } else if (sameVnode(oldEndVnode, newEndVnode)) {
        patchVnode(oldEndVnode, newEndVnode, insertedVnodeQueue);
        oldEndVnode = oldCh[--oldEndIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldStartVnode, newEndVnode)) { // Vnode moved right
        patchVnode(oldStartVnode, newEndVnode, insertedVnodeQueue);
        parentElm.insertBefore(oldStartVnode.elm, oldEndVnode.elm.nextSibling);
        oldStartVnode = oldCh[++oldStartIdx];
        newEndVnode = newCh[--newEndIdx];
      } else if (sameVnode(oldEndVnode, newStartVnode)) { // Vnode moved left
        patchVnode(oldEndVnode, newStartVnode, insertedVnodeQueue);
        parentElm.insertBefore(oldEndVnode.elm, oldStartVnode.elm);
        oldEndVnode = oldCh[--oldEndIdx];
        newStartVnode = newCh[++newStartIdx];
      } else {
        if (isUndef(oldKeyToIdx)) oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx);
        idxInOld = oldKeyToIdx[newStartVnode.key];
        if (isUndef(idxInOld)) { // New element
          parentElm.insertBefore(createElm(newStartVnode, insertedVnodeQueue), oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        } else {
          elmToMove = oldCh[idxInOld];
          patchVnode(elmToMove, newStartVnode, insertedVnodeQueue);
          oldCh[idxInOld] = undefined;
          parentElm.insertBefore(elmToMove.elm, oldStartVnode.elm);
          newStartVnode = newCh[++newStartIdx];
        }
      }
    }
    if (oldStartIdx > oldEndIdx) {
      before = isUndef(newCh[newEndIdx+1]) ? null : newCh[newEndIdx+1].elm;
      addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx, insertedVnodeQueue);
    } else if (newStartIdx > newEndIdx) {
      removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx);
    }
  }

  function patchVnode(oldVnode, vnode, insertedVnodeQueue) {
    var i, hook;
    if (isDef(i = vnode.data) && isDef(hook = i.hook) && isDef(i = hook.prepatch)) {
      i(oldVnode, vnode);
    }
    if (isDef(i = oldVnode.data) && isDef(i = i.vnode)) oldVnode = i;
    if (isDef(i = vnode.data) && isDef(i = i.vnode)) vnode = i;
    var elm = vnode.elm = oldVnode.elm, oldCh = oldVnode.children, ch = vnode.children;
    if (oldVnode === vnode) return;
    if (isDef(vnode.data)) {
      for (i = 0; i < cbs.update.length; ++i) cbs.update[i](oldVnode, vnode);
      i = vnode.data.hook;
      if (isDef(i) && isDef(i = i.update)) i(oldVnode, vnode);
    }
    if (isUndef(vnode.text)) {
      if (isDef(oldCh) && isDef(ch)) {
        if (oldCh !== ch) updateChildren(elm, oldCh, ch, insertedVnodeQueue);
      } else if (isDef(ch)) {
        addVnodes(elm, null, ch, 0, ch.length - 1, insertedVnodeQueue);
      } else if (isDef(oldCh)) {
        removeVnodes(elm, oldCh, 0, oldCh.length - 1);
      }
    } else if (oldVnode.text !== vnode.text) {
      elm.textContent = vnode.text;
    }
    if (isDef(hook) && isDef(i = hook.postpatch)) {
      i(oldVnode, vnode);
    }
  }

  return function(oldVnode, vnode) {
    var i;
    var insertedVnodeQueue = [];
    for (i = 0; i < cbs.pre.length; ++i) cbs.pre[i]();
    if (oldVnode instanceof Element) {
      if (oldVnode.parentElement !== null) {
        createElm(vnode, insertedVnodeQueue);
        oldVnode.parentElement.replaceChild(vnode.elm, oldVnode);
      } else {
        oldVnode = emptyNodeAt(oldVnode);
        patchVnode(oldVnode, vnode, insertedVnodeQueue);
      }
    } else {
      patchVnode(oldVnode, vnode, insertedVnodeQueue);
    }
    for (i = 0; i < insertedVnodeQueue.length; ++i) {
      insertedVnodeQueue[i].data.hook.insert(insertedVnodeQueue[i]);
    }
    for (i = 0; i < cbs.post.length; ++i) cbs.post[i]();
    return vnode;
  };
}

module.exports = {init: init};

},{"./is":92,"./vnode":99}],98:[function(require,module,exports){
var h = require('./h');

function init(thunk) {
  var i, cur = thunk.data;
  cur.vnode = cur.fn.apply(undefined, cur.args);
}

function prepatch(oldThunk, thunk) {
  var i, old = oldThunk.data, cur = thunk.data;
  var oldArgs = old.args, args = cur.args;
  cur.vnode = old.vnode;
  if (oldArgs.length !== args.length) {
    cur.vnode = cur.fn.apply(undefined, args);
    return;
  }
  for (i = 0; i < args.length; ++i) {
    if (oldArgs[i] !== args[i]) {
      cur.vnode = cur.fn.apply(undefined, args);
      return;
    }
  }
}

module.exports = function(name, fn /* args */) {
  var i, args = [];
  for (i = 2; i < arguments.length; ++i) {
    args[i - 2] = arguments[i];
  }
  return h('thunk' + name, {
    hook: {init: init, prepatch: prepatch},
    fn: fn, args: args,
  });
};

},{"./h":91}],99:[function(require,module,exports){
module.exports = function(sel, data, children, text, elm) {
  var key = data === undefined ? undefined : data.key;
  return {sel: sel, data: data, children: children,
          text: text, elm: elm, key: key};
};

},{}],100:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],101:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7}],102:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],103:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9}],104:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],105:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"../Stream":103,"../base":104,"../runSource":140,"../sink/Pipe":149,"./build":107,"dup":11}],106:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"../base":104,"./combine":108,"dup":12}],107:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var streamOf = require('../source/core').of;
var continueWith = require('./continueWith').continueWith;

exports.concat = concat;
exports.cycle = cycle;
exports.cons = cons;

/**
 * @param {*} x value to prepend
 * @param {Stream} stream
 * @returns {Stream} new stream with x prepended
 */
function cons(x, stream) {
	return concat(streamOf(x), stream);
}

/**
 * @param {Stream} left
 * @param {Stream} right
 * @returns {Stream} new stream containing all events in left followed by all
 *  events in right.  This *timeshifts* right to the end of left.
 */
function concat(left, right) {
	return continueWith(function() {
		return right;
	}, left);
}

/**
 * @deprecated
 * Tie stream into a circle, creating an infinite stream
 * @param {Stream} stream
 * @returns {Stream} new infinite stream
 */
function cycle(stream) {
	return continueWith(function cycleNext() {
		return cycle(stream);
	}, stream);
}

},{"../source/core":154,"./continueWith":110}],108:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"../Stream":103,"../base":104,"../disposable/dispose":133,"../invoke":138,"../sink/IndexSink":147,"../sink/Pipe":149,"../source/core":154,"./merge":117,"./transform":128,"dup":14}],109:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"./mergeConcurrently":118,"./transform":128,"dup":15}],110:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"../Promise":101,"../Stream":103,"../disposable/dispose":133,"../sink/Pipe":149,"dup":16}],111:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"../Stream":103,"../disposable/dispose":133,"../scheduler/PropagateTask":141,"../sink/Pipe":149,"dup":17}],112:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"../Stream":103,"../base":104,"../disposable/dispose":133,"../source/ValueSource":153,"../source/tryEvent":163,"dup":18}],113:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"../Stream":103,"../fusion/Filter":135,"../sink/Pipe":149,"dup":19}],114:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"./mergeConcurrently":118,"./transform":128,"dup":20}],115:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"../Stream":103,"../disposable/dispose":133,"../scheduler/PropagateTask":141,"../sink/Pipe":149,"dup":21}],116:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"../Stream":103,"../sink/Pipe":149,"dup":22}],117:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"../Stream":103,"../base":104,"../disposable/dispose":133,"../sink/IndexSink":147,"../sink/Pipe":149,"../source/core":154,"dup":23}],118:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"../LinkedList":100,"../Stream":103,"../disposable/dispose":133,"dup":24}],119:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"../Stream":103,"../source/MulticastSource":152,"dup":25}],120:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"../base":104,"../runSource":140,"dup":26}],121:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"../Stream":103,"../fatalError":134,"dup":27}],122:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"../Stream":103,"../base":104,"../disposable/dispose":133,"../invoke":138,"../sink/Pipe":149,"dup":28}],123:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"../Stream":103,"../disposable/dispose":133,"../sink/Pipe":149,"../source/core":154,"dup":29}],124:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"../Stream":103,"../source/MulticastSource":152,"./mergeConcurrently":118,"./timeslice":125,"./transform":128,"dup":30}],125:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"../Stream":103,"../base":104,"../combinator/flatMap":114,"../disposable/dispose":133,"../sink/Pipe":149,"dup":31}],126:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"../Stream":103,"../sink/Pipe":149,"dup":32}],127:[function(require,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"../Stream":103,"dup":33}],128:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"../Stream":103,"../fusion/Map":137,"dup":34}],129:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"../Queue":102,"../Stream":103,"../base":104,"../disposable/dispose":133,"../invoke":138,"../sink/IndexSink":147,"../sink/Pipe":149,"../source/core":154,"./transform":128,"dup":35}],130:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36}],131:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"dup":37}],132:[function(require,module,exports){
arguments[4][38][0].apply(exports,arguments)
},{"dup":38}],133:[function(require,module,exports){
arguments[4][39][0].apply(exports,arguments)
},{"../Promise":101,"../base":104,"./Disposable":131,"./SettableDisposable":132,"dup":39}],134:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"dup":40}],135:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"../sink/Pipe":149,"dup":41}],136:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"../sink/Pipe":149,"dup":42}],137:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"../base":104,"../sink/Pipe":149,"./Filter":135,"./FilterMap":136,"dup":43}],138:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"dup":44}],139:[function(require,module,exports){
arguments[4][45][0].apply(exports,arguments)
},{"dup":45}],140:[function(require,module,exports){
arguments[4][46][0].apply(exports,arguments)
},{"./disposable/dispose":133,"./scheduler/defaultScheduler":143,"./sink/Observer":148,"dup":46}],141:[function(require,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"../fatalError":134,"dup":47}],142:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var base = require('./../base');

module.exports = Scheduler;

function ScheduledTask(delay, period, task, scheduler) {
	this.time = delay;
	this.period = period;
	this.task = task;
	this.scheduler = scheduler;
	this.active = true;
}

ScheduledTask.prototype.run = function() {
	return this.task.run(this.time);
};

ScheduledTask.prototype.error = function(e) {
	return this.task.error(this.time, e);
};

ScheduledTask.prototype.cancel = function() {
	this.scheduler.cancel(this);
	return this.task.dispose();
};

function runTask(task) {
	try {
		return task.run();
	} catch(e) {
		return task.error(e);
	}
}

function Scheduler(timer) {
	this.timer = timer;

	this._timer = null;
	this._nextArrival = 0;
	this._tasks = [];

	var self = this;
	this._runReadyTasksBound = function() {
		self._runReadyTasks(self.now());
	};
}

Scheduler.prototype.now = function() {
	return this.timer.now();
};

Scheduler.prototype.asap = function(task) {
	return this.schedule(0, -1, task);
};

Scheduler.prototype.delay = function(delay, task) {
	return this.schedule(delay, -1, task);
};

Scheduler.prototype.periodic = function(period, task) {
	return this.schedule(0, period, task);
};

Scheduler.prototype.schedule = function(delay, period, task) {
	var now = this.now();
	var st = new ScheduledTask(now + Math.max(0, delay), period, task, this);

	insertByTime(st, this._tasks);
	this._scheduleNextRun(now);
	return st;
};

Scheduler.prototype.cancel = function(task) {
	task.active = false;
	var i = binarySearch(task.time, this._tasks);

	if(i >= 0 && i < this._tasks.length) {
		var at = base.findIndex(task, this._tasks[i].events);
		if(at >= 0) {
			this._tasks[i].events.splice(at, 1);
			this._reschedule();
		}
	}
};

Scheduler.prototype.cancelAll = function(f) {
	this._tasks = base.removeAll(f, this._tasks);
	this._reschedule();
};

Scheduler.prototype._reschedule = function() {
	if(this._tasks.length === 0) {
		this._unschedule();
	} else {
		this._scheduleNextRun(this.now());
	}
};

Scheduler.prototype._unschedule = function() {
	this.timer.clearTimer(this._timer);
	this._timer = null;
};

Scheduler.prototype._scheduleNextRun = function(now) {
	if(this._tasks.length === 0) {
		return;
	}

	var nextArrival = this._tasks[0].time;

	if(this._timer === null) {
		this._scheduleNextArrival(nextArrival, now);
	} else if(nextArrival < this._nextArrival) {
		this._unschedule();
		this._scheduleNextArrival(nextArrival, now);
	}
};

Scheduler.prototype._scheduleNextArrival = function(nextArrival, now) {
	this._nextArrival = nextArrival;
	var delay = Math.max(0, nextArrival - now);
	this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};


Scheduler.prototype._runReadyTasks = function(now) {
	this._timer = null;

	this._tasks = this._findAndRunTasks(now);

	this._scheduleNextRun(this.now());
};

Scheduler.prototype._findAndRunTasks = function(now) {
	var tasks = this._tasks;
	var l = tasks.length;
	var i = 0;

	while(i < l && tasks[i].time <= now) {
		++i;
	}

	this._tasks = tasks.slice(i);

	// Run all ready tasks
	for (var j = 0; j < i; ++j) {
		this._tasks = runTasks(tasks[j], this._tasks);
	}
	return this._tasks;
};

function runTasks(timeslot, tasks) {
	var events = timeslot.events;
	for(var i=0; i<events.length; ++i) {
		var task = events[i];

		if(task.active) {
			runTask(task);

			// Reschedule periodic repeating tasks
			// Check active again, since a task may have canceled itself
			if(task.period >= 0) {
				task.time = task.time + task.period;
				insertByTime(task, tasks);
			}
		}
	}

	return tasks;
}

function insertByTime(task, timeslots) {
	var l = timeslots.length;

	if(l === 0) {
		timeslots.push(newTimeslot(task.time, [task]));
		return;
	}

	var i = binarySearch(task.time, timeslots);

	if(i >= l) {
		timeslots.push(newTimeslot(task.time, [task]));
	} else if(task.time === timeslots[i].time) {
		timeslots[i].events.push(task);
	} else {
		timeslots.splice(i, 0, newTimeslot(task.time, [task]));
	}
}

function binarySearch(t, sortedArray) {
	var lo = 0;
	var hi = sortedArray.length;
	var mid, y;

	while (lo < hi) {
		mid = Math.floor((lo + hi) / 2);
		y = sortedArray[mid];

		if (t === y.time) {
			return mid;
		} else if (t < y.time) {
			hi = mid;
		} else {
			lo = mid + 1;
		}
	}
	return hi;
}

function newTimeslot(t, events) {
	return { time: t, events: events };
}

},{"./../base":104}],143:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"./Scheduler":142,"./nodeTimer":144,"./timeoutTimer":145,"_process":166,"dup":49}],144:[function(require,module,exports){
arguments[4][50][0].apply(exports,arguments)
},{"../defer":130,"dup":50}],145:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51}],146:[function(require,module,exports){
arguments[4][52][0].apply(exports,arguments)
},{"../defer":130,"dup":52}],147:[function(require,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"./Pipe":149,"dup":53}],148:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],149:[function(require,module,exports){
arguments[4][55][0].apply(exports,arguments)
},{"dup":55}],150:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"../disposable/dispose":133,"../sink/DeferredSink":146,"./tryEvent":163,"dup":56}],151:[function(require,module,exports){
arguments[4][57][0].apply(exports,arguments)
},{"../disposable/dispose":133,"./tryEvent":163,"dup":57}],152:[function(require,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"../base":104,"dup":58}],153:[function(require,module,exports){
arguments[4][59][0].apply(exports,arguments)
},{"../scheduler/PropagateTask":141,"dup":59}],154:[function(require,module,exports){
arguments[4][60][0].apply(exports,arguments)
},{"../Stream":103,"../disposable/dispose":133,"../scheduler/PropagateTask":141,"../source/ValueSource":153,"dup":60}],155:[function(require,module,exports){
arguments[4][61][0].apply(exports,arguments)
},{"../Stream":103,"../sink/DeferredSink":146,"./MulticastSource":152,"./tryEvent":163,"dup":61}],156:[function(require,module,exports){
arguments[4][62][0].apply(exports,arguments)
},{"../base":104,"../iterable":139,"./fromArray":157,"./fromIterable":159,"dup":62}],157:[function(require,module,exports){
arguments[4][63][0].apply(exports,arguments)
},{"../Stream":103,"../scheduler/PropagateTask":141,"dup":63}],158:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"../Stream":103,"./EventEmitterSource":150,"./EventTargetSource":151,"./MulticastSource":152,"dup":64}],159:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"../Stream":103,"../iterable":139,"../scheduler/PropagateTask":141,"dup":65}],160:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"../Stream":103,"../base":104,"dup":66}],161:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"../Stream":103,"dup":67}],162:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"../Stream":103,"../disposable/dispose":133,"../scheduler/PropagateTask":141,"./MulticastSource":152,"dup":68}],163:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"dup":69}],164:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"../Stream":103,"dup":70}],165:[function(require,module,exports){
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var Stream = require('./lib/Stream');
var base = require('./lib/base');
var core = require('./lib/source/core');
var from = require('./lib/source/from').from;
var periodic = require('./lib/source/periodic').periodic;

/**
 * Core stream type
 * @type {Stream}
 */
exports.Stream = Stream;

// Add of and empty to constructor for fantasy-land compat
exports.of       = Stream.of    = core.of;
exports.just     = core.of; // easier ES6 import alias
exports.empty    = Stream.empty = core.empty;
exports.never    = core.never;
exports.from     = from;
exports.periodic = periodic;

//-----------------------------------------------------------------------
// Creating

var create = require('./lib/source/create');

/**
 * Create a stream by imperatively pushing events.
 * @param {function(add:function(x), end:function(e)):function} run function
 *  that will receive 2 functions as arguments, the first to add new values to the
 *  stream and the second to end the stream. It may *return* a function that
 *  will be called once all consumers have stopped observing the stream.
 * @returns {Stream} stream containing all events added by run before end
 */
exports.create = create.create;

//-----------------------------------------------------------------------
// Adapting other sources

var events = require('./lib/source/fromEvent');

/**
 * Create a stream of events from the supplied EventTarget or EventEmitter
 * @param {String} event event name
 * @param {EventTarget|EventEmitter} source EventTarget or EventEmitter. The source
 *  must support either addEventListener/removeEventListener (w3c EventTarget:
 *  http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget),
 *  or addListener/removeListener (node EventEmitter: http://nodejs.org/api/events.html)
 * @returns {Stream} stream of events of the specified type from the source
 */
exports.fromEvent = events.fromEvent;

//-----------------------------------------------------------------------
// Observing

var observe = require('./lib/combinator/observe');

exports.observe = observe.observe;
exports.forEach = observe.observe;
exports.drain   = observe.drain;

/**
 * Process all the events in the stream
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
Stream.prototype.observe = Stream.prototype.forEach = function(f) {
	return observe.observe(f, this);
};

/**
 * Consume all events in the stream, without providing a function to process each.
 * This causes a stream to become active and begin emitting events, and is useful
 * in cases where all processing has been setup upstream via other combinators, and
 * there is no need to process the terminal events.
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
Stream.prototype.drain = function() {
	return observe.drain(this);
};

//-------------------------------------------------------

var loop = require('./lib/combinator/loop').loop;

exports.loop = loop;

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */
Stream.prototype.loop = function(stepper, seed) {
	return loop(stepper, seed, this);
};

//-------------------------------------------------------

var accumulate = require('./lib/combinator/accumulate');

exports.scan   = accumulate.scan;
exports.reduce = accumulate.reduce;

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @returns {Stream} new stream containing successive reduce results
 */
Stream.prototype.scan = function(f, initial) {
	return accumulate.scan(f, initial, this);
};

/**
 * Reduce the stream to produce a single result.  Note that reducing an infinite
 * stream will return a Promise that never fulfills, but that may reject if an error
 * occurs.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial optional initial value
 * @returns {Promise} promise for the file result of the reduce
 */
Stream.prototype.reduce = function(f, initial) {
	return accumulate.reduce(f, initial, this);
};

//-----------------------------------------------------------------------
// Building and extending

var unfold = require('./lib/source/unfold');
var iterate = require('./lib/source/iterate');
var generate = require('./lib/source/generate');
var build = require('./lib/combinator/build');

exports.unfold    = unfold.unfold;
exports.iterate   = iterate.iterate;
exports.generate  = generate.generate;
exports.cycle     = build.cycle;
exports.concat    = build.concat;
exports.startWith = build.cons;

/**
 * @deprecated
 * Tie this stream into a circle, thus creating an infinite stream
 * @returns {Stream} new infinite stream
 */
Stream.prototype.cycle = function() {
	return build.cycle(this);
};

/**
 * @param {Stream} tail
 * @returns {Stream} new stream containing all items in this followed by
 *  all items in tail
 */
Stream.prototype.concat = function(tail) {
	return build.concat(this, tail);
};

/**
 * @param {*} x value to prepend
 * @returns {Stream} a new stream with x prepended
 */
Stream.prototype.startWith = function(x) {
	return build.cons(x, this);
};

//-----------------------------------------------------------------------
// Transforming

var transform = require('./lib/combinator/transform');
var applicative = require('./lib/combinator/applicative');

exports.map      = transform.map;
exports.constant = transform.constant;
exports.tap      = transform.tap;
exports.ap       = applicative.ap;

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @returns {Stream} stream containing items transformed by f
 */
Stream.prototype.map = function(f) {
	return transform.map(f, this);
};

/**
 * Assume this stream contains functions, and apply each function to each item
 * in the provided stream.  This generates, in effect, a cross product.
 * @param {Stream} xs stream of items to which
 * @returns {Stream} stream containing the cross product of items
 */
Stream.prototype.ap = function(xs) {
	return applicative.ap(this, xs);
};

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @returns {Stream} stream containing items replaced with x
 */
Stream.prototype.constant = function(x) {
	return transform.constant(x, this);
};

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @returns {Stream} new stream containing the same items as this stream
 */
Stream.prototype.tap = function(f) {
	return transform.tap(f, this);
};

//-----------------------------------------------------------------------
// Transducer support

var transduce = require('./lib/combinator/transduce');

exports.transduce = transduce.transduce;

/**
 * Transform this stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @return {Stream} stream of events transformed by the transducer
 */
Stream.prototype.transduce = function(transducer) {
	return transduce.transduce(transducer, this);
};

//-----------------------------------------------------------------------
// FlatMapping

var flatMap = require('./lib/combinator/flatMap');

exports.flatMap = exports.chain = flatMap.flatMap;
exports.join    = flatMap.join;

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
Stream.prototype.flatMap = Stream.prototype.chain = function(f) {
	return flatMap.flatMap(f, this);
};

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
Stream.prototype.join = function() {
	return flatMap.join(this);
};

var continueWith = require('./lib/combinator/continueWith').continueWith;

exports.continueWith = continueWith;
exports.flatMapEnd = continueWith;

/**
 * Map the end event to a new stream, and begin emitting its values.
 * @param {function(x:*):Stream} f function that receives the end event value,
 * and *must* return a new Stream to continue with.
 * @returns {Stream} new stream that emits all events from the original stream,
 * followed by all events from the stream returned by f.
 */
Stream.prototype.continueWith = Stream.prototype.flatMapEnd = function(f) {
	return continueWith(f, this);
};

var concatMap = require('./lib/combinator/concatMap').concatMap;

exports.concatMap = concatMap;

Stream.prototype.concatMap = function(f) {
	return concatMap(f, this);
};

//-----------------------------------------------------------------------
// Concurrent merging

var mergeConcurrently = require('./lib/combinator/mergeConcurrently');

exports.mergeConcurrently = mergeConcurrently.mergeConcurrently;

/**
 * Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer, limiting the number of inner streams that may
 * be active concurrently.
 * @param {number} concurrency at most this many inner streams will be
 *  allowed to be active concurrently.
 * @return {Stream<X>} new stream containing all events of all inner
 *  streams, with limited concurrency.
 */
Stream.prototype.mergeConcurrently = function(concurrency) {
	return mergeConcurrently.mergeConcurrently(concurrency, this);
};

//-----------------------------------------------------------------------
// Merging

var merge = require('./lib/combinator/merge');

exports.merge = merge.merge;
exports.mergeArray = merge.mergeArray;

/**
 * Merge this stream and all the provided streams
 * @returns {Stream} stream containing items from this stream and s in time
 * order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
Stream.prototype.merge = function(/*...streams*/) {
	return merge.mergeArray(base.cons(this, arguments));
};

//-----------------------------------------------------------------------
// Combining

var combine = require('./lib/combinator/combine');

exports.combine = combine.combine;
exports.combineArray = combine.combineArray;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
Stream.prototype.combine = function(f /*, ...streams*/) {
	return combine.combineArray(f, base.replace(this, 0, arguments));
};

//-----------------------------------------------------------------------
// Sampling

var sample = require('./lib/combinator/sample');

exports.sample = sample.sample;
exports.sampleWith = sample.sampleWith;

/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  signal's latest value will be propagated
 * @returns {Stream} sampled stream of values
 */
Stream.prototype.sampleWith = function(sampler) {
	return sample.sampleWith(sampler, this);
};

/**
 * When an event arrives on this stream, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @returns {Stream} stream of sampled and transformed values
 */
Stream.prototype.sample = function(f /* ...streams */) {
	return sample.sampleArray(f, this, base.tail(arguments));
};

//-----------------------------------------------------------------------
// Zipping

var zip = require('./lib/combinator/zip');

exports.zip = zip.zip;

/**
 * Pair-wise combine items with those in s. Given 2 streams:
 * [1,2,3] zipWith f [4,5,6] -> [f(1,4),f(2,5),f(3,6)]
 * Note: zip causes fast streams to buffer and wait for slow streams.
 * @param {function(a:Stream, b:Stream, ...):*} f function to combine items
 * @returns {Stream} new stream containing pairs
 */
Stream.prototype.zip = function(f /*, ...streams*/) {
	return zip.zipArray(f, base.replace(this, 0, arguments));
};

//-----------------------------------------------------------------------
// Switching

var switchLatest = require('./lib/combinator/switch').switch;

exports.switch       = switchLatest;
exports.switchLatest = switchLatest;

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @returns {Stream} switching stream
 */
Stream.prototype.switch = Stream.prototype.switchLatest = function() {
	return switchLatest(this);
};

//-----------------------------------------------------------------------
// Filtering

var filter = require('./lib/combinator/filter');

exports.filter          = filter.filter;
exports.skipRepeats     = exports.distinct   = filter.skipRepeats;
exports.skipRepeatsWith = exports.distinctBy = filter.skipRepeatsWith;

/**
 * Retain only items matching a predicate
 * stream:                           -12345678-
 * filter(x => x % 2 === 0, stream): --2-4-6-8-
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
Stream.prototype.filter = function(p) {
	return filter.filter(p, this);
};

/**
 * Skip repeated events, using === to compare items
 * stream:           -abbcd-
 * distinct(stream): -ab-cd-
 * @returns {Stream} stream with no repeated events
 */
Stream.prototype.skipRepeats = function() {
	return filter.skipRepeats(this);
};

/**
 * Skip repeated events, using supplied equals function to compare items
 * @param {function(a:*, b:*):boolean} equals function to compare items
 * @returns {Stream} stream with no repeated events
 */
Stream.prototype.skipRepeatsWith = function(equals) {
	return filter.skipRepeatsWith(equals, this);
};

//-----------------------------------------------------------------------
// Slicing

var slice = require('./lib/combinator/slice');

exports.take      = slice.take;
exports.skip      = slice.skip;
exports.slice     = slice.slice;
exports.takeWhile = slice.takeWhile;
exports.skipWhile = slice.skipWhile;

/**
 * stream:          -abcd-
 * take(2, stream): -ab|
 * @param {Number} n take up to this many events
 * @returns {Stream} stream containing at most the first n items from this stream
 */
Stream.prototype.take = function(n) {
	return slice.take(n, this);
};

/**
 * stream:          -abcd->
 * skip(2, stream): ---cd->
 * @param {Number} n skip this many events
 * @returns {Stream} stream not containing the first n events
 */
Stream.prototype.skip = function(n) {
	return slice.skip(n, this);
};

/**
 * Slice a stream by event index. Equivalent to, but more efficient than
 * stream.take(end).skip(start);
 * NOTE: Negative start and end are not supported
 * @param {Number} start skip all events before the start index
 * @param {Number} end allow all events from the start index to the end index
 * @returns {Stream} stream containing items where start <= index < end
 */
Stream.prototype.slice = function(start, end) {
	return slice.slice(start, end, this);
};

/**
 * stream:                        -123451234->
 * takeWhile(x => x < 5, stream): -1234|
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items up to, but not including, the
 * first item for which p returns falsy.
 */
Stream.prototype.takeWhile = function(p) {
	return slice.takeWhile(p, this);
};

/**
 * stream:                        -123451234->
 * skipWhile(x => x < 5, stream): -----51234->
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items following *and including* the
 * first item for which p returns falsy.
 */
Stream.prototype.skipWhile = function(p) {
	return slice.skipWhile(p, this);
};

//-----------------------------------------------------------------------
// Time slicing

var timeslice = require('./lib/combinator/timeslice');

exports.until  = exports.takeUntil = timeslice.takeUntil;
exports.since  = exports.skipUntil = timeslice.skipUntil;
exports.during = timeslice.during;

/**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -a-b-c-|
 * @param {Stream} signal retain only events in stream before the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur before
 * the first event in signal.
 */
Stream.prototype.until = Stream.prototype.takeUntil = function(signal) {
	return timeslice.takeUntil(signal, this);
};

/**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -------d-e-f-g->
 * @param {Stream} signal retain only events in stream at or after the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur after
 * the first event in signal.
 */
Stream.prototype.since = Stream.prototype.skipUntil = function(signal) {
	return timeslice.skipUntil(signal, this);
};

/**
 * stream:                    -a-b-c-d-e-f-g->
 * timeWindow:                -----s
 * s:                               -----t
 * stream.during(timeWindow): -----c-d-e-|
 * @param {Stream<Stream>} timeWindow a stream whose first event (s) represents
 *  the window start time.  That event (s) is itself a stream whose first event (t)
 *  represents the window end time
 * @returns {Stream} new stream containing only events within the provided timespan
 */
Stream.prototype.during = function(timeWindow) {
	return timeslice.during(timeWindow, this);
};

//-----------------------------------------------------------------------
// Delaying

var delay = require('./lib/combinator/delay').delay;

exports.delay = delay;

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
Stream.prototype.delay = function(delayTime) {
	return delay(delayTime, this);
};

//-----------------------------------------------------------------------
// Getting event timestamp

var timestamp = require('./lib/combinator/timestamp').timestamp;

exports.timestamp = timestamp;

/**
 * Expose event timestamps into the stream. Turns a Stream<X> into
 * Stream<{time:t, value:X}>
 * @returns {Stream<{time:number, value:*}>}
 */
Stream.prototype.timestamp = function() {
	return timestamp(this);
};

//-----------------------------------------------------------------------
// Rate limiting

var limit = require('./lib/combinator/limit');

exports.throttle = limit.throttle;
exports.debounce = limit.debounce;

/**
 * Limit the rate of events
 * stream:              abcd----abcd----
 * throttle(2, stream): a-c-----a-c-----
 * @param {Number} period time to suppress events
 * @returns {Stream} new stream that skips events for throttle period
 */
Stream.prototype.throttle = function(period) {
	return limit.throttle(period, this);
};

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * stream:              abcd----abcd----
 * debounce(2, stream): -----d-------d--
 * @param {Number} period events occuring more frequently than this
 *  on the provided scheduler will be suppressed
 * @returns {Stream} new debounced stream
 */
Stream.prototype.debounce = function(period) {
	return limit.debounce(period, this);
};

//-----------------------------------------------------------------------
// Awaiting Promises

var promises = require('./lib/combinator/promises');

exports.fromPromise = promises.fromPromise;
exports.await       = promises.awaitPromises;

/**
 * Await promises, turning a Stream<Promise<X>> into Stream<X>.  Preserves
 * event order, but timeshifts events based on promise resolution time.
 * @returns {Stream<X>} stream containing non-promise values
 */
Stream.prototype.await = function() {
	return promises.awaitPromises(this);
};

//-----------------------------------------------------------------------
// Error handling

var errors = require('./lib/combinator/errors');

exports.recoverWith  = errors.flatMapError;
exports.flatMapError = errors.flatMapError;
exports.throwError   = errors.throwError;

/**
 * If this stream encounters an error, recover and continue with items from stream
 * returned by f.
 * stream:                  -a-b-c-X-
 * f(X):                           d-e-f-g-
 * flatMapError(f, stream): -a-b-c-d-e-f-g-
 * @param {function(error:*):Stream} f function which returns a new stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */
Stream.prototype.recoverWith = Stream.prototype.flatMapError = function(f) {
	return errors.flatMapError(f, this);
};

//-----------------------------------------------------------------------
// Multicasting

var multicast = require('./lib/combinator/multicast').multicast;

exports.multicast = multicast;

/**
 * Transform the stream into multicast stream.  That means that many subscribers
 * to the stream will not cause multiple invocations of the internal machinery.
 * @returns {Stream} new stream which will multicast events to all observers.
 */
Stream.prototype.multicast = function() {
	return multicast(this);
};

},{"./lib/Stream":103,"./lib/base":104,"./lib/combinator/accumulate":105,"./lib/combinator/applicative":106,"./lib/combinator/build":107,"./lib/combinator/combine":108,"./lib/combinator/concatMap":109,"./lib/combinator/continueWith":110,"./lib/combinator/delay":111,"./lib/combinator/errors":112,"./lib/combinator/filter":113,"./lib/combinator/flatMap":114,"./lib/combinator/limit":115,"./lib/combinator/loop":116,"./lib/combinator/merge":117,"./lib/combinator/mergeConcurrently":118,"./lib/combinator/multicast":119,"./lib/combinator/observe":120,"./lib/combinator/promises":121,"./lib/combinator/sample":122,"./lib/combinator/slice":123,"./lib/combinator/switch":124,"./lib/combinator/timeslice":125,"./lib/combinator/timestamp":126,"./lib/combinator/transduce":127,"./lib/combinator/transform":128,"./lib/combinator/zip":129,"./lib/source/core":154,"./lib/source/create":155,"./lib/source/from":156,"./lib/source/fromEvent":158,"./lib/source/generate":160,"./lib/source/iterate":161,"./lib/source/periodic":162,"./lib/source/unfold":164}],166:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],167:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _motorcycleDom = require('@motorcycle/dom');

var Group = 'solo';
var Name = 'Fred';

var monads = (0, _motorcycleDom.h)('pre', '  class Monad {\n    var _this = this; \n    constructor(z,g) {\n\n      this.x = z;\n      if (arguments.length === 1) {this.id = \'anonymous\'}\n      else {this.id = g}\n\n      this.bnd = function (func, ...args) {\n        return func(_this.x, ...args);\n      };\n\n      this.ret = function (a) {\n        _this.x = a;\n        return _this;\n      };\n    }\n  };\n\n  class MonadIter {\n    var _this = this;                  \n    constructor() {\n\n      this.p = function() {};\n\n      this.release = function () {\n        return _this.p();\n      }\n \n      this.bnd = function (func) {\n          _this.p = func;\n      }\n    }\n  } ');

var fib = (0, _motorcycleDom.h)('pre', '  var fib = function fib(x,k) {\n    let j = k;\n    while (j > 0) {\n      x = [x[1], x[0] + x[1]];\n      j -= 1;\n    }\n    return ret(\'fibonacci \' + k + \' = \' + x[0]);   // An anonymous monad holding the result.\n  }\n');

var driver = (0, _motorcycleDom.h)('pre', '  var websocketsDriver = function () {\n      return create((add) => {\n        socket.onmessage = msg => add(msg)\n      })\n  }\n');

var main = (0, _motorcycleDom.h)('pre', '  function main(sources) {\n  const messages$ = (sources.WS).map(e => \n    mMar.ret(e.data.split(\',\'))\n    .bnd(array => mMscores.ret(array[3].split("<br>"))\n    .bnd(() => mMname.ret(mMar.x[2])\n    .bnd(() => mMprefix.ret(mMar.x[0])\n      .bnd(next, \'CA#$42\', mMZ10)\n      .bnd(next, \'CB#$42\', mMZ11)\n      .bnd(next, \'CC#$42\', mMZ12)\n      .bnd(next, \'CD#$42\', mMZ13)\n      .bnd(next, \'CE#$42\', mMZ14)\n      .bnd(next, \'EE#$42\', mMZ15)))));\n    mMmain.bnd(() =>\n    (mMZ10.bnd(() => mM1\n      .ret([mMar.x[3], mMar.x[4], mMar.x[5], mMar.x[6]])\n      .bnd(displayInline,\'1\')\n      .bnd(displayInline,\'2\')\n      .bnd(displayInline,\'3\')))),\n    (mMZ11.bnd(() => mMscbd\n      .ret(mMscores.x)\n      .bnd(updateScoreboard)\n      .bnd(() => mM3.ret([])\n      .bnd(() => mM8.ret(0) )))),\n    (mMZ12.bnd(() => mM6\n      .ret( mMname.x + \' successfully logged in.\'))),\n    (mMZ13.bnd(() => mMar\n      .bnd(splice, 0 ,3)\n      .bnd(reduce, (a,b) => a + ", " + b)\n      .bnd(() => mMmsg\n      .bnd(push, mMname.x + \': \' + mMar.x)\n      .bnd(updateMessages)))),\n    (mMZ14.bnd(() => mMgoals2.ret(\'The winner is \' + mMname.x ))), \n    (mMZ15.bnd(() => mMgoals2.ret(\'A player named \' + \n        mMname.x + \'is currently logged in. Page will refresh in 4 seconds.\')\n      .bnd(refresh)))  ');

var next = (0, _motorcycleDom.h)('pre', '  var next = function next(x, y, mon2) {\n    if (x === y) {\n      mon2.release();\n    }\n    return ret(x);  // An anonymous monad with the value of the calling monad.\n  } ');

var game = (0, _motorcycleDom.h)('pre', '  const numClick$ = sources.DOM\n    .select(\'.num\').events(\'click\');\n     \n  const numClickAction$ = numClick$.map(e => {\n    mM3\n    .bnd(push,e.target.textContent)\n    .bnd(() => {mM1.x[e.target.id] = "";})\n    if (mM3.x.length === 2 && mM8.x !== 0) {updateCalc();}\n  }).startWith(mM1.x[0]);\n\n  const opClick$ = sources.DOM\n    .select(\'.op\').events(\'click\');\n\n  const opClickAction$ = opClick$.map(e => {\n    mM8.ret(e.target.textContent);\n    if (mM3.x.length === 2) {updateCalc();}\n  })\n\n  const rollClick$ = sources.DOM\n    .select(\'.roll\').events(\'click\');\n\n  const rollClickAction$ = rollClick$.map(e => {  \n    mM13.ret(mM13.x - 1);\n    socket.send(\'CG#$42,\' + Group + \',\' + Name + \',\' + -1 + \',\' + 0);\n    socket.send(`CA#$42,' + Group + ',' + Name + ',6,6,12,20`);\n  });   ');

var updateCalc = (0, _motorcycleDom.h)('pre', '  function updateCalc() { \n  mMcalc.bnd(() => (\n      (mMZ2.bnd(() => mM13\n                    .bnd(score, 1)\n                    .bnd(next2, (mM13.x % 5 === 0), mMZ5)  // Releases mMZ5.\n                    .bnd(newRoll)) ),\n      (mMZ4.bnd(() => mM13\n                    .bnd(score, 3)\n                    .bnd(next2, (mM13.x % 5 === 0), mMZ5) \n                    .bnd(newRoll)) ),\n          (mMZ5.bnd(() => mM13   // Released when the result mod 5 is 0.\n                        .bnd(score,5)\n                        .bnd(v => mM13.ret(v)\n                        .bnd(next, 25, mMZ6))) ),\n              (mMZ6.bnd(() => mM9.bnd(score2)  // Released when the score is 25 \n                            .bnd(next,3,mMZ7)) ),\n                  (mMZ7.bnd(() => mM13.bnd(winner)) ),                \n      (mM3.bnd(x => mM7\n                    .ret(calc(x[0], mM8.x, x[1]))\n                    .bnd(next, 18, mMZ4)  // Releases mMZ4.\n                    .bnd(next, 20, mMZ2) \n                    .bnd(() => mM1.bnd(push,mM7.x)  // Returns an anonymous monad.\n                    .bnd(mM1.ret)   // Gives mM1 the anonymous monad\'s value.\n                    .bnd(displayOff, ((mM1.x.length)+\'\'))\n                    .bnd(() => mM3\n                    .ret([])\n                    .bnd(() => mM4\n                    .ret(0).bnd(mM8.ret))))) ) \n  ))\n}  ');

var mult = (0, _motorcycleDom.h)('pre', '  const mMmult = new Monad({}, \'mMmult\')\n\n  mMmult.x.addA = sources.DOM.select(\'input#addA\').events(\'input\'),\n  mMmult.x.addB = sources.DOM.select(\'input#addB\').events(\'input\'),\n  mMmult.x.product = 0;\n  mMmult.x.result = combine((a,b) => a.target.value * b.target.value, mMmult.x.addA, mMmult.x.addB)\n\n  const mult$ = mMmult.x.result.map(v => {\n    mMmult.x.product = v;\n  });\n  ');

var add = (0, _motorcycleDom.h)('pre', '  var addS = function addS (x,y) {\n    if (typeof x === \'number\') {\n      return ret(x + y);\n    }\n    else if (typeof x.product === \'number\') {\n      return ret(x.product + y);\n    }\n    else console.log(\'Problem in addS\');\n  }\n  ');

exports['default'] = { monads: monads, fib: fib, driver: driver, main: main, next: next, game: game, updateCalc: updateCalc, mult: mult, add: add };
module.exports = exports['default'];

},{"@motorcycle/dom":74}],168:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
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
  return new Monad(v);
};

module.exports = {

  MonadIter: function MonadIter() {
    var _this = this;
    this.p = function () {};

    this.release = function () {
      return _this.p();
    };

    this.bnd = function (func) {
      _this.p = func;
    };
  },

  Monad: function Monad(z, g) {
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
    }, this.ret = function (a) {
      _this.x = a;
      return _this;
    };
  },

  ret: function ret(v) {
    return new Monad(v);
  },

  cube: function cube(v) {
    return ret(v * v * v);
  },

  double: function double(v) {
    return ret(v + v);
  },

  add: function add(a, b) {
    return ret(a + b);
  },

  addAr: function addAr(a, b) {
    return ret(a.map(function (v) {
      return v * 1 + b * 1;
    }));
  },

  M: function M(a, b) {
    return new Monad(a, b);
  },

  MI: function MI() {
    return new MonadIter();
  },

  mM1: new Monad([], 'mM1'),
  mM2: new Monad(0, 'mM2'),
  mM3: new Monad(0, 'mM3'),
  mM4: new Monad([], 'mM4'),
  mM5: new Monad(0, 'mM5'),
  mM6: new Monad(0, 'mM6'),
  mM7: new Monad(0, 'mM7'),
  mM8: new Monad(0, 'mM8'),
  mM9: new Monad(0, 'mM9'),
  mM10: new Monad(0, 'mM10'),
  mM11: new Monad([], 'mM11'),
  mM12: new Monad(0, 'mM12'),
  mM13: new Monad(0, 'mM13'),
  mM14: new Monad(0, 'mM14'),
  mM15: new Monad(0, 'mM15'),
  mM16: new Monad(0, 'mM16'),
  mM17: new Monad(0, 'mM17'),
  mM18: new Monad(0, 'mM18'),
  mM19: new Monad(0, 'mM19'),
  mMscbd: new Monad([], 'mMscbd'),
  mMmessages: new Monad([], 'mMmessages'),
  mMscoreboard: new Monad([], 'mMscoreboard'),
  mMmsg: new Monad([], 'mMmsg'),
  mMgoals: new Monad(0, 'mMgoals'),
  mMgoals2: new Monad('', 'mMgoals2'),
  mMnbrs: new Monad([], 'mMnbrs'),
  mMnumbers: new Monad([], 'mMnumbers'),
  mMname: new Monad('', 'mMname'),
  mMar: new Monad([1, 2, 3, 4, 5], 'mMar'),
  mMscores: new Monad('', 'mMscores'),
  mMprefix: new Monad('', 'mMprefix'),
  mMfib: new Monad([0, 1], 'mMfib'),
  mMmain: new Monad(null, 'mMmain'),
  mMcalc: new Monad(null, 'mMcalc'),
  mMadd: new Monad(0, 'mMadd'),

  mMZ1: new MonadIter(),
  mMZ2: new MonadIter(),
  mMZ3: new MonadIter(),
  mMZ4: new MonadIter(),
  mMZ5: new MonadIter(),
  mMZ6: new MonadIter(),
  mMZ7: new MonadIter(),
  mMZ8: new MonadIter(),
  mMZ9: new MonadIter(),

  mMZ10: new MonadIter(),
  mMZ11: new MonadIter(),
  mMZ12: new MonadIter(),
  mMZ13: new MonadIter(),
  mMZ14: new MonadIter(),
  mMZ15: new MonadIter(),
  mMZ16: new MonadIter(),
  mMZ17: new MonadIter(),
  mMZ18: new MonadIter(),
  mMZ19: new MonadIter(),

  mMZ20: new MonadIter(),
  mMZ21: new MonadIter(),
  mMZ22: new MonadIter(),
  mMZ23: new MonadIter(),
  mMZ24: new MonadIter(),
  mMZ25: new MonadIter(),
  mMZ26: new MonadIter(),
  mMZ27: new MonadIter(),
  mMZ28: new MonadIter(),
  mMZ29: new MonadIter(),

  fib: function fib(x, k) {
    var j = k;
    while (j > 0) {
      x = [x[1], x[0] + x[1]];
      j -= 1;
    }
    return ret('fibonacci ' + k + ': ' + x[0]);
  },

  toNums: function toNums(x) {
    var y = x.map(function (x) {
      return parseFloat(x);
    });
    return ret(y);
  },

  calc: function calc(a, op, b) {
    var result;
    switch (op) {
      case "add":
        result = parseFloat(a) + parseFloat(b);
        break;
      case "subtract":
        result = a - b;
        break;
      case "mult":
        result = a * b;
        break;
      case "div":
        result = a / b;
        break;
      case "concat":
        result = (a + "" + b) * 1.0;
        break;
      default:
        'Major Malfunction in calc.';
    }
    return result;
  },

  pause: function pause(x, t, mon2) {
    var time = t * 1000;
    setTimeout(function () {
      mon2.release();
    }, time);
    return mon2;
  },

  wait: function wait(x, y, mon2) {
    if (x === y) {
      mon2.release();
    }
    return mon2;
  },

  unshift: function unshift(x, v) {
    x.unshift(v);
    return ret(x);
  },

  toFloat: function toFloat(x) {
    newx: x.map(function (a) {
      return parseFloat(a);
    });
    return ret(newx);
  },

  push: function push(x, j) {
    if (Array.isArray(x)) {
      return ret(x.push(j));
    }
    return ret(x);
  },

  push: function push(x, v) {
    var ar = x;
    ar.push(v);
    var cleanX = ar.filter(function (v) {
      return v !== "" && v !== undefined;
    });
    return ret(cleanX);
  },
  splice: function splice(x, j, k) {
    if (Array.isArray(x)) {
      return ret(x.splice(j, k));
    }
    return ret(x);
  },

  clean: function clean(x) {
    return ret(x.filter(function (v) {
      return v !== "";
    }));
  },

  filter: function filter(x, condition) {
    if (Array.isArray(x)) {
      return ret(x.filter(function (v) {
        return condition;
      }));
    }
    return ret(x);
  },

  map: function map(x, y) {
    if (Array.isArray(x)) {
      return ret(x.map(function (v) {
        return y;
      }));
    }
    return ret(x);
  },

  reduce: function reduce(x, y) {
    if (Array.isArray(x) && x.length > 0) {
      return ret(x.reduce(y));
    }
    return ret(x);
  },

  pop: function pop(x) {
    var v = x[x.length - 1];
    console.log('In pop. v: ', v);
    return ret(v);
  },

  next: function next(x, y, mon2) {
    if (x === y) {
      mon2.release();
    }
    return ret(x);
  },

  next2: function next(x, condition, mon2) {
    if (condition) {
      mon2.release();
    }
    return ret(x);
  },

  hyp: function hyp(x, y) {
    return Math.sqrt(x * x + y * y);
  },

  doub: function doub(v) {
    return ret(v + v);
  },

  square: function square(v) {
    return ret(v * v);
  },

  mult: function mult(x, y) {
    return ret(x * y);
  },

  log: function log(x, message) {
    console.log(message);
    var mon = new Monad(x);
    return mon;
  },

  delay: function delay(x, mon) {
    return new Promise(function (resolve, reject) {
      setTimeout(resolve, 2000);
    });
  }
};

},{}],169:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _motorcycleCore = require('@motorcycle/core');

var _motorcycleCore2 = _interopRequireDefault(_motorcycleCore);

var _indexJs = require('./index.js');

var _motorcycleDom = require('@motorcycle/dom');

var _most = require('most');

var _code = require('./code');

var _code2 = _interopRequireDefault(_code);

var Group = 'solo';
var Goals = 0;
var Name;
var tempStyle = { display: 'inline' };
var tempStyle2 = { display: 'none' };
_indexJs.mM6.ret('');

function createWebSocket(path) {
  var host = window.location.hostname;
  if (host == '') host = 'localhost';
  var uri = 'ws://' + host + ':3099' + path;
  var Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
  return new Socket(uri);
}

var socket = createWebSocket('/');

var websocketsDriver = function websocketsDriver() {
  return (0, _most.create)(function (add) {
    socket.onmessage = function (msg) {
      return add(msg);
    };
  });
};

_indexJs.mM1.ret([0, 0, 0, 0]);
_indexJs.mM3.ret([]);

function main(sources) {
  _indexJs.mMfib.ret([0, 1]);
  console.log(_indexJs.ret);

  var messages$ = sources.WS.map(function (e) {
    return _indexJs.mMar.ret(e.data.split(',')).bnd(function (array) {
      return _indexJs.mMscores.ret(array[3].split("<br>")).bnd(function () {
        return _indexJs.mMname.ret(_indexJs.mMar.x[2]).bnd(function () {
          return _indexJs.mMprefix.ret(_indexJs.mMar.x[0]).bnd(_indexJs.next, 'CA#$42', _indexJs.mMZ10).bnd(_indexJs.next, 'CB#$42', _indexJs.mMZ11).bnd(_indexJs.next, 'CC#$42', _indexJs.mMZ12).bnd(_indexJs.next, 'CD#$42', _indexJs.mMZ13).bnd(_indexJs.next, 'CE#$42', _indexJs.mMZ14).bnd(_indexJs.next, 'EE#$42', _indexJs.mMZ15);
        });
      });
    });
  });
  _indexJs.mMmain.bnd(function () {
    return _indexJs.mMZ10.bnd(function () {
      return _indexJs.mM1.ret([_indexJs.mMar.x[3], _indexJs.mMar.x[4], _indexJs.mMar.x[5], _indexJs.mMar.x[6]]).bnd(displayInline, '1').bnd(displayInline, '2').bnd(displayInline, '3');
    });
  }), _indexJs.mMZ11.bnd(function () {
    return _indexJs.mMscbd.ret(_indexJs.mMscores.x).bnd(updateScoreboard).bnd(function () {
      return _indexJs.mM3.ret([]).bnd(function () {
        return _indexJs.mM8.ret(0);
      });
    });
  }), _indexJs.mMZ12.bnd(function () {
    return _indexJs.mM6.ret(_indexJs.mMname.x + ' successfully logged in.');
  }), _indexJs.mMZ13.bnd(function () {
    return _indexJs.mMar.bnd(_indexJs.splice, 0, 3).bnd(_indexJs.reduce, function (a, b) {
      return a + ", " + b;
    }).bnd(function () {
      return _indexJs.mMmsg.bnd(_indexJs.push, _indexJs.mMname.x + ': ' + _indexJs.mMar.x).bnd(updateMessages);
    });
  }), _indexJs.mMZ14.bnd(function () {
    return _indexJs.mMgoals2.ret('The winner is ' + _indexJs.mMname.x);
  }), _indexJs.mMZ15.bnd(function () {
    return _indexJs.mMgoals2.ret('A player named ' + _indexJs.mMname.x + 'is currently logged in. Page will refresh in 4 seconds.').bnd(refresh);
  });

  var loginPress$ = sources.DOM.select('input.login').events('keydown');

  var loginPressAction$ = loginPress$.map(function (e) {
    var v = e.target.value;
    if (v == '') {
      return;
    }
    if (e.keyCode == 13) {
      socket.send("CC#$42" + v);
      Name = v;
      _indexJs.mM3.ret([]).bnd(_indexJs.mM2.ret);
      e.target.value = '';
      tempStyle = { display: 'none' };
      tempStyle2 = { display: 'inline' };
    }
  });

  var groupPress$ = sources.DOM.select('input.group').events('keydown');

  var groupPressAction$ = groupPress$.map(function (e) {
    var v = e.target.value;
    if (v == '') {
      return;
    }
    if (e.keyCode == 13) Group = e.target.value;
    socket.send('CO#$42,' + e.target.value + ',' + Name + ',' + e.target.value);
  });

  var mMmult = new _indexJs.Monad({}, 'mMmult');

  mMmult.x.addA = sources.DOM.select('input#addA').events('input'), mMmult.x.addB = sources.DOM.select('input#addB').events('input'), mMmult.x.product = 0;
  mMmult.x.result = (0, _most.combine)(function (a, b) {
    return a.target.value * b.target.value;
  }, mMmult.x.addA, mMmult.x.addB);

  var mult$ = mMmult.x.result.map(function (v) {
    mMmult.x.product = v;
  });

  var addS = function addS(x, y) {
    if (typeof x === 'number') {
      return (0, _indexJs.ret)(x + y);
    } else if (typeof x.product === 'number') {
      return (0, _indexJs.ret)(x.product + y);
    } else console.log('Problem in addS');
  };

  var messagePress$ = sources.DOM.select('input.inputMessage').events('keydown');

  var messagePressAction$ = messagePress$.map(function (e) {
    if (e.keyCode == 13) {
      socket.send('CD#$42,' + Group + ',' + Name + ',' + e.target.value);
      e.target.value = '';
    }
  });

  var numClick$ = sources.DOM.select('.num').events('click');

  var numClickAction$ = numClick$.map(function (e) {
    _indexJs.mM3.bnd(_indexJs.push, e.target.textContent).bnd(function () {
      _indexJs.mM1.x[e.target.id] = "";
    });
    if (_indexJs.mM3.x.length === 2 && _indexJs.mM8.x !== 0) {
      updateCalc();
    }
  }).startWith(_indexJs.mM1.x[0]);

  var opClick$ = sources.DOM.select('.op').events('click');

  var opClickAction$ = opClick$.map(function (e) {
    _indexJs.mM8.ret(e.target.textContent);
    if (_indexJs.mM3.x.length === 2) {
      updateCalc();
    }
  });

  var rollClick$ = sources.DOM.select('.roll').events('click');

  var rollClickAction$ = rollClick$.map(function (e) {
    _indexJs.mM13.ret(_indexJs.mM13.x - 1);
    socket.send('CG#$42,' + Group + ',' + Name + ',' + -1 + ',' + 0);
    socket.send('CA#$42,' + Group + ',' + Name + ',6,6,12,20');
  });

  var fibPress$ = sources.DOM.select('input#code').events('keydown');

  var fibPressAction$ = fibPress$.map(function (e) {
    var v = e.target.value;
    if (v == '') {
      return;
    }
    if (e.keyCode == 13 && Number.isInteger(v * 1)) {
      var result = _indexJs.mMfib.bnd(_indexJs.fib, v).x;
      _indexJs.mM19.ret(result);
    }
    if (e.keyCode == 13 && !Number.isInteger(v * 1)) _indexJs.mM19.ret("You didn't provide an integer");
  });

  var calcStream$ = (0, _most.merge)(mult$, fibPressAction$, groupPressAction$, rollClickAction$, messagePressAction$, loginPressAction$, messages$, numClickAction$, opClickAction$);

  return {
    DOM: calcStream$.map(function () {
      return (0, _motorcycleDom.h)('div.content', [(0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('h2', 'JS-monads-part4'), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('span', 'This installment of the JS-monads series features '), (0, _motorcycleDom.h)('a', { props: { href: 'https://github.com/motorcyclejs' }, style: { color: '#EECCFF' } }, 'Motorcyclejs'), (0, _motorcycleDom.h)('span', ' handling the monads. Motorcyclejs is Cyclejs, only using '), (0, _motorcycleDom.h)('a', { props: { href: 'https://github.com/paldepind/snabbdom' }, style: { color: '#EECCFF' } }, 'Snabbdom'), (0, _motorcycleDom.h)('span', ' instead of "virtual-dom", and '), (0, _motorcycleDom.h)('a', { props: { href: 'https://github.com/cujojs/most' }, style: { color: '#EECCFF' } }, 'Most'), (0, _motorcycleDom.h)('span', ' instead of "RxJS".'), (0, _motorcycleDom.h)('h3', 'The Game From JS-monads-part3'), (0, _motorcycleDom.h)('p', 'If clicking two numbers and an operator (in any order) results in 20 or 18, the score increases by 1 or 3, respectively. If the score becomes 0 mod 5, 5 points are added. A score of 25 results in one goal. That can only be achieved by arriving at a score of 20, which jumps the score to 25. Directly computing 25 results in a score of 30, and no goal. Each time ROLL is clicked, one point is deducted. Three goals wins the game. '), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('button#0.num', _indexJs.mM1.x[0] + ''), (0, _motorcycleDom.h)('button#1.num', _indexJs.mM1.x[1] + ''), (0, _motorcycleDom.h)('button#2.num', _indexJs.mM1.x[2] + ''), (0, _motorcycleDom.h)('button#3.num', _indexJs.mM1.x[3] + ''), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('button#4.op', 'add'), (0, _motorcycleDom.h)('button#5.op', 'subtract'), (0, _motorcycleDom.h)('button#5.op', 'mult'), (0, _motorcycleDom.h)('button#5.op', 'div'), (0, _motorcycleDom.h)('button#5.op', 'concat'), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('button.roll', { style: tempStyle2 }, 'ROLL'), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('div.winner', _indexJs.mMgoals2.x + ''), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('p.login', { style: tempStyle }, 'Please enter some name.'), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('input.login', { style: tempStyle }), (0, _motorcycleDom.h)('p', _indexJs.mM6.x.toString()), (0, _motorcycleDom.h)('p.group', { style: tempStyle2 }, 'Change group: '), (0, _motorcycleDom.h)('input.group', { style: tempStyle2 }), (0, _motorcycleDom.h)('div.messages', [(0, _motorcycleDom.h)('p', { style: tempStyle2 }, 'Enter messages here: '), (0, _motorcycleDom.h)('input.inputMessage', { style: tempStyle2 }), (0, _motorcycleDom.h)('div', _indexJs.mMmessages.x)]), (0, _motorcycleDom.h)('p.group2', [(0, _motorcycleDom.h)('p', 'Group: ' + Group), (0, _motorcycleDom.h)('p', 'Goals: ' + _indexJs.mMgoals.x), (0, _motorcycleDom.h)('div.scoreDisplay', [(0, _motorcycleDom.h)('span', 'player[score][goals]'), (0, _motorcycleDom.h)('div', _indexJs.mMscoreboard.x)])]), (0, _motorcycleDom.h)('span', 'People in the same group, other than solo, share text messages and dice rolls. '), (0, _motorcycleDom.h)('hr'), (0, _motorcycleDom.h)('p', 'Here are the definitions of the monad constructors: '), _code2['default'].monads, (0, _motorcycleDom.h)('p', 'As is apparent from the definition of Monad, when some monad "m" uses its "bnd" method on some function "f(x,v)", the first argument is the value of m (which is m.x). The return value of m.bnd(f,v) is f(m.x, v). Here is a function which takes two arguments: '), _code2['default'].fib, (0, _motorcycleDom.h)('p', 'If you enter some number "n" in the box below, mMfib, whose initial value is [0,1], uses its bnd method as follows:'), (0, _motorcycleDom.h)('p', { style: { color: '#FF0000' } }, 'mMfib.bnd(fib,n)'), (0, _motorcycleDom.h)('p', 'The result will be displayed undernieth the input box. '), (0, _motorcycleDom.h)('br'), (0, _motorcycleDom.h)('input#code'), (0, _motorcycleDom.h)('p#code2', _indexJs.mM19.x), (0, _motorcycleDom.h)('hr'), (0, _motorcycleDom.h)('span', 'I won\'t discuss every aspect of the multi-player websockets game code. It is open source and available at '), (0, _motorcycleDom.h)('a', { props: { href: 'https://github.com/dschalk/JS-monads-part4' }, style: { color: '#EECCFF' } }, 'https://github.com/dschalk/JS-monads-part4'), (0, _motorcycleDom.h)('span', ' I want to show how I used the monads to organize code and to control browser interactions with the Haskell websockets server. Let\'s begin with the parsing and routing of incoming websockets messages. This is how the websockets driver is defined:'), _code2['default'].driver, (0, _motorcycleDom.h)('p', '"create" comes from the most library. It creates a blank stream; and with "add", it becomes a stream of incoming messages. '), (0, _motorcycleDom.h)('p', 'This is how the driver, referenced by "sources.WS", is used: '), _code2['default'].main, (0, _motorcycleDom.h)('p', 'MonadIter instances have the "mMZ" prefix. Each instance has a "p" attribute which is a selector pointing to all of the code which comes after the call to its "bnd" method. Here is its definition of "next": '), _code2['default'].next, (0, _motorcycleDom.h)('p', ' "main.js" has other code for handling keyboard and mouse events, and for combining everything into a single stream. It returns a stream of descriptions of the virtual DOM. The Motorcycle function "run" takes main and the sources object, with attributes DOM and JS referencing the drivers. It is called only once. "run" establishes the relationships between "main" and the drivers. After that, everything is automatic. Click events, keypress events, and websockets messages come in, Most updates the virtual dom stream, and Snabbdom diffs and patches the DOM. '), (0, _motorcycleDom.h)('hr'), (0, _motorcycleDom.h)('p', 'Game clicks are handled as follows: '), _code2['default'].game, (0, _motorcycleDom.h)('p', 'mM3 is populated by clicks on numbers, mM8 changes from 0 to the name of a clicked operator. So, when mM3.x.length equals 2 and mM8 is no longer 0, it is time to call updateCalc. Here is updateCalc: '), _code2['default'].updateCalc, (0, _motorcycleDom.h)('p', 'This is light-weight, non-blocking asynchronous code. There are no data base, ajax, or websockets calls; nothing that would require error handling. Promises and JS6 iterators can be used to avoid "pyramid of doom" nested code structures, but that would entail excess baggage here. updateCalc illuminates a niche where the monads are right at home. '), (0, _motorcycleDom.h)('hr'), (0, _motorcycleDom.h)('div.caption', 'Name Spaces'), (0, _motorcycleDom.h)('p', 'The monads can serve as name spaces. A monad\'s value can be an object with as many attributes and methods as you like. In the next example, we create a monad named "mMmult" and use it to encapsulate a simple computation in which two numbers are multiplied and added to the number 1. The following snippet shows monad "mMmult" being created and provided with methods and a number attribute. It also shows the definition of mult$.  '), _code2['default'].mult, (0, _motorcycleDom.h)('p', 'mult$ merges into the stream that initiates each new cycle of the virtual DOM. "mMmult.x.product" is displayed in the paragraph directly below this one.'), (0, _motorcycleDom.h)('p#add', mMmult.x.product), (0, _motorcycleDom.h)('p', 'Enter two numbers below. '), (0, _motorcycleDom.h)('input#addA'), (0, _motorcycleDom.h)('span', ' * '), (0, _motorcycleDom.h)('input#addB'), (0, _motorcycleDom.h)('p', 'mMmult is a const, so it can\'t be mutated; and since it is a specialized monad created for a single purpose, we wouldn\'t expect any team members, advertizers, or anyone else to disrupt the computation by mutating the object mMmult.x or altering its contents. The paragraph below contains the result of a computation flowing out of mMmult:'), (0, _motorcycleDom.h)('p.add', mMmult.bnd(addS, 10000).bnd(addS, 1).bnd(_indexJs.double).x), (0, _motorcycleDom.h)('p', 'It is the result of placing this in the above paragraph'), (0, _motorcycleDom.h)('pre', 'mMmult.bnd(addS, 10000).bbd(addS, 1).bnd(double).x'), (0, _motorcycleDom.h)('p', 'Of course it would have been more efficient to add 1001 in the first place, but this is a demonstration. Here is the definition of the polymorphic function addS: '), _code2['default'].add, (0, _motorcycleDom.h)('p'), (0, _motorcycleDom.h)('p'), (0, _motorcycleDom.h)('hr'), (0, _motorcycleDom.h)('p'), (0, _motorcycleDom.h)('p'), (0, _motorcycleDom.h)('p'), (0, _motorcycleDom.h)('p')]);
    })
  };
}

function updateCalc() {
  _indexJs.mMcalc.bnd(function () {
    return _indexJs.mMZ2.bnd(function () {
      return _indexJs.mM13.bnd(score, 1).bnd(_indexJs.next2, _indexJs.mM13.x % 5 === 0, _indexJs.mMZ5) // Releases mMZ5.
      .bnd(newRoll);
    }), _indexJs.mMZ4.bnd(function () {
      return _indexJs.mM13.bnd(score, 3).bnd(_indexJs.next2, _indexJs.mM13.x % 5 === 0, _indexJs.mMZ5).bnd(newRoll);
    }), _indexJs.mMZ5.bnd(function () {
      return _indexJs.mM13.bnd(score, 5).bnd(function (v) {
        return _indexJs.mM13.ret(v).bnd(_indexJs.next, 25, _indexJs.mMZ6);
      });
    }), _indexJs.mMZ6.bnd(function () {
      return _indexJs.mM9.bnd(score2).bnd(_indexJs.next, 3, _indexJs.mMZ7);
    }), _indexJs.mMZ7.bnd(function () {
      return _indexJs.mM13.bnd(winner);
    }), _indexJs.mM3.bnd(function (x) {
      return _indexJs.mM7.ret((0, _indexJs.calc)(x[0], _indexJs.mM8.x, x[1])).bnd(_indexJs.log, _indexJs.mM7.x).bnd(_indexJs.next, 18, _indexJs.mMZ4) // Releases mMZ4.
      .bnd(_indexJs.next, 20, _indexJs.mMZ2).bnd(function () {
        return _indexJs.mM1.bnd(_indexJs.push, _indexJs.mM7.x) // Returns an anonymous monad.
        .bnd(_indexJs.mM1.ret) // Gives mM1 the anonymous monad's value.
        .bnd(displayOff, _indexJs.mM1.x.length + '').bnd(function () {
          return _indexJs.mM3.ret([]).bnd(function () {
            return _indexJs.mM4.ret(0).bnd(_indexJs.mM8.ret);
          });
        });
      });
    });
  });
}

var updateScoreboard = function updateScoreboard(v) {
  _indexJs.mMscoreboard.ret([]);
  var ar = _indexJs.mMscbd.x;
  var keys = Object.keys(ar);
  for (var k in keys) {
    _indexJs.mMscoreboard.bnd(_indexJs.unshift, (0, _motorcycleDom.h)('div.indent', ar[k]));
  }
  return _indexJs.mMscoreboard;
};

window.onload = function (event) {
  console.log('onopen event: ', event);
};

var updateMessages = function updateMessages(v) {
  _indexJs.mMmessages.ret([]);
  var ar = _indexJs.mMmsg.x;
  var keys = Object.keys(ar);
  for (var k in keys) {
    _indexJs.mMmessages.bnd(_indexJs.unshift, (0, _motorcycleDom.h)('div', ar[k]));
  }
  return _indexJs.mMmessages;
};

var displayOff = function displayOff(x, a) {
  document.getElementById(a).style.display = 'none';
  return (0, _indexJs.ret)(x);
};

var displayInline = function displayInline(x, a) {
  if (document.getElementById(a)) document.getElementById(a).style.display = 'inline';
  return (0, _indexJs.ret)(x);
};

var score = function score(v, j) {
  socket.send('CG#$42,' + Group + ',' + Name + ',' + j + ',' + 0);
  return _indexJs.mM13.ret(v + j);
};

var score2 = function score2() {
  _indexJs.mMgoals.ret(_indexJs.mMgoals.x + 1);
  var j = -25;
  socket.send('CG#$42,' + Group + ',' + Name + ',' + j + ',' + 1);
  _indexJs.mM13.ret(0);
  return _indexJs.mMgoals;
};

var winner = function winner() {
  var k = -3;
  _indexJs.mMgoals.ret(_indexJs.mMgoals.x - 3);
  socket.send('CG#$42,' + Group + ',' + Name + ',' + 0 + ',' + k);
  socket.send('CE#$42,' + Group + ',' + Name + ',nothing ');
  return (0, _indexJs.ret)(0);
};

var newRoll = function newRoll(v) {
  socket.send('CA#$42,' + Group + ',' + Name + ',6,6,12,20');
  return (0, _indexJs.ret)(v);
};

var refresh = function refresh() {
  setTimeout(function () {
    document.location.reload(false);
  }, 4000);
};

var sources = {
  DOM: (0, _motorcycleDom.makeDOMDriver)('#main-container'),
  WS: websocketsDriver
};

_motorcycleCore2['default'].run(main, sources);

},{"./code":167,"./index.js":168,"@motorcycle/core":1,"@motorcycle/dom":74,"most":165}]},{},[169]);
