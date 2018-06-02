import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from '../JavaBlockTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaWhileLoopTranslator extends AbstractTranslator<JavaSyntax.IJavaWhileLoop> {
  @Implements protected translate (): void {
    const { condition, block } = this.syntaxNode;

    this.emit('while (')
      .emitNodeWith(JavaStatementTranslator, condition)
      .emit(') {')
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, block)
      .exitBlock()
      .emit('}');
  }
}
