require('./bin/traceur.js');
require('./numstan_compiled');

function print(a) {
    var s = '';
    for (var i = 0; i < a.data.length; i++) {
	s += a.data[i] + ',';
    }
    console.log(s);
}

function main() {
    \a = \ndarray([5,5]);
    //console.log(a[0]);
    print(a);
    \b = \ndarray([3,3], [1,2,3,4,5,6,7,8,9]);
    \c = \ndarray([1,3], [10,20,30]);
    \d = b * c;
    print (d);
    console.log(d.shape);
    d = b * (c.T);
    print (d);
    console.log(d.shape);
    console.log(c.shape);
    console.log(c.T.shape);
    d = b.expand(c.T, (x, y) => { console.log(x + ' ' + y); return x; });
    print (d);
    //print (c.T);
}

main();
