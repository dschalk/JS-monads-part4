import {h, pre} from '@motorcycle/dom'; 

var Group = 'solo';
var Name = 'Fred';

var monads = h('pre', `  class Monad {

    constructor(z,g) {

      this.x = z;
      if (arguments.length === 1) {this.id = 'anonymous'}
      else {this.id = g}

      this.bnd = function (func, ...args) {
        return func(this.x, ...args);
      };

      this.ret = function (a) {
        this.x = a;
        return this;
      };
    }
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

var main = h('pre', `  function main(sources) {
  const messages$ = (sources.WS).map(e => 
    mMar.ret(e.data.split(','))
    .bnd(array => mMscores.ret(array[3].split("<br>"))
    .bnd(() => mMname.ret(mMar.x[2])
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
      .bnd(displayInline,'1')
      .bnd(displayInline,'2')
      .bnd(displayInline,'3')))),
    (mMZ11.bnd(() => mMscbd
      .ret(mMscores.x)
      .bnd(updateScoreboard)
      .bnd(() => mM3.ret([])
      .bnd(() => mM8.ret(0) )))),
    (mMZ12.bnd(() => mM6
      .ret( mMname.x + ' successfully logged in.'))),
    (mMZ13.bnd(() => mMar
      .bnd(splice, 0 ,3)
      .bnd(reduce, (a,b) => a + ", " + b)
      .bnd(() => mMmsg
      .bnd(push, mMname.x + ': ' + mMar.x)
      .bnd(updateMessages)))),
    (mMZ14.bnd(() => mMgoals2.ret('The winner is ' + mMname.x ))), 
    (mMZ15.bnd(() => mMgoals2.ret('A player named ' + 
        mMname.x + 'is currently logged in. Page will refresh in 4 seconds.')
      .bnd(refresh)))  `  )

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
    .bnd(push,e.target.textContent)
    .bnd(() => {mM1.x[e.target.id] = "";})
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
    socket.send('CG#$42,' + Group + ',' + Name + ',' + -1 + ',' + 0);
    socket.send(\`CA#$42,${Group},${Name},6,6,12,20\`);
  });   `  )

var updateCalc = h('pre',  `  function updateCalc() { 
  mMcalc.bnd(() => (
      (mMZ2.bnd(() => mM13
                    .bnd(score, 1)
                    .bnd(next2, (mM13.x % 5 === 0), mMZ5)  // Releases mMZ5.
                    .bnd(newRoll)) ),
      (mMZ4.bnd(() => mM13
                    .bnd(score, 3)
                    .bnd(next2, (mM13.x % 5 === 0), mMZ5) 
                    .bnd(newRoll)) ),
          (mMZ5.bnd(() => mM13   // Released when the result mod 5 is 0.
                        .bnd(score,5)
                        .bnd(v => mM13.ret(v)
                        .bnd(next, 25, mMZ6))) ),
              (mMZ6.bnd(() => mM9.bnd(score2)  // Released when the score is 25 
                            .bnd(next,3,mMZ7)) ),
                  (mMZ7.bnd(() => mM13.bnd(winner)) ),                
      (mM3.bnd(x => mM7
                    .ret(calc(x[0], mM8.x, x[1]))
                    .bnd(next, 18, mMZ4)  // Releases mMZ4.
                    .bnd(next, 20, mMZ2) 
                    .bnd(() => mM1.bnd(push,mM7.x)  // Returns an anonymous monad.
                    .bnd(mM1.ret)   // Gives mM1 the anonymous monad's value.
                    .bnd(displayOff, ((mM1.x.length)+''))
                    .bnd(() => mM3
                    .ret([])
                    .bnd(() => mM4
                    .ret(0).bnd(mM8.ret))))) ) 
  ));
}  `  )

var mult = h('pre',  `  const mMmult = new Monad({}, 'mMmult')

  mMmult.x.addA = sources.DOM.select('input#addA').events('input'),
  mMmult.x.addB = sources.DOM.select('input#addB').events('input'),
  mMmult.x.product = 0;
  mMmult.x.product2 = 0;
  mMmult.x.result = combine((a,b) => a.target.value * b.target.value, mMmult.x.addA, mMmult.x.addB)

  const mult$ = mMmult.x.result.map(v => {
    mMmult.x.product = v;
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
      mMunit.ret(mMunit.x + v)  // mMunit is a monad dedicated to calling "next" with its bnd method.
      .bnd(next, 1, mMZ26)  // Releases mMZ26 (below) after two seconds.
      .bnd(next, 2, mMZ27)
      .bnd(next, 3, mMZ28)
  });

  const mult2$ = mMmult.x.result.map(v => {
    mMmult.x.product2 = v;
    let mMtemp = new Monad(v);
    mMZ26.bnd(() => mMtemp.bnd(add, 1000).bnd(mMtemp.ret).bnd(x => mMmult.x.product2 = x));
    mMZ27.bnd(() => mMtemp.bnd(double).bnd(mMtemp.ret).bnd(x => mMmult.x.product2 = x));
    mMZ28.bnd(() => mMtemp.bnd(add, 1).bnd(x => mMmult.x.product2 = x)); 
    mMunit.ret(0);
  });
  `  )


var product3 = h('pre',  `  const mult3$ = mMmult.x.result.map(v => {
    mMtem.ret(v)
    mMmult.x.product3 = v;
    mMpause.ret(0);
  })

  const mult4$ = sources.UNIT.map(v => {
      mMpause.ret(mMpause.x + v)
      if(mMpause.x ===1) {
        mMtem.bnd(add, 1000).bnd(mMtem.ret).bnd(x => mMmult.x.product3 = x)
      }
      if(mMpause.x === 2) {
        mMtem.bnd(double).bnd(mMtem.ret).bnd(x => mMmult.x.product3 = x)
      }
      if(mMpause.x === 3) {
        mMtem.bnd(add, 1).bnd(x => mMmult.x.product3 = x) 
      }
    })
  `  )

var product4 = h('pre',  `  const mult5$ = mMmult.x.result
  .debounce(3200).map(v => {mM27.ret(v)}).delay(1000)
  .map(() => mM27.bnd(add, 1000).bnd(mM27.ret)).delay(1000)
  .map(() => mM27.bnd(double).bnd(mM27.ret)).delay(1000)
  .map(() => mM27.bnd(add, 1).bnd(mM27.ret)).delay(1000)
  `  )



export default {monads, fib, driver, main, next, game, updateCalc, mult, add, product2, product3, product4}
