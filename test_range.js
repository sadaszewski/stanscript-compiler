function *gen() {
    yield 1;
    yield 2;
    yield 3;
}

function map(fn, g) {
  if ('buffer' in g && g.buffer instanceof ArrayBuffer) {
  } else if (g instanceof Array) {
  } else if (typeof(g) == 'function') {
    var v;
    while ((v = g.next().value) !== undefined) {
      out.push(fn(v));
    }
  } else {
    throw "Unsupported iterable."
  }
}

function main() {
    var x = 0\2\10;
    var y = \Vector3(1, 2, 3);
    //\z = 1;
    var z = \\;
    \k = 1, w = 2;
    a(1, 2) -> b(3) -> c(4)
    k += \Vector3(1, 2, 3) + \Vector3(4, 5, 6);
    k[0] = 1;
    var x = k ? 0 : 1;
    k.a = 2;
    (k.a);
    for (var i = 0; i < 10; i++) {
	k++;
    }
    (k);
}