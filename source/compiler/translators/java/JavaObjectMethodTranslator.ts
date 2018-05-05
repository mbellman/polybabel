import AbstractTranslator from '../../common/AbstractTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaTranslatorUtils } from './java-translator-utils';

export default class JavaObjectMethodTranslator extends AbstractTranslator<JavaSyntax.IJavaObjectMethod> {
  @Implements protected translate (): void {
    const { name, parameters, block } = this.syntaxNode;

    this.emit(`${name} (`)
      .emitNodeSequence(
        parameters,
        parameter => this.emit(`${parameter.name}`),
        () => this.emit(', ')
      )
      .emit(') {')
      .enterBlock()
      .emitNodeSequence(
        block.nodes,
        node => {
          this.emitNodeWith(JavaStatementTranslator, node)
            .emit(JavaTranslatorUtils.isTerminableStatement(node) ? ';' : '');
        },
        () => this.newline()
      )
      .exitBlock()
      .emit('}');
  }
}
