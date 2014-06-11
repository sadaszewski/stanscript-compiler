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
    \k;
    w += 1;
    var x, y, z, i;
    x = 0\2\10;
    y = \Vector3(1, 2, 3);
    //\z = 1;
    z = \\;
    \.x += 1;
    \k = 1, w = 2;
    a(1, 2) -> b(3) -> c(4)
    k += \Vector3(1, 2, 3) + \Vector3(4, 5, 6);
    k[0] = 1;
    x = k ? 0 : 1;
    k.a = 2;
    (k.a);
    for (i = 0; i < 10; i++) {
	k++;
    }
    \w = \Vector3(1, 2, 3);
    (k);
}