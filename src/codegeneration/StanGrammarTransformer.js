/*
(C) Stanislaw Adaszewski, 2014
http://algoholic.eu
*/

import {Token} from '../syntax/Token';
import {LiteralToken} from '../syntax/LiteralToken';
import {IdentifierToken} from '../syntax/IdentifierToken';
import {STRING, NUMBER, IN} from '../syntax/TokenType';
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
    FormalParameterList,
    VariableDeclarationList,
    ReturnStatement,
    FunctionBody,
    VariableDeclaration,
    ExpressionStatement} from '../syntax/trees/ParseTrees';
import {ParseTreeTransformer} from './ParseTreeTransformer';
import {RETURN_STATEMENT, EXPRESSION_STATEMENT, PAREN_EXPRESSION} from '../syntax/trees/ParseTreeType';

import './StanGrammarRuntime';

var op_to_special = global.Stan.op_to_special;

export class StanGrammarTransformer extends ParseTreeTransformer {
    constructor(a, b) {
        super(a, b);

        this.varStack = [];
        this.varMap = {};
    }

    isStanVar(name) {
        return (this.varMap[name] > 0);
    }

    transformFunctionBody(tree) {
        //console.log('transformFunctionBody()');
        this.varStack.push([]);

        // var ret = super(tree);

        var statements = tree.statements;
        for (var i = 0; i < statements.length; i++) {
            statements[i] = this.transformAny(statements[i]);
            //console.log(statements[i].expression)
            if (i == statements.length - 1 && statements[i].expression && statements[i].type == EXPRESSION_STATEMENT && statements[i].expression.type == PAREN_EXPRESSION) {
                statements[i] = new ReturnStatement(null, statements[i].expression);
            }
        }
        var ret = new FunctionBody(null, statements);

        var remove = this.varStack.pop();
        for (var i = 0; i < remove.length; i++) {
            var name = remove[i];
            //console.log(name);
            var n = --this.varMap[name];
            if (n == 0) {
                delete this.varMap[name];
            }
        }

        return ret;
    }

    /* transformBinaryOverload(tree) {
        var spec = '__' + op_to_special[tree.operator.type] + '__';
        return new ConditionalExpression(null,
            new BinaryOperator(null,
                new LiteralExpression(null, new LiteralToken(STRING, spec, spec.length)),
                new Token(IN, 2),
                ))
    } */

    addStanVar(name) {
      this.varMap[name] = (this.varMap[name] || 0) + 1;
      this.varStack[this.varStack.length-1].push(name);
    }

    transformVariableDeclarationList(tree) {
      //console.log('transformVariableDeclarationList()');
      //console.log(tree);
      if (tree.declarationType == '\\') {
        var decl = tree.declarations;
        for (var i = 0; i < decl.length; i++) {
            var name = decl[i].lvalue.identifierToken.value;
            this.addStanVar(name);
        }
        return new VariableDeclarationList(
            tree.location, 'var', this.transformList(tree.declarations));
      } else {
        return super(tree);
      }
    }

    transformBinaryOperator(tree) {
        // console.log(tree.operator.type);
        var type = tree.operator.type;
        if (type == '->') return this.transformChainingOperator(tree);
        if (type == '\\') return this.transformRangeOperator(tree);

        var spec = '__' + op_to_special[type] + '__';

        if (spec === undefined) {
            throw Error('Undefined special method for operator ' + type);
        }

        //console.log(tree.left);
        var args = new ArgumentList(null, [tree.left, tree.right]);
        //console.log(args);
        //var params = new
        //var arrow = new ArrowFunctionExpression(null, null, params, body);
        //var arrow = '((a, b) => { if (\'' + spec + '\' in a) a.' + spec + '(b); else a ' + type = ' b; })';
        //return new CallExpression(null, new IdentifierExpression(null, new IdentifierToken(null, spec)), args);
        var left = this.transformAny(tree.left);
        if (left.identifierToken) {
            //console.log("identifier!");
            var name = left.identifierToken.value;
            //console.log(name);
            if (this.isStanVar(name)) {
                //console.log("is Stan variable!");
                var spec = '__' + op_to_special[type] + '__';
                var args = new ArgumentList(null, [this.transformAny(tree.right)]);
                var ret = new CallExpression(null, new MemberExpression(null, left, spec), args);
                ret.isStan = true;
                return ret;
            }
        } else if (left.isStan) {
            var spec = '__' + op_to_special[type] + '__';
            var args = new ArgumentList(null, [this.transformAny(tree.right)]);
            var ret = new CallExpression(null, new MemberExpression(null, new ParenExpression(null, left), spec), args);
            ret.isStan = true;
            return ret;
        }

        var ret = super(tree);
        ret.isStan = tree.left.isStan;
        return ret;
    }

    transformMemberLookupExpression(tree) {
        var left = this.transformAny(tree.operand);
        if (left.isStan || (left.identifierToken && this.isStanVar(left.identifierToken.value))) {
            var expr = this.transformAny(tree.memberExpression);
            var ret = new CallExpression(null, new MemberExpression(null, new ParenExpression(null, left), '__index__'), new ArgumentList(null, [expr]));
            ret.isStan = true;
            return ret;
        } else {
            return super(tree);
        }
    }

    transformConditionalExpression(tree) {
        var condition = this.transformAny(tree.condition);
        if (condition.isStan || (condition.identifierToken && this.isStanVar(condition.identifierToken.value))) {
          var left = this.transformAny(tree.left);
          var right = this.transformAny(tree.right);
          var ret = new CallExpression(null, new MemberExpression(null, new ParenExpression(null, condition), '__ternary__'), new ArgumentList(null, [left, right]));
          ret.isStan = true;
          return ret;
        } else {
          return super(tree);
        }
    }

    transformMemberExpression(tree) {
      var operand = this.transformAny(tree.operand);
      if (operand.isStan || (operand.identifierToken && this.isStanVar(operand.identifierToken.value))) {
        //console.log(tree.memberName);
        var ret = new CallExpression(null, new MemberExpression(null, new ParenExpression(null, operand), '__attr__'), new ArgumentList(null, [new LiteralExpression(null, new LiteralToken(STRING, '\'' + tree.memberName.value + '\''))]));
        ret.isStan = true;
        return ret;
      } else {
        return super(tree);
      }
    }

    transformChainingOperator(tree) {
        //console.log('transformChainingOperator()');
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
                var ret = new NewExpression(null, tree.operand.operand, tree.operand.args);
                ret.isStan = true;
                return ret;
            } else if ('memberName' in tree.operand) {
                var ret = new MemberExpression(null, new ThisExpression(null), tree.operand.memberName );
                ret.isStan = true;
                return ret;
            } else {
                //console.log(tree);
                throw Error("Incorrect usage of backslash unary operator");
            }
        }



        return super(tree);
    }

    transformPostfixExpression(tree) {
        var type = tree.operator.type;
        var args = new ArgumentList(null, []);
        var operand = this.transformAny(tree.operand);
        if (operand.isStan || (operand.identifierToken && this.isStanVar(operand.identifierToken.value))) {
            return new CallExpression(null, new MemberExpression(null, operand, '__' + op_to_special[type] + '__'), args)
        } else {
            return super(tree);
        }
    }

    transformExpressionStatement(tree) {
        console.log(tree.expression);
        if (tree.expression.expressions) {
          var exps = tree.expression.expressions;
          var left = exps[0].left || exps[0];

          if (left && left.operator && left.operator.type == '\\' && left.operand.identifierToken) {
            console.log('Here!!!');
            var decl = [];
            for (var i = 0; i < exps.length; i++) {
              if (exps[i].right && exps[i].operator.type != '=') {
                throw Error('Illegal Stan variable initialization');
              }
              var lvalue = (i == 0) ? exps[i].left.operand : (exps[i].left || exps[i]);
              if (!lvalue.identifierToken) {
                throw Error('Illegal Stan variable declaration');
              }
              this.addStanVar(lvalue.identifierToken.value);
              var initializer = exps[i].right ? this.transformAny(exps[i].right) : null;
              decl.push(new VariableDeclaration(null, lvalue, null, initializer));
            }
            return new ExpressionStatement(null, new VariableDeclarationList(null, 'var', decl));
          }
        } else {
          var exp = tree.expression;
          var left = exp.left || exp;
          if (left && left.operator && left.operator.type == '\\' && left.operand.identifierToken) {
            if (exp.right && exp.operator.type != '=') {
              throw Error('Illegal Stan variable initialization');
            }
            var lvalue = left.operand;
            this.addStanVar(lvalue.identifierToken.value);
            var initializer = exp.right ? this.transformAny(exp.right) : null;
            var decl = new VariableDeclaration(null, lvalue, null, initializer);
            return new ExpressionStatement(null, new VariableDeclarationList(null, 'var', [decl]));
          }
        }
        /*if (left && left.operator && left.operator.type == '\\') {
          console.log(left);
          if (left.operand && left.operand.identifierToken) {
            console.log("Here!!");
          }
          //return new VariableDeclarationList(null, 'var', [decl]);
        }*/
        return super(tree);
    }

    transformAssignmentExpression(tree) {
        //console.log("Here!!!!!");
        return super(tree);
    }
}