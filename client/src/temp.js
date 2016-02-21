
  const evalPress$ = sources.DOM
    .select('input#inputEval').events('keydown');

  const evalPressAction$ = evalPress$.map(e => {
    let v = e.target.value;
    if (v == '' ) {
      return;
    } 
    if( e.keyCode == 13 ) EVAL = 'cow';
  });

