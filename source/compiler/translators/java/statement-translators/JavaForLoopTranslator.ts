import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from '../JavaBlockTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { ISyntaxNode, INamed } from '../../../../parser/common/syntax-types';
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
    const [ iteratorValue, collection ] = statements;

    const { name: iteratorValueName } = (
      iteratorValue.leftSide as JavaSyntax.IJavaVariableDeclaration | JavaSyntax.IJavaReference ||
      {} as INamed
    );

    this.emit('var __collection = ')
      .emitNodeWith(JavaStatementTranslator, collection)
      .emit(';')
      .newline()
      .emit('for (var i = 0; i < __collection.length; i++) {')
      .enterBlock()
      .emit(`var ${iteratorValueName} = __collection[i];`)
      .newline()
      .emitNodeWith(JavaBlockTranslator, block)
      .exitBlock()
      .emit('}');
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
