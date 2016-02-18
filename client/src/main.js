import Cycle from '@motorcycle/core';
import {h, p, span, h1, h2, h3, br, div, label, input, hr, makeDOMDriver} from '@motorcycle/dom';
import {just, create, merge} from 'most';
import cow from './cow';

var Group = 'solo';
var Goals = 0;
var Name;
var FIB = 'waiting';
var Result = '';
var tempStyle = {display: 'inline'}
var tempStyle2 = {display: 'none'}
mM6.ret('');
mMfib.ret([0,1]);

function createWebSocket(path) {
    let host = window.location.hostname;
    if(host == '') host = 'localhost';
    let uri = 'ws://' + host + ':3099' + path;
    let Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
    return new Socket(uri);
}

const socket = createWebSocket('/');

var websocketsDriver = function () {
    return create(add => {
      socket.onmessage = msg => add(msg)
    })
}

mM1.ret([0,0,0,0]);
mM3.ret([]);

function main(sources) {
  const messages$ = (sources.WS).map(e => 
    mMar.ret(e.data.split(','))
    .bnd(() => mMprefix.ret(mMar.x[0]))
    .bnd(() => mMscores.ret(mMar.x[3].split("<br>")))
    .bnd(() => mMname.ret(mMar.x[2])).bnd(() =>
    (mMZ10.bnd(() => ret('temp')
      .bnd(map, mM1.ret([mMar.x[3], mMar.x[4], mMar.x[5], mMar.x[6]])
      .bnd(displayInline,'1')
      .bnd(displayInline,'2')
      .bnd(displayInline,'3')
      .bnd(log, 'In CA#$42' )) )),
    (mMZ11.bnd(() => ret('temp')
      .bnd(map, mMscbd.ret(mMscores.x)
      .bnd(updateScoreboard)
      .bnd(() => mM3.ret([])
      .bnd(() => mM8.ret(0) ))
      .bnd(log, 'In CB#$42' )))),
    (mMZ12.bnd(() => ret('temp')   
      .bnd(map, mM6.ret( mMname.x + ' successfully logged in.')
      .bnd(log, 'In CC#$42' )))),
    (mMZ13.bnd(() => mMar
      .bnd(splice, 0 ,3)
      .bnd(reduce, (a,b) => a + ", " + b)
      .bnd(() => mMmsg
      .bnd(push, mMname.x + ': ' + mMar.x)
      .bnd(updateMessages)
      .bnd(log, 'In CD#$42' )))),
    (mMZ14.bnd(() => ret('temp')
      .bnd(map, mMgoals2.ret('The winner is ' + mMname.x ) 
      .bnd(log, 'In CE#$42' )))),
  (ret('tests')
   .bnd(next2, mMprefix.x === 'CA#$42', mMZ10)
   .bnd(next2, mMprefix.x === 'CB#$42', mMZ11)
   .bnd(next2, mMprefix.x === 'CC#$42', mMZ12)
   .bnd(next2, mMprefix.x === 'CD#$42', mMZ13)
   .bnd(next2, mMprefix.x === 'CE#$42', mMZ14))))

  const loginPress$ = sources.DOM
    .select('input.login').events('keydown');

  const loginPressAction$ = loginPress$.map(e => {
    let v = e.target.value;
    if (v == '' ) {
      return;
    } 
    if( e.keyCode == 13 ) {
      socket.send("CC#$42" + v);
      Name = v;
      mM3.ret([]).bnd(mM2.ret);
      e.target.value = '';
      tempStyle = {display: 'none'}
      tempStyle2 = {display: 'inline'}
    }
  });

  const groupPress$ = sources.DOM
    .select('input.group').events('keydown');

  const groupPressAction$ = groupPress$.map(e => {
    let v = e.target.value;
    if (v == '' ) {
      return;
    } 
    if( e.keyCode == 13 ) 
      Group = e.target.value;
      socket.send(`CO#$42,${e.target.value},${Name},${e.target.value}`);
  });

  const messagePress$ = sources.DOM
    .select('input.inputMessage').events('keydown');

  const messagePressAction$ = messagePress$.map(e => {
    if( e.keyCode == 13 ) {
      socket.send(`CD#$42,${Group},${Name},${e.target.value}`);
      e.target.value = '';
    }
  });

  const numClick$ = sources.DOM
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
    socket.send(`CA#$42,${Group},${Name},6,6,12,20`);
  });

  const fibPress$ = sources.DOM
    .select('input#code').events('keydown');

  const fibPressAction$ = fibPress$.map(e => {
    let v = e.target.value;
    if (v == '' ) {
      return;
    } 
    if( e.keyCode == 13 ) 
      FIB = mMfib.bnd(fib,v).x;
  });

  const calcStream$ = merge(fibPressAction$, groupPressAction$, rollClickAction$, messagePressAction$, loginPressAction$, messages$, numClickAction$, opClickAction$);

  return {
    DOM: 
      calcStream$.map(() => 
      h('div.content', [ 
      h('br'),
      h('h2', 'JS-monads-part4' ),
      h('br'),
      h('span', 'This installment of the JS-monads series features ' ),
      h('a', {props: {href: 'https://github.com/motorcyclejs' },  style: {color: '#EECCFF'}},'Motorcyclejs' ), 
      h('span', 'handling the monads. Motorcyclejs is Cyclejs, only using '  ),  
      h('a', {props: {href: 'https://github.com/paldepind/snabbdom' },  style: {color: '#EECCFF'}},'Snabbdom' ), 
      h('span',  ' instead of "virtual-dom", and ' ), 
      h('a', {props: {href: 'https://github.com/cujojs/most' },  style: {color: '#EECCFF'}},'Most' ), 
      h('span',  ' instead of "RxJS".'  ), 
      h('h3', 'The Game From JS-monads-part3' ),
      h('p', 'If clicking two numbers and an operator (in any order) results in 20 or 18, the score increases by 1 or 3, respectively. If the score becomes 0 mod 5, 5 points are added. A score of 25 results in one goal. That can only be achieved by arriving at a score of 20, which jumps the score to 25. Directly computing 25 results in a score of 30, and no goal. Each time ROLL is clicked, one point is deducted. Three goals wins the game. '    ),
      h('br'),
      h('button#0.num', mM1.x[0]+'' ),
      h('button#1.num', mM1.x[1]+'' ),
      h('button#2.num', mM1.x[2]+'' ),
      h('button#3.num', mM1.x[3]+'' ),
      h('br'),
      h('button#4.op', 'add'  ),
      h('button#5.op', 'subtract' ),
      h('button#5.op', 'mult' ),
      h('button#5.op', 'div' ),
      h('button#5.op', 'concat' ),
      h('br'),
      h('button.roll', {style: tempStyle2}, 'ROLL' ),
      h('br'),
      h('br'),
      h('div.winner', mMgoals2.x+''  ),
      h('br'),
      h('br'),
      h('p.login', {style: tempStyle}, 'Please enter some name.'  ),
      h('br'),
      h('input.login', {style: tempStyle }   ),
      h('p', mM6.x.toString() ),
      h('p.group', {style: tempStyle2}, 'Change group: '  ),
      h('input.group', {style: tempStyle2} ),
      h('div.messages', [
      h('p', {style: tempStyle2}, 'Enter messages here: '  ),
      h('input.inputMessage', {style: tempStyle2} ),
      h('div', mMmessages.x  ) ]),
      h('p.group2', [ 
      h('p',  'Group: ' + Group ),
      h('p',  'Goals: ' + mMgoals.x ),
      h('div.scoreDisplay', [
      h('span', 'player[score][goals]' ),
      h('div', mMscoreboard.x ) ]) ]),
      h('hr'),
      h('p', 'Here are the definitions of the monad constructors: '   ),
      h('pre', `  class Monad {
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
  } ` ),
      h('p', 'As is apparent from the definition of Monad, when some monad "m" uses its "bnd" method on some function "f(x,v)", the first argument is the value of m (which is m.x). The return value of m.bnd(f,v) is f(m.x, v). Here is a function which takes two arguments: ' ),
      h('pre', `  var fib = function fib(x,k) {
  let j = k;

  while (j > 0) {
    x = [x[1], x[0] + x[1]];
    j -= 1;
  }
  return ret('fibonacci ' + k + ' = ' + x[0]);   // An anonymous monad holding the result.
}
` ),  
      h('p', 'If you enter some number "n" in the box below, mMfib, whose initial value is [0,1], uses its bnd method as follows: mMfib.bnd(fib,n). The result will be displayed undernieth the input box. ' ),
      h('input#code', ),  
      h('p#code2', FIB ),  
      h('hr', ),  
      h('p', ),  
      h('p', ),  
      h('p', ),  
      h('p', ),  
      h('p', ),  
      h('p', ),  
      h('p', ),  
      h('p', ),  
      h('p', ),  
      h('p', ),  
      h('p', )  
      ])
    )  
  } 
}  

function updateCalc() { 
  ret('start').bnd(() => (
      ( mMZ2.bnd(() => mM13
                    .bnd(score, 1)
                    .bnd(next2, (mM13.x % 5 === 0), mMZ5)  // Releases mMZ5.
                    .bnd(newRoll)) ),
      ( mMZ4.bnd(() => mM13
                    .bnd(score, 3)
                    .bnd(next2, (mM13.x % 5 === 0), mMZ5) 
                    .bnd(newRoll)) ),
          ( mMZ5.bnd(() => mM13
                        .bnd(score,5)
                        .bnd(v => mM13.ret(v)
                        .bnd(next, 25, mMZ6))) ),
              ( mMZ6.bnd(() => mM9.bnd(score2) 
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
}

var updateScoreboard = function updateScoreboard(v) {
  mMscoreboard.ret([]);
  let ar = mMscbd.x;
  let keys = Object.keys(ar);
  for (let k in keys) {
    mMscoreboard.bnd(unshift, h('br'))
    .bnd(unshift, ar[k])
    
 }
  return mMscoreboard;
}

window.onload = function (event) {
    console.log('onopen event: ', event);
};

var updateMessages = function updateMessages(v) {
  mMmessages.ret([]);
  let ar = mMmsg.x;
  let keys = Object.keys(ar);
  for (let k in keys) {
    mMmessages.bnd(unshift, h('div', ar[k]))
  }
  return mMmessages;
}

var displayOff = function displayOff(x,a) {
    document.getElementById(a).style.display = 'none';
    return ret(x);
};

var displayInline = function displayInline(x,a) {
    if (document.getElementById(a)) document.getElementById(a).style.display = 'inline';
    return ret(x);
};

var score = function score(v,j) {
  socket.send('CG#$42,' + Group + ',' + Name + ',' + j + ',' + 0);
  return mM13.ret(v + j);
}

var score2 = function score2() {
  mMgoals.ret(mMgoals.x + 1);
  let j = -25;
  socket.send('CG#$42,' + Group + ',' + Name + ',' + j + ',' + 1);
  mM13.ret(0);
  return mMgoals;
}

var winner = function winner() {
  let k = -3
  mMgoals.ret(mMgoals.x - 3);
  socket.send('CG#$42,' + Group + ',' + Name + ',' + 0 + ',' + k);
  socket.send('CE#$42,' + Group + ',' + Name + ',nothing ');
  return ret(0);
}

var newRoll = function(v) {
  socket.send(`CA#$42,${Group},${Name},6,6,12,20`);
  return ret(v);
};

const sources = {
  DOM: makeDOMDriver('#main-container'),
  WS: websocketsDriver
}


Cycle.run(main, sources);


