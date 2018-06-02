import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from '../JavaBlockTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaForLoopTranslator extends AbstractTranslator<JavaSyntax.IJavaForLoop> {
  @Implements protected translate (): void {
    const { isEnhanced } = this.syntaxNode;

    if (isEnhanced) {
      this.emitEnhancedForLoop();
    } else {
      this.emitPlainForLoop();
    }
  }

  private emitEnhancedForLoop (): void {
    const { statements, block } = this.syntaxNode;
    const { name: iteratorValueName } = statements[0].leftSide as JavaSyntax.IJavaVariableDeclaration;
    const collection = statements[1];

    this.emitNodeWith(JavaStatementTranslator, collection)
      .emit(`.forEach(function (${iteratorValueName}) {`)
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, block)
      .exitBlock()
      .emit('});');
  }

  private emitPlainForLoop (): void {
    const { statements, block } = this.syntaxNode;

    this.emit('for (')
      .emitNodes(
        statements,
        statement => {
          // Regular for loops may have null statements
          // where ones were omitted
          if (statement) {
            this.emitNodeWith(JavaStatementTranslator, statement);
          }
        },
        () => this.emit(';')
      )
      .emit(') {')
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, block)
      .exitBlock()
      .emit('}');
  }
}
