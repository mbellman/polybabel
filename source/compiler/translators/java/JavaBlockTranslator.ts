import AbstractTranslator from '../../common/AbstractTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaTranslatorUtils } from './java-translator-utils';

export default class JavaBlockTranslator extends AbstractTranslator<JavaSyntax.IJavaBlock> {
  @Implements protected translate (): void {
    const { nodes } = this.syntaxNode;

    this.emitNodes(
      nodes,
      node => {
        this.emitNodeWith(JavaStatementTranslator, node)
          .emit(JavaTranslatorUtils.isTerminableStatement(node) ? ';' : '');
      },
      () => this.newline()
    );
  }
}
