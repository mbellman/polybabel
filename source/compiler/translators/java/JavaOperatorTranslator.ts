import AbstractTranslator from '../../common/AbstractTranslator';
import { IHashMap, Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaOperatorTranslator extends AbstractTranslator<JavaSyntax.IJavaOperator> {
  private static readonly OperationMap: IHashMap<string> = {
    [JavaSyntax.JavaOperator.ADD]: '+',
    [JavaSyntax.JavaOperator.ADD_ASSIGN]: '+=',
    [JavaSyntax.JavaOperator.ASSIGN]: '=',
    [JavaSyntax.JavaOperator.SUBTRACT]: '-',
    [JavaSyntax.JavaOperator.SUBTRACT_ASSIGN]: '-=',
    [JavaSyntax.JavaOperator.MULTIPLY]: '*',
    [JavaSyntax.JavaOperator.MULTIPLY_ASSIGN]: '*=',
    [JavaSyntax.JavaOperator.DIVIDE]: '/',
    [JavaSyntax.JavaOperator.DIVIDE_ASSIGN]: '/=',
    [JavaSyntax.JavaOperator.REMAINDER]: '%',
    [JavaSyntax.JavaOperator.REMAINDER_ASSIGN]: '%=',
    [JavaSyntax.JavaOperator.INCREMENT]: '++',
    [JavaSyntax.JavaOperator.DECREMENT]: '--',
    [JavaSyntax.JavaOperator.NEGATE]: '!',
    [JavaSyntax.JavaOperator.EQUAL_TO]: '===',
    [JavaSyntax.JavaOperator.NOT_EQUAL_TO]: '!==',
    [JavaSyntax.JavaOperator.CONDITIONAL_AND]: '&&',
    [JavaSyntax.JavaOperator.CONDITIONAL_OR]: '||',
    [JavaSyntax.JavaOperator.ELVIS]: '||',
    [JavaSyntax.JavaOperator.GREATER_THAN]: '>',
    [JavaSyntax.JavaOperator.GREATER_THAN_OR_EQUAL_TO]: '>=',
    [JavaSyntax.JavaOperator.LESS_THAN]: '<',
    [JavaSyntax.JavaOperator.LESS_THAN_OR_EQUAL_TO]: '<=',
    [JavaSyntax.JavaOperator.BITWISE_COMPLEMENT]: '~',
    [JavaSyntax.JavaOperator.SIGNED_LEFT_SHIFT]: '<<',
    [JavaSyntax.JavaOperator.SIGNED_RIGHT_SHIFT]: '>>',
    [JavaSyntax.JavaOperator.UNSIGNED_RIGHT_SHIFT]: '>>>',
    [JavaSyntax.JavaOperator.BITWISE_AND]: '&',
    [JavaSyntax.JavaOperator.BITWISE_EXCLUSIVE_OR]: '^',
    [JavaSyntax.JavaOperator.BITWISE_INCLUSIVE_OR]: '|',
    [JavaSyntax.JavaOperator.INSTANCEOF]: 'instanceof'
  };

  @Implements protected translate (): void {
    const { operation } = this.syntaxNode;

    this.emit(JavaOperatorTranslator.OperationMap[operation]);
  }
}