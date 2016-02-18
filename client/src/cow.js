"use strict";

import snabbdom from 'snabbdom';
import h from 'snabbdom/h';
var Group = 'solo';
var Name = 'Fred';

const monads = h('pre', {style: {color: '#AFEEEE' }}, `  class Monad {
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
  }
` );  


const fib = h('pre', {style: {color: '#AFEEEE' }}, `  var fib = function fib(x,k) {
  let j = k;

  while (j > 0) {
    x = [x[1], x[0] + x[1]];
    j -= 1;
  }
  return ret('fibonacci ' + k + ' = ' + x[0]);
}
` );  

const monadIter2 = h('pre', {style: {color: '#AFEEEE' }}, `  class MonadIter {
` );  

const monadIter3 = h('pre', {style: {color: '#AFEEEE' }}, `  class MonadIter {
` );  

const monadIter4 = h('pre', {style: {color: '#AFEEEE' }}, `  class MonadIter {
` );  

const monadIter5 = h('pre', {style: {color: '#AFEEEE' }}, `  class MonadIter {
` );  

const monadIter6 = h('pre', {style: {color: '#AFEEEE' }}, `  class MonadIter {
` );  










