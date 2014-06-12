/*
(C) Stanislaw Adaszewski, 2014
http://algoholic.eu
*/

(function() {

var exports = typeof(window) === 'undefined' ? global : window;

function prod(ary) {
    var ret = ary[0];
    for (var i = 1; i < ary.length; i++) ret *= ary[i];
    return ret;
}

function range(left, right, step) {
    return {'left': left, 'right': right, 'step': step};
}

function random(shape, dtype='float32') {
    var ret = new ndarray(shape, dtype);
    for (var i = 0; i < ret.data.length; i++) {
        ret.data[i] = Math.random();
    }
    return ret;
}

class ndarray {
    constructor(shape, dtypeOrData='float32') {
        var dtype, data;

        if (typeof(dtypeOrData) == 'string') {
            dtype = dtypeOrData;
            var type = (dtype == 'obj' ? 'Array' : (dtype[0].toUpperCase() + dtype.substr(1) + 'Array'));
            type = global[type];
            data = new type(prod(shape));
        } else {
            data = dtypeOrData;
            if (data instanceof Array) {
                dtype = 'obj';
            } else {
                dtype = data.constructor.name;
                dtype = dtype.substr(0, dtype.length - 5).toLowerCase();
            }
        }
        if (data === undefined) {
            throw 'Cannot run without data';
        }

        var stride = shape.slice(1, shape.length);
        stride.push(1);
        for (var i = stride.length - 2; i >= 0; i--) {
            stride[i] *= stride[i + 1];
        }

        this.data = data;
        this.shape = shape;
        this.dtype = dtype;
        this.stride = stride;
    }
    get T() {
        var shape = this.shape.slice();
        if (shape.length < 2) {
            // throw 'Cannot transpose arrays with less than 2 dimensions';
            return this;
        }
        var stride = this.stride.slice();
        for (var i = 0; i < shape.length; i++) {
            shape[i] = this.shape[shape.length - i - 1];
            stride[i] = this.stride[stride.length - i - 1];
        }

        var ret = new ndarray([0], []);
        ret.data = this.data;
        ret.dtype = this.dtype;
        ret.stride = stride;
        ret.shape = shape;

        return ret;
    }
    prep(it, dim) {
        // range
        if (typeof(it) == 'object' && it.step) {
            var left = it.left, right = it.right;
            if (left < 0) left += this.shape[dim] + 1;
            if (right < 0) right += this.shape[dim] + 1;
            var ret = range(left, right, it.step);
            ret.cur = left;
            console.log(ret);
            return ret;
        } else if (it instanceof Array) {
            return {ary: it, cur: 0};
        } else if (typeof(it) == 'number') {
            return {ary: [it], cur: 0};
        }
    }
    len(it) {
        // range
        if (it.step) {
            return ~~((it.right - it.left) / it.step);
        } else {
            return it.ary.length;
        }
    }
    hasNext(it) {
        // range
        if (it.step) {
            return (it.cur < it.right);
        } else {
            return (it.cur < it.ary.length);
        }
    }
    next(it) {
        if (it.step) {
            var ret = it.cur;
            it.cur += it.step;
            return ret;
        } else {
            var ret = it.ary[it.cur];
            it.cur++;
            return ret;
        }
    }
    reset(it) {
        if (it.step) {
            it.cur = it.left;
        } else {
            it.cur = 0;
        }
        return it.cur;
    }
    ofs(idx) {
        var stride = this.stride;
        var ofs = 0;
        var shape = this.shape;
        for (var i = 0; i < stride.length; i++) {
            if (idx[i] >= shape[i]) throw 'Index exceeds dimensions';
            ofs += stride[i] * idx[i];
        }
        return ofs;
    }
    mod_ofs(idx) {
        var stride = this.stride;
        var ofs = 0;
        var shape = this.shape;
        //console.log(shape);
        for (var i = 0; i < stride.length; i++) {
            ofs += stride[i] * (shape[i] == 1 ? 0 : idx[i] % shape[i]);
        }
        return ofs;
    }
    __index__(a) {
        if (!(a instanceof Array)) {
            a = [a];
        }

        for (var i = a.length; i < this.shape.length; i++) {
            a.push(range(0, -1, 1));
        }

        var it = [];
        for (var i = 0; i < a.length; i++) {
            it.push(this.prep(a[i], i));
        }

        //console.log('it.length: ' + it.length);

        var shape = [];
        for (var i = 0; i < it.length; i++) {
            shape.push(this.len(it[i]));
        }

        console.log(this.dtype);
        var ret = new ndarray(shape, this.dtype);

        var idx = new Array(it.length);
        /* for (var i = 0; i < it.length; i++) {
            idx[i] = this.next(it[i]);
        } */

        //console.log('stride: ' + this.stride);

        var cnt = 0;

        outer: while (true) {
            for (var i = 0; i < it.length; i++) {
                if (idx[i] === undefined) {
                    idx[i] = this.next(it[i]);
                } else if (i < it.length - 1 && !this.hasNext(it[i + 1])) {
                    if (!this.hasNext(it[i])) {
                        break outer;
                    }
                    idx[i] = this.next(it[i]);
                    idx[i + 1] = this.reset(it[i + 1]);
                } else if (i == it.length - 1) {
                    if (i == 0 && !this.hasNext(it[i])) {
                        break outer;
                    }
                    idx[i] = this.next(it[i]);
                }
            }
            //console.log(idx);
            //console.log(this.ofs(idx));
            ret.data[cnt] = this.data[this.ofs(idx)];
            cnt++;
        }

        return ret;
    }
    expand(b, op) {
        var a = this;

        if (b instanceof Array) {
            b = new ndarray([b.length], b);
        } else if (typeof(b) == 'number') {
            b = new ndarray([1], [b]);
        }

        // console.log(b);

        var a_shape = a.shape.slice();
        var b_shape = b.shape.slice();
        for (var i = a_shape.length; i < b_shape.length; i++) a_shape.push(1);
        for (var i = b_shape.length; i < a_shape.length; i++) b_shape.push(1);

        a = new ndarray(a_shape, a.data);
        b = new ndarray(b_shape, b.data);

        var shape = new Array(a_shape.length);
        for (var i = 0; i < a_shape.length; i++) {
            if (a_shape[i] != 1 && b_shape[i] != 1 && a_shape[i] != b_shape[i]) {
                throw 'Incompatible shapes';
            }
            shape[i] = Math.max(a_shape[i], b_shape[i]);
        }

        var a_stride = a.stride;
        var b_stride = b.stride;

        var ret = new ndarray(shape, a.dtype);

        var idx = new Array(a_shape.length);

        outer: while (true) {
            for (var i = 0; i < idx.length; i++) {
                if (idx[i] === undefined) {
                    idx[i] = 0;
                } else if (i < idx.length - 1 && idx[i + 1] >= shape[i + 1] - 1) {
                    if (idx[i] >= shape[i] - 1) break outer;
                    idx[i]++;
                    idx[i + 1] = -1;
                } else if (i == idx.length - 1) {
                    if (i == 0 && idx[i] >= shape[i] - 1) break outer;
                    idx[i]++;
                }
            }

            console.log(idx); //  + ' ' + a.mod_ofs(idx) + ' ' + b.mod_ofs(idx));

            ret.data[ret.ofs(idx)] = op(a.data[a.mod_ofs(idx)], b.data[b.mod_ofs(idx)]);
        }

        return ret;
    }
    __iinc__() { return this.expand(1, (x, y) => x + y); }
    __idec__() { return this.expand(1, (x, y) => x - y); }

    __add__(b) { return this.expand(b, (x, y) => x + y); }
    __sub__(b) { return this.expand(b, (x, y) => x - y); }

    __not__() { return this.expand(1, (x, y) => (!x)); }
    __invert__() { return this.expand(1, (x, y) => (~x)); }
    __and__(b) { return this.expand(b, (x, y) => (x & y)); }
    __or__(b) { return this.expand(b, (x, y) => (x | y)); }
    __xor__(b) { return this.expand(b, (x, y) => (x ^ y)); }

    __mul__(b) { return this.expand(b, (x, y) => x * y); }
    __div__(b) { return this.expand(b, (x, y) => x / y); }
    __mod__(b) { return this.expand(b, (x, y) => x % y); }
    __rshift__(b) { return this.expand(b, (x, y) => x >> y); }
    __lshift__(b) { return this.expand(b, (x, y) => x << y); }
    __rtshift__(b) { return this.expand(b, (x, y) => x >> y); }

    __lt__(b) { return this.expand(b, (x, y) => (x < y)); }
    __gt__(b) { return this.expand(b, (x, y) => (x > y)); }
    __le__(b) { return this.expand(b, (x, y) => (x <= y)); }
    __ge__(b) { return this.expand(b, (x, y) => (x >= y)); }
    __eq__(b) { return this.expand(b, (x, y) => (x == y)); }
    __teq__(b) { return this.expand(b, (x, y) => (x === y)); }

    __ne__(b) { return this.expand(b, (x, y) => (x != y)); }
    __tne__(b) { return this.expand(b, (x, y) => (x !== y)); }

    __ternary__(b, c) {
        var left = this.expand(b, (x, y) => (x ? y : undefined));
        return left.expand(c, (x, y) => (x === undefined ? y : x));
    }

    __assign__(b) {
        this.data = b.data;
        this.shape = b.shape;
        this.stride = b.stride;
        this.dtype = b.dtype;
        return this;
    }

    __iadd__(b) { return this.__assign__(this.__add__(b)); }
    __isub__(b) { return this.__assign__(this.__sub__(b)); }
    __idiv__(b) { return this.__assign__(this.__div__(b)); }
    __imul__(b) { return this.__assign__(this.__mul__(b)); }
    __imod__(b) { return this.__assign__(this.__mod__(b)); }

    __irshift__(b) { return this.__assign__(this.__rshift__(b)); }
    __ilshift__(b) { return this.__assign__(this.__lshift__(b)); }
    __irtshift__(b) { return this.__assign__(this.__rtshift__(b)); }

    __ior__(b) { return this.__assign__(this.__or__(b)); }
    __ixor__(b) { return this.__assign__(this.__xor__(b)); }
    __iand__(b) { return this.__assign__(this.__and__(b)); }

    __logand__(b) { return this.expand(b, (x, y) => (x && y)); }
    __logor__(b) { return this.expand(b, (x, y) => (x || y)); }

    __attr__(b) { var ret = this[b];
        var that = this;
        if (typeof(ret) === 'function') return (function() { return ret.apply(that, arguments); });
        return ret;
    }

    sum(axis) {
        var shape = this.shape;
        var idx = new Array(shape.length);
        for (var i = 0; i < shape.length; i++) {
            idx[i] = range(0, -1, 1);
        }
        var ret_shape = shape.slice();
        ret_shape.splice(axis, 1);
        var ret = new ndarray(ret_shape, this.dtype);
        for (var i = 0; i < shape[axis]; i++) {
            idx[axis] = i;
            ret.__iadd__(this.__index__(idx));
        }
        return ret;
    }

    dot(b) {
        var shape = b.shape.slice();
        shape[0] = this.shape[0];
        var ret = new nd.array(shape, this.dtype);
        for (var i = 0; i < this.shape[0]; i++) {
            var tmp = this.__index__(i).__mul__(b).sum(1);
        }
    }
};

for (var k in ndarray.prototype) {
    if (ndarray.prototype.hasOwnProperty(k) && k.startsWith('__') && k.endsWith('__')) {
        var name = k.substr(2, k.length - 4);
        ndarray.prototype[name] = ndarray.prototype[k];
    }
}

// console.log(exports);

exports.ndarray = ndarray;
exports.range = range;
exports.random = random;

})();