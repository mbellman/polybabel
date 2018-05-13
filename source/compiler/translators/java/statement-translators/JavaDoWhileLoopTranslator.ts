import AbstractTranslator from '../../../common/AbstractTranslator';
import JavaBlockTranslator from '../JavaBlockTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaDoWhileLoopTranslator extends AbstractTranslator<JavaSyntax.IJavaDoWhileLoop> {
  @Implements protected translate (): void {
    const { block, condition } = this.syntaxNode;

    this.emit('do {')
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, block)
      .exitBlock()
      .emit('} while (')
      .emitNodeWith(JavaStatementTranslator, condition)
      .emit(')');
  }
}
