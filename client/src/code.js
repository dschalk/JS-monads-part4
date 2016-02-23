import {h, pre} from '@motorcycle/dom'; 

var Group = 'solo';
var Name = 'Fred';

var monads = h('pre', `  class Monad {
    var _this = this; 
    constructor(z,g) {

      this.x = z;
      if (arguments.length === 1) {this.id = 'anonymous'}
      else {this.id = g}

      this.bnd = function (func, ...args) {
        return func(_this.x, ...args);
      };

      this.ret = function (a) {
        _this.x = a;
        return _this;
      };
    }
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
  } ` )

var fib = h('pre', `  var fib = function fib(x,k) {
    let j = k;
    while (j > 0) {
      x = [x[1], x[0] + x[1]];
      j -= 1;
    }
    return ret('fibonacci ' + k + ' = ' + x[0]);   // An anonymous monad holding the result.
  }
` )  


var driver = h('pre', `  var websocketsDriver = function () {
      return create((add) => {
        socket.onmessage = msg => add(msg)
      })
  }
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
    (mMZ10.bnd(() => mMmain
      .bnd(map, mM1.ret([mMar.x[3], mMar.x[4], mMar.x[5], mMar.x[6]])
      .bnd(displayInline,'1')
      .bnd(displayInline,'2')
      .bnd(displayInline,'3')))),
    (mMZ11.bnd(() => mMmain
      .bnd(map, mMscbd.ret(mMscores.x)
      .bnd(updateScoreboard)
      .bnd(() => mM3.ret([])
      .bnd(() => mM8.ret(0) ))))),
    (mMZ12.bnd(() => mMmain   
       .bnd(map, mM6.ret( mMname.x + ' successfully logged in.')))),
    (mMZ13.bnd(() => mMar
      .bnd(splice, 0 ,3)
      .bnd(reduce, (a,b) => a + ", " + b)
      .bnd(() => mMmsg
      .bnd(push, mMname.x + ': ' + mMar.x)
      .bnd(updateMessages)))),
    (mMZ14.bnd(() => mMmain
      .bnd(map, mMgoals2.ret('The winner is ' + mMname.x )))), 
    (mMZ15.bnd(() => mMmain
      .bnd(map, mMgoals2.ret('A player named ' + 
        mMname.x + 'is currently logged in. Page will refresh in 4 seconds.')
      .bnd(refresh))))) `  )

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

var updateCalc = h('pre', `  function updateCalc() { 
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
  ))
}  `  )

export default {monads, fib, driver, main, next, game, updateCalc}
