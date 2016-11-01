/**
 * Created by Administrator on 2016/9/27.
 */
function range2(n) {return n? range2(n-1).concat(Math.pow(2, n)):[]}
var a = range2(4);
console.log(a);