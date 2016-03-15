import Cycle from '@motorcycle/core';
import {h, p, span, h1, h2, h3, br, div, label, input, hr, makeDOMDriver} from '@motorcycle/dom'; 
import {just, create, merge, combine, fromEvent, periodic, observe, delay, filter, of} from 'most'; 
import code from './code.js'; 

var tempStyle = {display: 'inline'}
var tempStyle2 = {display: 'none'}
mM6.ret('');

function createWebSocket(path) {
    let host = window.location.hostname;
    if(host == '') host = 'localhost';
    let uri = 'ws://' + host + ':3099' + path;
    let Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
    return new Socket(uri);
}

const socket = createWebSocket('/');

const websocketsDriver = function () {
    return create((add) => {
      socket.onmessage = msg => add(msg)
    })
}

var mM1ob = {'mM1': mM1};

const unitDriver = function () {
  return periodic(1000, 1);
}

mM1.ret([0,0,0,0]);
mM3.ret([]);

function main(sources) {

  mMfib.ret([0,1]);
  mMpause.ret(0);

  const messages$ = (sources.WS).map(e => 
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
      .bnd(refresh))))
  
  const loginPress$ = sources.DOM
    .select('input.login').events('keypress');

  const loginPressAction$ = loginPress$.map(e => {
    let v = (e.target.value);
    if (v == '' ) {
      return;
    } 
    if( e.keyCode == 13 ) {
      socket.send("CC#$42" + v);
      mMname.ret(v.trim())
      mM3.ret([]).bnd(mM2.ret);
      e.target.value = '';
      tempStyle = {display: 'none'}
      tempStyle2 = {display: 'inline'}
    }
  });

  const groupPress$ = sources.DOM
    .select('input.group').events('keypress');

  const groupPressAction$ = groupPress$.map(e => {
    let v = e.target.value;
    if (v == '' ) {
      return;
    } 
    if( e.keyCode == 13 ) 
      mMgroup.ret(e.target.value);
      socket.send(`CO#$42,${e.target.value},${mMname.x.trim()},${e.target.value}`);
  });

  mMmult.x.addA = sources.DOM.select('input#addA').events('input');
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

  mMob.x.addC = sources.DOM.select('input#addC').events('input');
  mMob.x.addD = sources.DOM.select('input#addD').events('input');
  mMob.x.result = combine((a,b) => a.target.value * b.target.value, mMob.x.addC, mMob.x.addD);
  
  mMt.ret(0);
  mMhistory.bnd(push,mMt, mMhistory);

  const mult7$ = mMob.x.result.map(v => {
    mMt.ret(v);
    mMhistory.bnd(push,mMt, mMhistory);
    mMpause2.ret(0);
  })
  
  const mult6$ = sources.UNIT.map(v => {
      mMpause2.ret(mMpause2.x + v)
      if(mMpause2.x === 1) {
        mMt.bnd(add, 1000).bnd(mMt.ret)
        mMhistory.bnd(push,mMt, mMhistory);
      }
      if(mMpause2.x === 2) {
        mMt.bnd(double).bnd(mMt.ret)
        mMhistory.bnd(push,mMt, mMhistory);
      }
      if(mMpause2.x === 3) {
        mMt.bnd(add, 1).bnd(mMt.ret) 
        mMhistory.bnd(push,mMt, mMhistory);
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

  const mult2$ = mMmult.x.result.map(v => {
    mMZ26.bnd(() => mMmult2.bnd(add, 1000).bnd(mMmult2.ret));
    mMZ27.bnd(() => mMmult2.bnd(double).bnd(mMmult2.ret));
    mMZ28.bnd(() => mMmult2.bnd(add, 1).bnd(mMmult2.ret)); 
    mMunit.ret(0);
  })

  const unitAction$ = sources.UNIT.map(v => {
      mMunit.ret(mMunit.x + v)
      .bnd(next, 1, mMZ26)
      .bnd(next, 2, mMZ27)
      .bnd(next, 3, mMZ28)
  })

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

  console.log('history: ', history);

  const mult5$ = mMmult.x.result
  .map(v => mM27.ret(v))
  .map(() => mM27.bnd(add, 1000).bnd(mM27.ret)).debounce(1000)
  .map(() => mM27.bnd(double).bnd(mM27.ret)).debounce(1000)
  .map(() => mM27.bnd(add, 1).bnd(mM27.ret)).debounce(1000)
  
  var test$ = sources.DOM.select('input#addF').events('input');

  const testAction$ = test$.map(e => mMtest
    .ret(e.target.value*1)).delay(1000)
    .map(() => mMtest.ret(mMtest.x + 1000)).delay(1000)
    .map(() => mMtest.ret(mMtest.x * 2)).delay(1000)
    .map(() => mMtest.ret(mMtest.x + 1)).delay(1000)
  
  var addS = function addS (x,y) {
    if (typeof x === 'number') {
      return ret(x + y);
    }
    else if (typeof x.product === 'number') {
      return ret(x.product + y);
    }
    else console.log('Problem in addS');
  }
  
  const messagePress$ = sources.DOM
    .select('input.inputMessage').events('keydown');

  const messagePressAction$ = messagePress$.map(e => {
    if( e.keyCode == 13 ) {
      socket.send(`CD#$42,${mMgroup.x.trim()},${mMname.x.trim()},${e.target.value}`);
      e.target.value = '';
    }
  });

  const numClick$ = sources.DOM
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
    socket.send('CG#$42,' + mMgroup.x.trim() + ',' + mMname.x.trim() + ',' + -1 + ',' + mMgoals.x);
    socket.send(`CA#$42,${mMgroup.x},${mMname.x.trim()},6,6,12,20`);
  });

  const fibPress$ = sources.DOM
    .select('input#code').events('keydown');

  const fibPressAction$ = fibPress$.map(e => {
    let v = e.target.value;
    if (v == '' ) {
      return;
    } 
    if( e.keyCode == 13 && Number.isInteger(v*1) ) {
      var result = mMfib.bnd(fib,v).x;
      mM19.ret(result);
    }
    if( e.keyCode == 13 && !Number.isInteger(v*1) ) mM19.ret("You didn't provide an integer");
  });

  const forwardClick2$ = sources.DOM
    .select('#forward2').events('click');

  const backClick2$ = sources.DOM
    .select('#back2').events('click');

  const forwardClick2Action$ = forwardClick2$.map(() => {
    if (mMindex2.x > 0) {
      console.log('In forwardClick2Action$');
      mMindex2.bnd(add,-1).bnd(mMindex2.ret)
      let mMtemp = ret(mMsaveAr.x[mMindex2.x].x)
      mM1.ret(mMtemp.x) 
      .bnd(() => show());
    }
  });

  const backClick2Action$ = backClick2$.map(() => {
    if (mMsaveAr.x.length > (mMindex2.x + 1)) {
      mMindex2.bnd(add,1).bnd(mMindex2.ret)
      let mMtemp = ret(mMsaveAr.x[mMindex2.x].x)
      mM1.ret(mMtemp.x) 
      .bnd(() => show());
    }
  });

  const calcStream$ = merge(backClick2Action$, forwardClick2Action$, testAction$, mult7$, mult6$, forwardClickAction$, backClickAction$, mult$, mult2$, mult4$, mult5$, unitAction$, fibPressAction$, groupPressAction$, rollClickAction$, messagePressAction$, loginPressAction$, messages$, numClickAction$, opClickAction$);

  return {
    DOM: 
      calcStream$.map(() => 
      h('div.content', [ 
      h('br'),
      h('h2', 'JS-monads-part4' ),
      h('br'),
      h('span', 'This installment of the JS-monads series features ' ),
      h('a', {props: {href: 'https://github.com/motorcyclejs' },  style: {color: '#EECCFF'}},'Motorcyclejs' ), 
      h('span', ' handling the monads. Motorcyclejs is Cyclejs, only using '  ),  
      h('a', {props: {href: 'https://github.com/paldepind/snabbdom' },  style: {color: '#EECCFF'}},'Snabbdom' ), 
      h('span',  ' instead of "virtual-dom", and ' ), 
      h('a', {props: {href: 'https://github.com/cujojs/most' },  style: {color: '#EECCFF'}},'Most' ), 
      h('span',  ' instead of "RxJS".'  ), 
      h('h3', 'The Game From JS-monads-part3' ),
      h('p', 'If clicking two numbers and an operator (in any order) results in 20 or 18, the score increases by 1 or 3, respectively. If the score becomes 0 mod 5, 5 points are added. A score of 25 results in one goal. That can only be achieved by arriving at a score of 20, which jumps the score to 25. Directly computing 25 results in a score of 30, and no goal. Each time ROLL is clicked, one point is deducted. Three goals wins the game. '    ),
      h('br'),
      h('button#save',  {style: {display: 'none'}},   mM1.x+''  ),
      h('br' ),
      h('button#0.num', mM1.x[0] + '' ),
      h('button#1.num', mM1.x[1] + '' ),
      h('button#2.num', mM1.x[2] + '' ),
      h('button#3.num', mM1.x[3] + '' ),
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
      h('button#forward2',  'TAKE BACK'  ),
      h('button#back2',  'FORWARD'  ),
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
      h('br'),  
      h('span',  'Group: ' + mMgroup.x ),
      h('br'),
      h('span',  'Goals: ' + mMgoals.x ),
      h('br'),
      h('span',  'Name: ' + mMname.x ),
      h('br'),
      h('div.scoreDisplay', [
      h('span', 'player[score][goals]' ),
      h('div', mMscoreboard.x ) ]) ]),
      h('span', 'People in the same group, other than solo, share text messages and dice rolls. '  ),
      h('p', 'The TAKE BACK and FORWARD feature relies on the immutability of display code saved in an array. TAKE BACK and FORWARD change the array index for the display and computations. A simpler example of the general algorithm is presented in the "Time Travel" section below.' ),
      h('hr'),
      h('p', 'Here are the definitions of the monad constructors: '   ),
      code.monads,
      h('p', 'As is apparent from the definition of Monad, when some monad "m" uses its "bnd" method on some function "f(x,v)", the first argument is the value of m (which is m.x). The return value of m.bnd(f,v) is f(m.x, v). Here is a function which takes two arguments: ' ),
      code.fib,
      h('p', 'If you enter some number "n" in the box below, mMfib, whose initial value is [0,1], uses its bnd method as follows:' ),  
      h('p', {style: {color: '#FF0000'}}, 'mMfib.bnd(fib,n)' ),
      h('p',   'The result will be displayed underneath the input box. ' ),
      h('br'),
      h('input#code', ),  
      h('p#code2', mM19.x ),  
      h('hr', ),  
      h('span', 'I won\'t discuss every aspect of the multi-player websockets game code. It is open source and available at '  ),  
      h('a', {props: {href: 'https://github.com/dschalk/JS-monads-part4'}, style: {color: '#EECCFF'}},  'https://github.com/dschalk/JS-monads-part4'  ),
      h('span', ' I want to show how I used the monads to organize code and to control browser interactions with the Haskell websockets server. Let\'s begin with the parsing and routing of incoming websockets messages. This is how the websockets driver is defined:' ),  
      code.driver,
      h('p', '"create" comes from the most library. It creates a blank stream; and with "add", it becomes a stream of incoming messages. '  ),  
      h('p', 'This is how the driver, referenced by "sources.WS", is used: '   ),  
      code.main,
      h('p', 'MonadIter instances have the "mMZ" prefix. Each instance has a "p" attribute which is a selector pointing to all of the code which comes after the call to its "bnd" method. Here is its definition of "next": ' ),  
      code.next,
      h('p', ' "main.js" has other code for handling keyboard and mouse events, and for combining everything into a single stream. It returns a stream of descriptions of the virtual DOM. The Motorcycle function "run" takes main and the sources object, with attributes DOM and JS referencing the drivers. It is called only once. "run" establishes the relationships between "main" and the drivers. After that, everything is automatic. Click events, keypress events, and websockets messages come in, Most updates the virtual dom stream, and Snabbdom diffs and patches the DOM. '   ),  
      h('hr', ),  
      h('p', 'Game clicks are handled as follows: ' ),  
      code.game,
      h('p', 'mM3 is populated by clicks on numbers, mM8 changes from 0 to the name of a clicked operator. So, when mM3.x.length equals 2 and mM8 is no longer 0, it is time to call updateCalc. Here is updateCalc: ' ),  
      code.updateCalc,
      h('p', 'This is light-weight, non-blocking asynchronous code. There are no data base, ajax, or websockets calls; nothing that would require error handling. Promises and JS6 iterators can be used to avoid "pyramid of doom" nested code structures, but that would entail excess baggage here. updateCalc illuminates a niche where the monads are right at home. ' ),  
      h('hr',),  
      h('p', 'A monad\'s value can be an object with as many attributes and methods as you like. Here, we take two numbers from input boxes and create a stream of their product, all inside of the monad mMmult. We are using mMmult.x, which starts out as an empty object, for the sole purpose of creating a namespace for three streams.  '  ),
      code.mult,
      h('p', 'mMmult$ provides the result of the computation the mMmult.x.result stream to several monads. For example, here is mM28.x: ' + mM28.x ),
      h('p', 'And here are the results of some computation sequences. To see them, type numbers into the boxes below. ' ),
      h('input#addA'  ),
      h('span', ' * '   ),
      h('input#addB'  ),
      h('p', 'The paragraphs below contain step delayed computations stemming from mMmult.x.result. ' ),
      h('p.add', 'Using a stream of 1\'s with MonadIter: ' + mMmult2.x    ),  
      h('p.add', 'Using a stream of 1\'s with "if" tests: ' + mMtem.x   ),  
      h('p.add', 'Using most.debounce: ' + mM27.x   ),  
      h('p', 'Like mMmult.x.product, it stems from mMmult.x.result. Obtaining the final result is simple, but presenting intermediate results after one-second pauses is tricky. Algorithms that worked in JS-monads-part3, a plain Snabbdom application, don\'t work in Motorcycle.js. For code to run smoothly in Motorcycle, it should blend into the main stream that feeds data to the virtual DOM. In our case, it needs to receive information from "sources" and return a stream that merges into calcStream, which provides the information necessary for patching the DOM. The first two results above use a driver named "unitDriver" These examples always give the expected result, free of side effects from ongoing previously started sequences of computations. You can type numbers in the input boxes in rapid succession and always see the result expected from the last number appearing in the box. Here is how the result using MonadIter is computed: '  ),
      code.product2,
      h('p', '"periodic" is from the "most" library. Motorcycle.js is like Cycle.js, only it uses most and Snabbdom instead of RxJS and virtual-dom. '  ),  
      h('p', 'This is how the same results are calculated using "if" tests: '  ),  
      code.product3,
      h('p', 'The final display in the list (above) shows the result of this computation:' ),  
      code.product4,  
      h('p', 'It usually gives the same result as the first two computations, but I found that adding and removing numbers in rapid succession occasionally gives a result slightly larger than expected. I suspect that the larger-than-expected result is caused by a side effect from a previously intitiated sequence of computations. The example at the bottom of this page shows that substituting `delay` for `debounce` results in side effects from all ongoing computations always being propagated and incorporated into the most recent computation.  ' ),
      h('hr',),  
      h('h2', 'Time Travel'  ),
      h('p', 'For any monad m with value a and id "m", m.ret(v) returns a new monad named "m" with id "m" and value v. It looks like m got the new value v. What follows is a demonstration showing that m does not get mutated when it calls its "ret" method. '),
      h('p', 'The monad mMt will repeatedly use its "ret" method. Each time mMt does this, we will save mMt in an array named "history", which looks like this: [mMt, mMt, ...]. The size of history increases each time we run a computation similar to the ones above. ' ),
     h('p', 'We will then traverse history using the BACK and FORWARD buttons and display mMt.x, verifying that each mMt still has the value it had when it was pushed into the history array. Here is the code: ' ),  
      code.immutable,
      h('p', ' "index" and "history[index].x" are placed paragraphs below. '  ), 
      h('p.add', 'Using a stream of 1\'s with "if" tests: ' + mMt.x   ),  
      h('input#addC'  ),
      h('span', ' * '   ),
      h('input#addD'  ),
      h('button#back',  'BACK'  ),   
      h('button#forward',  'FORWARD'  ),
      h('p',  'mMindex.x: ' + mMindex.x  ),
      h('p',  'mMhistory.x[' + mMindex.x + ']: ' + mMhistory.x[mMindex.x].x ),  
      h('hr',),  
      h('p', 'The next demonstration involves an algorithm similar to the one above using "most.debounce" only using "most.delay" instead. To see why most.delay is a bad choice in this context, enter a number then enter a different number immediately afterwards. The first calculation will not stop, so two sequences will be doubling mMtext.x and adding 1 or 1000 to it, causing the result to be larger than it should be. If you wait for the first sequence to finish, you will get the expected result; otherwise, you won\'t.  Here is the code:  '  ),
      code.test,
      h('p', ' Put a number in the box below '  ),
      h('input#addF'  ),
      h('p',  mMtest.x  ),  
      h('p', ' Try changing the number right after starting a computation. Typing "1" seven times in rapid succession and then rapidly pressing BACKSPACE seven times produces numbers larger 2001 (the result expected from the default value of 0). In the three algorithm example, if you put 1 in the left input box and type 1 seven times followed by BACKSPACE seven times in the other box, all three results are 2001. The faster you type numbers into the box, the larger the resuld. I held down the "9" key until I got infinity.  ' ),  
      h('p', ' The algorithms using sources.UNIT consistently give the desired result, never letting side effects from recently started sequences of computations spill over into the most recent sequences of computations. The one using most.debounce rarely give a too-large result and the one using most.delay always does. That doesn\'t necessarily imply that most.delay or most.debounce are buggy or that they could be improved. It does show that it is a mistake to start a sequence of computations using either of them if a similar sequence might already be running. ' ),
      h('p', ' . ' ),  
      h('p', ' . ' ),  
      h('p', ' . ' ),  
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

const show = function show() {
  let number0 = document.getElementById('0');
  let number1 = document.getElementById('1');
  let number2 = document.getElementById('2');
  let number3 = document.getElementById('3');

  if (mM1.x.length === 1) {
    number0.style.display = 'inline' 
    number1.style.display = 'none'   
    number2.style.display = 'none'   
    number3.style.display = 'none'   
  }

  if (mM1.x.length === 2) {
    number0.style.display = 'inline' 
    number1.style.display = 'inline'   
    number2.style.display = 'none'   
    number3.style.display = 'none'   
  }

  if (mM1.x.length === 3) {
    number0.style.display = 'inline' 
    number1.style.display = 'inline'   
    number2.style.display = 'inline'   
    number3.style.display = 'none'   
  }

  if (mM1.x.length === 4) {
    number0.style.display = 'inline' 
    number1.style.display = 'inline'   
    number2.style.display = 'inline'   
    number3.style.display = 'inline'   
  }
};

function show2(x) {
  mMsaveAr.bnd(unshift, [mM1.x[0], mM1.x[1], mM1.x[2], mM1.x[3]], mMsaveAr);
  return ret(x);
};

function cleanup (x) {
    let target0 = document.getElementById('0');
    let target1 = document.getElementById('1');
    let target2 = document.getElementById('2');
    let target3 = document.getElementById('3');
    let targetAr = [target0, target1, target2, target3];
    for (let i = 0; i < 4; i+=1) {
      if (mM1.x[i] === undefined) {
        targetAr[i].style.display = 'none';
      }
      else {targetAr[i].style.display = 'inline'}
    }
    return ret(x);
};

function updateCalc() { 
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
}

var updateScoreboard = function updateScoreboard(v) {
  mMscoreboard.ret([]);
  let ar = mMscbd.x;
  let keys = Object.keys(ar);
  for (let k in keys) {
    mMscoreboard.bnd(unshift, h('div.indent', ar[k]), mMscoreboard)
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
    mMmessages.bnd(unshift, h('div', ar[k]),mMmessages)
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
  socket.send('CG#$42,' + mMgroup.x + ',' + mMname.x + ',' + j + ',' + mMgoals.x);
  return mM13.ret(v + j);
}

var score2 = function score2() {
  console.log('In score2 again  mMgoals.x ', mMgoals.x);
  mMgoals.ret(mMgoals.x + 1);
  let j = -25;
  socket.send('CG#$42,' + mMgroup.x + ',' + mMname.x + ',' + j + ',' + mMgoals.x);
  mM13.ret(0);
  return mMgoals;
}

var winner = function winner() {
  let k = -3
  mMgoals.ret(mMgoals.x - 3);
  socket.send('CG#$42,' + mMgroup.x + ',' + mMname.x + ',' + 0 + ',' + mMgoals.x);
  socket.send('CE#$42,' + mMgroup.x + ',' + mMname.x + ',nothing ');
  return ret(0);
}

var newRoll = function(v) {
  socket.send(`CA#$42,${mMgroup.x},${mMname.x.trim()},6,6,12,20`);
  return ret(v);
};

var refresh = function() {
  setTimeout( function () {
     document.location.reload(false);
   },4000);
};

const sources = {
  DOM: makeDOMDriver('#main-container'),
  WS: websocketsDriver,
  UNIT: unitDriver
}

Cycle.run(main, sources);


