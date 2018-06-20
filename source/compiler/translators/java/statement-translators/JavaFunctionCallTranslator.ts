import AbstractTranslator from '../../common/AbstractTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaFunctionCallTranslator extends AbstractTranslator<JavaSyntax.IJavaFunctionCall> {
  @Implements protected translate (): void {
    const { name, arguments: args } = this.syntaxNode;

    this.emit(`${name ? name : ''}(`)
      .emitNodes(
        args,
        argument => this.emitNodeWith(JavaStatementTranslator, argument),
        () => this.emit(', ')
      )
      .emit(')');
  }
}
