import AbstractTranslator from '../common/AbstractTranslator';
import { IHashMap, Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaOperatorTranslator extends AbstractTranslator<JavaSyntax.IJavaOperator> {
  private static readonly OperationMap: IHashMap<string> = {
    [JavaSyntax.JavaOperation.ADD]: '+',
    [JavaSyntax.JavaOperation.ASSIGN]: '=',
    [JavaSyntax.JavaOperation.SUBTRACT]: '-',
    [JavaSyntax.JavaOperation.MULTIPLY]: '*',
    [JavaSyntax.JavaOperation.DIVIDE]: '/',
    [JavaSyntax.JavaOperation.REMAINDER]: '%',
    [JavaSyntax.JavaOperation.INCREMENT]: '++',
    [JavaSyntax.JavaOperation.DECREMENT]: '--',
    [JavaSyntax.JavaOperation.NEGATE]: '!',
    [JavaSyntax.JavaOperation.DOUBLE_NOT]: '!!',
    [JavaSyntax.JavaOperation.EQUAL_TO]: '===',
    [JavaSyntax.JavaOperation.NOT_EQUAL_TO]: '!==',
    [JavaSyntax.JavaOperation.CONDITIONAL_AND]: '&&',
    [JavaSyntax.JavaOperation.CONDITIONAL_OR]: '||',
    [JavaSyntax.JavaOperation.ELVIS]: '||',
    [JavaSyntax.JavaOperation.GREATER_THAN]: '>',
    [JavaSyntax.JavaOperation.GREATER_THAN_OR_EQUAL_TO]: '>=',
    [JavaSyntax.JavaOperation.LESS_THAN]: '<',
    [JavaSyntax.JavaOperation.LESS_THAN_OR_EQUAL_TO]: '<=',
    [JavaSyntax.JavaOperation.BITWISE_COMPLEMENT]: '~',
    [JavaSyntax.JavaOperation.SIGNED_LEFT_SHIFT]: '<<',
    [JavaSyntax.JavaOperation.SIGNED_RIGHT_SHIFT]: '>>',
    [JavaSyntax.JavaOperation.UNSIGNED_RIGHT_SHIFT]: '>>>',
    [JavaSyntax.JavaOperation.BITWISE_AND]: '&',
    [JavaSyntax.JavaOperation.BITWISE_EXCLUSIVE_OR]: '^',
    [JavaSyntax.JavaOperation.BITWISE_INCLUSIVE_OR]: '|',
    [JavaSyntax.JavaOperation.INSTANCEOF]: 'instanceof'
  };

  @Implements protected translate (): void {
    const { operation, isShorthandAssignment } = this.syntaxNode;

    this.emit(JavaOperatorTranslator.OperationMap[operation]);

    if (isShorthandAssignment) {
      this.emit('=');
    }
  }
}
