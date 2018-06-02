import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from '../JavaBlockTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaSwitchTranslator extends AbstractTranslator<JavaSyntax.IJavaSwitch> {
  @Implements protected translate (): void {
    const { value, defaultBlock } = this.syntaxNode;

    this.emit('switch (')
      .emitNodeWith(JavaStatementTranslator, value)
      .emit(') {')
      .enterBlock()
      .emitCaseBlocks();

    if (defaultBlock) {
      this.emitDefaultBlock();
    }

    this.exitBlock()
      .emit('}');
  }

  private emitCaseBlocks (): void {
    const { cases, blocks } = this.syntaxNode;

    this.emitNodes(
      cases,
      (caseStatement, index) => {
        this.emit('case ')
          .emitNodeWith(JavaStatementTranslator, caseStatement)
          .emit(':')
          .enterBlock()
          .emitNodeWith(JavaBlockTranslator, blocks[index])
          .exitBlock();
      }
    );
  }

  private emitDefaultBlock (): void {
    const { defaultBlock } = this.syntaxNode;

    this.emit('default:')
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, defaultBlock)
      .exitBlock();
  }
}
