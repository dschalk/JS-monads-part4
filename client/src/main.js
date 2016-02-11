import Cycle from '@motorcycle/core';
import {h, p, span, h1, h2, h3, br, div, label, input, hr, makeDOMDriver} from '@motorcycle/dom';
import {just, create, merge} from 'most';

var Group = 'solo';
var Goals = 0;
var Name;
var tempStyle = {display: 'inline'}
var tempStyle2 = {display: 'none'}
mM6.ret('');

function createWebSocket(path) {
    let host = window.location.hostname;
    if(host == '') host = 'localhost';
    let uri = 'ws://' + host + ':3093' + path;
    let Socket = "MozWebSocket" in window ? MozWebSocket : WebSocket;
    return new Socket(uri);
}

const socket = createWebSocket('/');

var makeWSDriver = function () {
  return function () {
    return create(add => {
      socket.onmessage = (msg) => {
        add(msg)
      }
    })
  }
}

mM1.ret([2,4,6,8]);
mM3.ret([]);

function main(sources) {

  const messages$ = (sources.WS).map(e => {
    let prefix = e.data.substring(0,6);
    let ar = e.data.split(",");
    console.log('e', e);
    if (prefix === 'CA#$42') {
      mM1.ret([ar[3], ar[4], ar[5], ar[6]])
      .bnd(displayInline,'1')
      .bnd(displayInline,'2')
      .bnd(displayInline,'3');
    }
    if (prefix === 'CB#$42') {
      let scores = ar[3].split("<br>");
      mMscbd.ret(scores)
      .bnd(updateScoreboard)
      .bnd(() => mM3.ret([])
      .bnd(() => mM8.ret(0)
      .bnd(() => mM6)));
    }
    if (prefix === 'CC#$42') {
      mM6.ret( ar[2] + ' successfully logged in.');
    }
    if (prefix === 'CD#$42') {
      let name = ar[2];
      ar.splice(0,3);
      let message = ar.reduce((a,b) => a + ", " + b)
      let str = name + ': ' + message;
      mMmsg
      .bnd(push,str)
      .bnd(updateMessages)
    }
  });

  const loginPress$ = sources.DOM
    .select('input.login').events('keydown');

  const loginPressAction$ = loginPress$.map(e => {
    console.log('updateLogin ', e);
    let v = e.target.value;
    if (v == '' ) {
      return;
    } 
    if( e.keyCode == 13 ) {
      console.log('e.target.value ', e.target.value);
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
    console.log('In groupPressAction');
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
     
  console.log('numClick$ ', numClick$);  

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

  const calcStream$ = merge(groupPressAction$, rollClickAction$, messagePressAction$, loginPressAction$, messages$, numClickAction$, opClickAction$);

  return {
    DOM: 
      calcStream$.map(x => 
      h('div.content', [ 
      h('br'),
      h('h2', 'JS-monads-part4' ),
      h('br'),
      h('span', 'The first step in preparing the fourth page in this series was refactoring the code to use ' ),
      h('a', {props: {href: 'https://github.com/motorcyclejs' },  style: {color: '#EECCFF'}},'Motorcyclejs' ), 
      h('span', '. Motorcyclejs is Cyclejs, only using '  ),  
      h('a', {props: {href: 'https://github.com/paldepind/snabbdom' },  style: {color: '#EECCFF'}},'Snabbdom' ), 
      h('span',  ' instead of "virtual-dom", and ' ), 
      h('a', {props: {href: 'https://github.com/cujojs/most' },  style: {color: '#EECCFF'}},'Most' ), 
      h('span',  ' instead of "RxJS".'  ), 
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
      h('br'),
      h('p.login', {style: tempStyle}, 'In order to create a unique socket, please enter some name.'  ),
      h('br'),
      h('input.login', {style: tempStyle }   ),
      h('p', mM6.x.toString() ),
      h('p.fred', {style: tempStyle2}, 'Enter messages here: '  ),
      h('input.inputMessage', {style: tempStyle2}  ),
      h('p.group2', [ 
      h('p',  'Group: ' + Group ),
      h('p',  'Goals: ' + mMgoals.x ) ]),
      h('div.score', mMscoreboard.x ),
      h('p.group', {style: tempStyle2}, 'Change group: '  ),
      h('input.group', {style: tempStyle2} ),
      h('div.messages', mMmessages.x  )
      ])
    )  
  } 
}  

function updateCalc() { 
  ret('start').bnd(() => (
      ( mMZ2.bnd(() => mM13
                    .bnd(score, 1)
                    .bnd(v => mM13.ret(v))
                    .bnd(next2, (mM13.x % 5 === 0), mMZ5) 
                    .bnd(newRoll)) ),
      ( mMZ4.bnd(() => mM13
                    .bnd(score, 3)
                    .bnd(v => mM13.ret(v))
                    .bnd(next2, (mM13.x % 5 === 0), mMZ5) 
                    .bnd(newRoll)) ),
          ( mMZ5.bnd(() => mM13
                        .bnd(score,5)
                        .bnd(v => mM13.ret(v))
                        .bnd(next, 25, mMZ6)) ),
              ( mMZ6.bnd(() => mM9.bnd(score2) 
                            .bnd(next,3,mMZ7)) ),
                  (mMZ7.bnd(() => mM13.bnd(winner)) ),                 
      (mM3.bnd(x => mM7
                    .ret(calc(x[0], mM8.x, x[1]))
                    .bnd(next, 18, mMZ4)
                    .bnd(next, 20, mMZ2) 
                    .bnd(() => mM1.bnd(push,mM7.x)
                    .bnd(mM1.ret)
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
    mMscoreboard.bnd(unshift, h('p', ar[k]))
  }
    mMscoreboard
    .bnd(unshift, h('h3', 'player [score] [goals]'))
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
    document.getElementById(a).style.display = 'inline';
    return ret(x);
};

var send = function() {
  socket.send(`CA#$42,${Group},${Name},6,6,12,20`);
};

var score = function score(v,j) {
  socket.send('CG#$42,' + Group + ',' + Name + ',' + j + ',' + 0);
  return ret(v + j);
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
  mMgoals.ret(mMgoals.x + 1);
  socket.send('CG#$42,' + Group + ',' + Name + ',' + 0 + ',' + k);
  mMgoals2.ret('The winner is ' + Name);
  return ret(0);
}

var newRoll = function(v) {
  socket.send(`CA#$42,${Group},${Name},6,6,12,20`);
  return ret(v);
};

function updateLogin(e) {
  console.log('updateLogin ', e);
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
}

function updateGoback() {
       monadStyle = inputStyleA;
       chatStyle = inputStyleB;
       update0();
}

function  updateRoll() {
  mM13.ret(mM13.x - 1);
  socket.send('CG#$42,' + Group + ',' + Name + ',' + -1 + ',' + 0);
  socket.send(`CA#$42,${Group},${Name},6,6,12,20`);
}

function updateGotochat() {
       monadStyle = inputStyleB;
       chatStyle = inputStyleA;
       update0();
}

function updateMessage(e) {
  if( e.keyCode == 13 ) {
    socket.send(`CD#$42,${Group},${Name},${e.target.value}`);
    e.target.value = '';
    console.log('Here is the message ', e.target.value);
  }
}

function pauseDemo() {
  mM1.ret("Wait two seconds.")
    .bnd(update)
    .bnd(pause,2,mMZ1)
    .bnd(() => mM1.ret("Goodbye")
    .bnd(update))
}

function updateGroup(e) {
  Group = e.target.value;
  if( e.keyCode == 13 ) {
    socket.send(`CO#$42,${e.target.value},${Name},${e.target.value}`);
  }
  oldVnode = patch(oldVnode, newVnode());
}

const sources = {
  DOM: makeDOMDriver('#main-container'),
  WS: makeWSDriver()
}


Cycle.run(main, sources);


