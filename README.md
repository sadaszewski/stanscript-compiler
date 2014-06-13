<a href="http://algoholic.eu/wp-content/uploads/2014/06/stanscript.png"><img src="http://algoholic.eu/wp-content/uploads/2014/06/stanscript-150x150.png" alt="" title="stanscript" width="150" height="150" class="alignleft size-thumbnail wp-image-2077" /></a>Following on my little half-joke <a href="http://algoholic.eu/introducing-backtick-a-k-a-stanscript-a-clojurescalalisppython-inspired-javascript-superset/" title="Introducing BackTick, a.k.a. StanScript ; ) a Clojure/Scala/Lisp/Python-inspired JavaScript superset" target="_blank">Backtick</a>, I actually wanted to improve some things pointed out to me as bad about it and create a bit more professional JS-derivative. This time it's based on much more solid foundation - the <a href="https://github.com/google/traceur-compiler" target="_blank">traceur</a> compiler. It's pretty cleanly divided into parser and code generator modifications. And there's a bit of runtime included, offering functions typically used with iterators, like map(), filter(), reduce(). Also a NumStan library trying to lay foundation for a NumPy clone. If I come up with other good ideas, I will also not hesitate to implement them ;)

Here's a short list of changes relative to JS:

- range operator mimicking the MATLAB one, works like this: <strong>0\2\10</strong>, meaning from 0 to 10 (inclusive), with step 2, gets translated to object <strong>{'from': 0, 'to': 10, 'step': 2}</strong>

- short-hand new operator, e.g. <strong>\Vector3(1, 2, 3)</strong> is <strong>new Vector3(1, 2, 3)</strong>

- short-hand 'this' notation, e.g. <strong>\.x</strong> (<strong>this.x</strong>) and <strong>\\</strong> (<strong>this</strong>)

- operator overloading in variables declared with \, e.g.: <strong>\x = 1; x += 1; </strong> gets transpiled to: <strong>var x = 1; x.__iadd__(1);</strong>

- also member lookup (<strong>[]</strong>), member (<strong>.</strong>) and ternary (<strong>?:</strong>) operators can be overloaded using special methods __index__, __attr__ and __ternary__ respectively

- if last expression in a function is in parentheses it automatically is the return value, e.g. <strong>(x)</strong> is translated to <strong>return x;</strong>

- multi-dimensional indexing in variables declared with \, e.g. <strong>\x=\ndarray([5,5]); console.log(x[1, 0:2]);</strong> is translated to <strong>var x = new ndarray([5, 5]); console.log(x.__index__([1, {'from': 0, 'to': 2, 'step': 1}]));</strong>

- chaining operator (->) for better functional compositing, e.g. <strong>a(1) -> b(2, 3) -> c();</strong> gets transpiled to <strong>c(b(2, 3, a(1));</strong>

- everything else from ECMAScript 6 is supported thanks to traceur itself; you get short lambda declarations, asynchronous functions, generators, classes and more

- source maps handled also by traceur allow for debugging it in the web browser as if it was a native language

- included NumStan library mimicks closely semantics of NumPy's ndarray, providing foundations for recreating the rest of its functionality

The project is hosted as traceur fork on Github: <a href="https://github.com/sadaszewski/stanscript-compiler" target="_blank">HERE</a>. Give it a try ;)
