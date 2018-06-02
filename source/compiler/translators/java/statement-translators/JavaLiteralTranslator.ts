import AbstractTranslator from '../../common/AbstractTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaLiteralTranslator extends AbstractTranslator<JavaSyntax.IJavaLiteral> {
  @Implements protected translate (): void {
    const { type, value } = this.syntaxNode;

    switch (type) {
      case JavaSyntax.JavaLiteralType.STRING:
      case JavaSyntax.JavaLiteralType.NUMBER:
      case JavaSyntax.JavaLiteralType.KEYWORD:
        this.emit(value as string);
        break;
      case JavaSyntax.JavaLiteralType.ARRAY:
        this.emitArrayLiteral();
        break;
    }
  }

  private emitArrayLiteral (): void {
    const { value } = this.syntaxNode;

    this.emit('[ ')
      .emitNodes(
        value as JavaSyntax.IJavaStatement[],
        statement => this.emitNodeWith(JavaStatementTranslator, statement),
        () => this.emit(', ')
      )
      .emit(' ]');
  }
}
