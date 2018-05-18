import AbstractTranslator from '../../../common/AbstractTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaAssertionTranslator extends AbstractTranslator<JavaSyntax.IJavaAssertion> {
  @Implements protected translate (): void {
    const { condition, message } = this.syntaxNode;

    this.emit('if (!(')
      .emitNodeWith(JavaStatementTranslator, condition)
      .emit(')) {')
      .enterBlock()
      .emit('throw new Error(');

    if (message) {
      this.emitNodeWith(JavaStatementTranslator, message);
    }

    this.emit(');')
      .exitBlock()
      .emit('}');
  }
}
