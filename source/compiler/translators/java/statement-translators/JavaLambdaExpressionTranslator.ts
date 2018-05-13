import AbstractTranslator from '../../../common/AbstractTranslator';
import JavaBlockTranslator from '../JavaBlockTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaLambdaExpressionTranslator extends AbstractTranslator<JavaSyntax.IJavaLambdaExpression> {
  @Implements protected translate (): void {
    this.emit('function (')
      .emitParameters()
      .emit(') {')
      .enterBlock()
      .emitBody()
      .exitBlock()
      .emit('}');
  }

  private emitBody (): this {
    const { block, statement } = this.syntaxNode;

    if (block) {
      return this.emitNodeWith(JavaBlockTranslator, block);
    } else {
      return this.emit('return ')
        .emitNodeWith(JavaStatementTranslator, statement)
        .emit(';');
    }
  }

  private emitParameters (): this {
    const { parameters } = this.syntaxNode;

    return this.emitNodes(
      parameters,
      parameter => {
        const isVariableDeclaration = parameter.node === JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION;

        this.emit(
          isVariableDeclaration
            ? (parameter as JavaSyntax.IJavaVariableDeclaration).name
            : (parameter as JavaSyntax.IJavaReference).value
        );
      },
      () => this.emit(', ')
    );
  }
}
