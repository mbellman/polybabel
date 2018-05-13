import AbstractTranslator from '../../../common/AbstractTranslator';
import JavaBlockTranslator from '../JavaBlockTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaIfElseTranslator extends AbstractTranslator<JavaSyntax.IJavaIfElse> {
  @Implements protected translate (): void {
    const { blocks, conditions } = this.syntaxNode;

    this.emitNodes(
      blocks,
      (block, index) => {
        const isLastBlock = index === blocks.length - 1;

        if (isLastBlock && blocks.length > 1) {
          this.emit(' else {');
        } else {
          this.emit(index === 0 ? 'if (' : ' else if (')
            .emitNodeWith(JavaStatementTranslator, conditions[index])
            .emit(') {');
        }

        this.enterBlock()
          .emitNodeWith(JavaBlockTranslator, block)
          .exitBlock()
          .emit('}');
      }
    );
  }
}
