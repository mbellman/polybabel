import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from './JavaBlockTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaTranslatorUtils } from './java-translator-utils';

export default class JavaObjectMethodTranslator extends AbstractTranslator<JavaSyntax.IJavaObjectMethod> {
  @Implements protected translate (): void {
    const { isStatic, name, parameters, block } = this.syntaxNode;

    this.emit(isStatic ? '(' : `${name} (`)
      .emitNodes(
        parameters,
        parameter => {
          if (parameter.isVariadic) {
            this.emit('...');
          }

          this.emit(`${parameter.name}`);
        },
        () => this.emit(', ')
      )
      .emit(') {')
      .enterBlock()
      .emitNodeWith(JavaBlockTranslator, block)
      .exitBlock()
      .emit('}');
  }
}
