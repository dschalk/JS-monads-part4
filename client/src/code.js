import {h, pre} from '@motorcycle/dom'; 


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
    window[_this.id] = new Monad(a,_this.id);
    return window[_this.id];
  };
};

var mMname = new Monad('Fred', 'mMname');
var mMgroup = new Monad('solo', 'mMgroup');

const monads = h('pre', {style: {color: '#AFEEEE' }}, `  var Monad = function Monad(z, g) {
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

    constructor() {

      this.p = function() {};

      this.release = function () {
        return this.p();
      }
 
      this.bnd = function (func) {
          this.p = func;
      }
    }
  }; ` )

var fib = h('pre', `  var fib = function fib(x,k) {
    let j = k;
    while (j > 0) {
      x = [x[1], x[0] + x[1]];
      j -= 1;
    }
    return ret('fibonacci ' + k + ' = ' + x[0]);   // An anonymous monad holding the result.
  };
` )  


var driver = h('pre', `  var websocketsDriver = function () {
      return create((add) => {
        socket.onmessage = msg => add(msg)
      })
  };
` )

var main = h('pre', `  const messages$ = (sources.WS).map(e => 
    mMar.ret(e.data.split(','))
    .bnd(array => mMscores.ret(array[3].split("<br>"))
    .bnd(() => mMsender.ret(mMar.x[2])
    .bnd(() => mMprefix.ret(mMar.x[0])
      .bnd(next, 'CA#$42', mMZ10)
      .bnd(next, 'CB#$42', mMZ11)
      .bnd(next, 'CC#$42', mMZ12)
      .bnd(next, 'CD#$42', mMZ13)
      .bnd(next, 'CE#$42', mMZ14)
      .bnd(next, 'EE#$42', mMZ15)))));
    mMmain.bnd(() =>
    (mMZ10.bnd(() => mM1
      .ret([mMar.x[3], mMar.x[4], mMar.x[5], mMar.x[6]])
      .bnd(() => push(mMsaveAr.x, mMsave.ret([mMar.x[3], mMar.x[4], mMar.x[5], mMar.x[6]]), mMsaveAr)
      .bnd(() => mMindex2.bnd(add,1)
      .bnd(mMindex2.ret)
      .bnd(displayInline,'0')
      .bnd(displayInline,'1')
      .bnd(displayInline,'2')
      .bnd(displayInline,'3'))))),
    (mMZ11.bnd(() => mMscbd
      .ret(mMscores.x)
      .bnd(updateScoreboard)
      .bnd(() => mM3.ret([])
      .bnd(() => mM8.ret(0) )))),
    (mMZ12.bnd(() => mM6
      .ret( mMsender.x + ' successfully logged in.'))),
    (mMZ13.bnd(() => mMar
      .bnd(splice2, 0, 3, mMar)
      .bnd(reduce, (a,b) => a + ", " + b)
      .bnd(() => mMmsg
      .bnd(push, mMsender.x + ': ' + mMar.x, mMmsg)
      .bnd(updateMessages)))),
    (mMZ14.bnd(() => mMgoals2.ret('The winner is ' + mMname.x ))), 
    (mMZ15.bnd(() => mMgoals2.ret('A player named ' + 
        mMname.x + 'is currently logged in. Page will refresh in 4 seconds.')
      .bnd(refresh))))  `  )

var next = h('pre',  `  var next = function next(x, y, mon2) {
    if (x === y) {
      mon2.release();
    }
    return ret(x);  // An anonymous monad with the value of the calling monad.
  } `  )

var game = h('pre',`  const numClick$ = sources.DOM
    .select('.num').events('click');
     
  const numClickAction$ = numClick$.map(e => {
    mM3
    .bnd(push,e.target.textContent, mM3)
    mM28.ret([mM1.x[0], mM1.x[1], mM1.x[2], mM1.x[3]]);
    mM28.x[e.target.id] = "";
    mM1.ret(mM28.x)
    .bnd(cleanup); 
    if (mM3.x.length === 2 && mM8.x !== 0) {updateCalc();}
  }).startWith(mM1.x[0]);

  const opClick$ = sources.DOM
    .select('.op').events('click');

  const opClickAction$ = opClick$.map(e => {
    mM8.ret(e.target.textContent);
    if (mM3.x.length === 2) {updateCalc();}
  })

  const rollClick$ = sources.DOM
    .select('.roll').events('click');

  const rollClickAction$ = rollClick$.map(e => {  
    mM13.ret(mM13.x - 1);
    socket.send('CG#$42,' + mMgroup.x.trim() + ',' + mMname.x.trim() + ',' + -1 + ',' + mMgoals.x    );
    socket.send(i\`CA#$42,${mMgroup.x},${mMname.x.trim()},6,6,12,20 \`      ) 
     `  )

var updateCalc = h('pre',  `  function updateCalc() { 
  mMcalc.bnd(() => (
       (mMZ2.bnd(() => mM13
                    .bnd(score, 1)
                    .bnd(next2, (mM13.x % 5 === 0), mMZ5)  // Releases mMZ5.
                    .bnd(newRoll))),
       (mMZ4.bnd(() => mM13
                    .bnd(score, 3)
                    .bnd(next2, (mM13.x % 5 === 0), mMZ5) 
                    .bnd(newRoll))),
           (mMZ5.bnd(() => mM13
                        .bnd(score,5)
                        .bnd(v => mM13.ret(v)
                        .bnd(next, 25, mMZ6)))),
               (mMZ6.bnd(() => mM9.bnd(score2) 
                            .bnd(next,3,mMZ7))),
                  (mMZ7.bnd(() => mM13.bnd(winner))),                 
       (mM3.bnd(x => mM7
                    .ret(calc(x[0], mM8.x, x[1]))
                    .bnd(next, 18, mMZ4)  // Releases mMZ4.
                    .bnd(next, 20, mMZ2) 
                    .bnd(() => mM1.bnd(push, mM7.x, mM1)
                    .bnd(v => mM1.bnd(log, 'first ' + v))
                    .bnd(v => mMsaveAr.bnd(splice, ((mMindex2.x)+1), mMsave.ret(v).bnd(clean,mMsave), mMsaveAr))
                    .bnd(v => mM1.bnd(log, 'after ' + v))
                    .bnd(() => mMindex2.bnd(add,1))
                    .bnd(mMindex2.ret)
                    .bnd(displayOff, ((mM1.x.length)+''))
                    .bnd(() => mM3
                    .ret([])
                    .bnd(() => mM4
                    .ret(0).bnd(mM8.ret).bnd(cleanup)
                    )))))
  ))
}  `  )

var mult = h('pre',  `  mMmult.x.addA = sources.DOM.select('input#addA').events('input');
  mMmult.x.addB = sources.DOM.select('input#addB').events('input');
  mMmult.x.result = combine((a,b) => a.target.value * b.target.value, mMmult.x.addA, mMmult.x.addB);
  
  const mult$ = mMmult.x.result.map(v => {
    mMmult2.ret(v);
    mMtem.ret(v);
    mMtem2.ret(v);
    mM28.ret(v);
    mMpause.ret(0);
    mMpause2.ret(0);
  });
  `  )

var add = h('pre',  `  var addS = function addS (x,y) {
    if (typeof x === 'number') {
      return ret(x + y);
    }
    else if (typeof x.product === 'number') {
      return ret(x.product + y);
    }
    else console.log('Problem in addS');
  };
  `  )

var product2 = h('pre',  `  const unitDriver = function () {
    return periodic(1000, 1);  // Creates a stream of 1-1-1-1..., in one-second intervals.
  }
  
  const sources = {
    DOM: makeDOMDriver('#main-container'),
    WS: websocketsDriver,
    UNIT: unitDriver           // Added unitDriver to the sources object.
  }

  const unitAction$ = sources.UNIT.map(v => {  // unitDriver, cycled back inside of "run".
      mMunit.ret(mMunit.x + v)        
      .bnd(next, 1, mMZ26)  // Releases mMZ26 (below) after two seconds.
      .bnd(next, 2, mMZ27)
      .bnd(next, 3, mMZ28)
  });

  const mult2$ = mMmult.x.result.map(v => {
    mMZ26.bnd(() => mMmult2.bnd(add, 1000).bnd(mMmult2.ret));
    mMZ27.bnd(() => mMmult2.bnd(double).bnd(mMmult2.ret));
    mMZ28.bnd(() => mMmult2.bnd(add, 1).bnd(mMmult2.ret)); 
    mMunit.ret(0);
  });
  `  )

  const product3 = h('pre',  `  const unitDriver = function () {
    return periodic(1000, 1);  // Creates a stream of 1-1-1-1..., in one-second intervals.
  }
  
  const sources = {            // Re-used. Same as above. Feeds main.
    DOM: makeDOMDriver('#main-container'),
    WS: websocketsDriver,
    UNIT: unitDriver           // Added unitDriver to the sources object.
  }

  const mult4$ = sources.UNIT.map(v => {
    mMpause.ret(mMpause.x + v)
    if(mMpause.x ===1) {
      mMtem.bnd(add, 1000).bnd(mMtem.ret)
    }
    if(mMpause.x === 2) {
      mMtem.bnd(double).bnd(mMtem.ret)
    }
    if(mMpause.x === 3) {
      mMtem.bnd(add, 1).bnd(mMtem.ret) 
    }
  })
  `  )

var product4 = h('pre',  `  const mult5$ = mMmult.x.result
  .map(v => {mM27.ret(v)})
  .map(() => mM27.bnd(add, 1000).bnd(mM27.ret)).debounce(1000)
  .map(() => mM27.bnd(double).bnd(mM27.ret)).debounce(1000)
  .map(() => mM27.bnd(add, 1).bnd(mM27.ret)).debounce(2000)
  `  )

  const immutable = h('pre',  `  addOb.addC = sources.DOM
  .select('input#addC').events('input');
  addOb.addD = sources.DOM.select('input#addD').events('input');
  addOb.result = combine((a,b) => a.target.value * b.target.value, addOb.addC, addOb.addD);
  // Next, the above stream of products of the two numbers entered 
  // in input fields (the stream "addOb.result") is put to use. 
  const mult7$ = mMob.x.result.map(v => {
    mMt.ret(v);
    mMhistory.bnd(push,mMt).bnd(mMhistory.ret);
    mMpause2.ret(0);
  })
  // Now, the stream of 1's from sources.UNIT controlls the sequenced computation.
  const mult6$ = sources.UNIT.map(v => {
      mMpause2.ret(mMpause2.x + v)
      if(mMpause2.x === 1) {
        mMt.bnd(add, 1000).bnd(mMt.ret)
        mMhistory.bnd(push,mMt);
      }
      if(mMpause2.x === 2) {
        mMt.bnd(double).bnd(mMt.ret)
        mMhistory.bnd(push,mMt);
      }
      if(mMpause2.x === 3) {
        mMt.bnd(add, 1).bnd(mMt.ret) 
        mMhistory.bnd(push,mMt);
      }
    });

  const backClick$ = sources.DOM
    .select('#back').events('click');

  const backClickAction$ = backClick$.map(() => {
    if (mMindex.x > 0) {
     mMindex.ret(mMindex.x -1) 
    }
  });

  const forwardClick$ = sources.DOM
    .select('#forward').events('click');

  const forwardClickAction$ = forwardClick$.map(() => {
    if (mMindex.x < (mMhistory.x.length - 1)) {
     mMindex.ret(mMindex.x +1) 
    }
  })
  `  )

  var test = h('pre',  `  const testAction$ = test$.map(e => mMtest
    .ret(e.target.value*1)).delay(1000)
    .map(() => mMtest.ret(mMtest.x + 1000)).delay(1000)
    .map(() => mMtest.ret(mMtest.x * 2)).delay(1000)
    .map(() => mMtest.ret(mMtest.x + 1)).delay(1000)
  `  )

  var p4 = h('pre',  `  
  `  )

  var p5 = h('pre',  `  
  `  )

  var p6 = h('pre',  `  
  `  )





export default {monads, fib, driver, main, next, game, updateCalc, mult, add, product2, product3, product4, immutable, test}
