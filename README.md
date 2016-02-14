#JS-monads-part4

Refactored the JS-monads-part3 game to use [Motorcyclejs](https://github.com/motorcyclejs). This is how websockets messages are received in the "main" function in main.js:

```javascript
  const messages$ = (sources.WS).map(e => 
    mMar.ret(e.data.split(','))
    .bnd(() => mMprefix.ret(mMar.x[0]))
    .bnd(() => mMscores.ret(mMar.x[3].split("<br>")))
    .bnd(() => mMname.ret(mMar.x[2])).bnd(() =>
    (mMZ10.bnd(() => ret('temp')  // Anonymous monad with value 'temp'.
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
      .bnd(map, mMgoals.ret('The winner is ' + mMname.x ) 
      .bnd(log, 'In CE#$42' )))),
  (ret('tests')  // Anonymous monad with value 'tests'.
   .bnd(next2, mMprefix.x === 'CA#$42', mMZ10)
   .bnd(next2, mMprefix.x === 'CB#$42', mMZ11)
   .bnd(next2, mMprefix.x === 'CC#$42', mMZ12)
   .bnd(next2, mMprefix.x === 'CD#$42', mMZ13)
   .bnd(next2, mMprefix.x === 'CE#$42', mMZ14))))
```

Motorcyclejs is a most remarkable library. And it plays so nicely with the monads. 
