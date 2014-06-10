import {Token} from '../syntax/Token'
import {LiteralToken} from '../syntax/LiteralToken'
import {IdentifierToken} from '../syntax/IdentifierToken'
import {STRING, NUMBER, IN} from '../syntax/TokenType'
import {NewExpression,
    IdentifierExpression,
    LiteralExpression,
    CallExpression,
    ArgumentList,
    ThisExpression,
    MemberExpression,
    ParenExpression,
    ConditionalExpression,
    ArrowFunctionExpression,
    FormalParameterList} from '../syntax/trees/ParseTrees'
import {ParseTreeTransformer} from './ParseTreeTransformer'

import './StanGrammarRuntime';

var op_to_special = global.Stan.op_to_special;

export class StanGrammarTransformer extends ParseTreeTransformer {
    /* transformBinaryOverload(tree) {
        var spec = '__' + op_to_special[tree.operator.type] + '__';
        return new ConditionalExpression(null,
            new BinaryOperator(null,
                new LiteralExpression(null, new LiteralToken(STRING, spec, spec.length)),
                new Token(IN, 2),
                ))
    } */

    transformBinaryOperator(tree) {
        // console.log(tree.operator.type);
        var type = tree.operator.type;
        if (type == '->') return this.transformChainingOperator(tree);
        if (type == '\\') return this.transformRangeOperator(tree);

        var spec = '__' + op_to_special[type] + '__';

        if (spec === undefined) {
            throw Error('Undefined special method for operator ' + type);
        }

        //console.log(tree);
        var args = new ArgumentList(null, [tree.right]);
        //console.log(args);
        //var params = new
        //var arrow = new ArrowFunctionExpression(null, null, params, body);
        //var arrow = '((a, b) => { if (\'' + spec + '\' in a) a.' + spec + '(b); else a ' + type = ' b; })';
        return new CallExpression(null, new MemberExpression(null, new ParenExpression(null, tree.left), spec) , args);

        return super(tree);
    }

    transformChainingOperator(tree) {
        console.log('transformChainingOperator()');
        var left = this.transformAny(tree.left);
        var right = this.transformAny(tree.right);
        if ('args' in right) {
            var args = right.args.args.slice()  ;
            args.push(left);
            args = new ArgumentList(null, args);
            return new CallExpression(null, right.operand, args);
        } else {
            throw Error('Right-hand side of chaining operator must be a call expression.');
        }
    }

    transformRangeOperator(tree) {
        var left = tree.left;
        var right = this.transformAny(tree.right);
        var step = new LiteralExpression(new LiteralToken(NUMBER, '1', 1))
        if ('operator' in left && left.operator.type == '\\') {
            step = this.transformAny(left.right);
            left = this.transformAny(left.left);
        } else {
            left = this.transformAny(left);
        }
        var args = new ArgumentList(null, [left, right, step]);
        var ret = new CallExpression(null, new IdentifierExpression(null, new IdentifierToken(null, 'range')), args);
        return ret;
    }

    transformUnaryExpression(tree) {
        if (tree.operator.type == '\\') {
            if ('args' in tree.operand) {
                return new NewExpression(null, tree.operand.operand, tree.operand.args);
            } else if ('memberName' in tree.operand) {
                return new MemberExpression(null, new ThisExpression(null), tree.operand.memberName );
            } else {
                console.log(tree);
                throw Error("Incorrect usage of backslash unary operator");
            }
        }



        return super(tree);
    }

    transformPostfixExpression(tree) {
        var type = tree.operator.type;
        var args = new ArgumentList(null, []);
        // return new CallExpression(null, new MemberExpression(null, tree.operand, '__' + op_to_special[type] + '__'), args)
        return super(tree);
    }

    transformAssignmentExpression(tree) {
        console.log("Here!!!!!");
        return super(tree);
    }
}