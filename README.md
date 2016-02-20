#JS-monads-part4

Refactored the JS-monads-part3 game to use [Motorcyclejs](https://github.com/motorcyclejs). This is how websockets messages are received in main.js:

```javascript
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
      .bnd(refresh)))))
```

Motorcyclejs is a most remarkable library. And it plays so nicely with the monads. 
