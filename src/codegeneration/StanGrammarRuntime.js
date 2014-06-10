(function() {
var op_to_special = {
    "++": "iinc",
    "--": "idec",
    "+": "add",
    "-": "sub",
    "!": "not",
    "~": "invert",
    "&": "and",
    "|": "or",
    "^": "xor",
    "*": "mul",
    "/": "div",
    "%": "mod",
    ">>": "rshift",
    "<<": "lshift",
    ">>>": "rtshift",
    "<": "lt",
    ">": "gt",
    "<=": "le",
    ">=": "ge",
    "==": "eq",
    "===": "teq",
    "!=": "ne",
    "!==": "tne",
    "?": "ternary",
    "=": "assign",
    "+=": "iadd",
    "-=": "isub",
    "/=": "idiv",
    "*=": "imul",
    "%=": "imod",
    ">>=": "irshift",
    "<<=": "ilshift",
    ">>>=": "irtshift",
    "|=": "ior",
    "^=": "ixor",
    "&=": "iand",
    "&&": "logand",
    "||": "logor",
};

 function prepare_runtime() {
    console.log('prepare_runtime()');
    for (var k in op_to_special) {
        var v = op_to_special[k];
        var stat = 'Object.prototype["__' + v + '__"] = function(a) { return ';
        if (v == 'assign') {
            stat += 'a; };'
        } else if (v == 'ternary') {
            stat = 'Object.prototype["__' + v + '__"] = function(a, b) { return this.valueOf() ? a : b; };';
        } else if (v == 'not' || v == 'invert') {
            stat += k + 'this.valueOf(); };';
        } else if (v[0] == 'i') {
            stat += 'this.__' + v.substr(1) + '__(a); };';
        } else {
            stat += 'this.valueOf() ' + k + ' a; };';
        }
        eval(stat);
    }
}

global.Stan = {'prepare_runtime': prepare_runtime, 'op_to_special': op_to_special};

})();