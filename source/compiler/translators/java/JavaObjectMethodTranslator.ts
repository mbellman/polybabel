import AbstractTranslator from '../../common/AbstractTranslator';
import JavaBlockTranslator from './JavaBlockTranslator';
import JavaStatementTranslator from './JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaTranslatorUtils } from './java-translator-utils';

export default class JavaObjectMethodTranslator extends AbstractTranslator<JavaSyntax.IJavaObjectMethod> {
  @Implements protected translate (): void {
    const { isStatic, name, parameters, block } = this.syntaxNode;
    let hasVariadicParameter = false;

    this.emit('function (')
      .emitNodes(
        parameters,
        parameter => {
          if (parameter.isVariadic) {
            hasVariadicParameter = true;
          }

          this.emit(`${parameter.name}`);
        },
        () => this.emit(', ')
      )
      .emit(') {')
      .enterBlock();

    if (hasVariadicParameter) {
      this.emitVariadicParameterPolyfill();
    }

    this.emitNodeWith(JavaBlockTranslator, block)
      .exitBlock()
      .emit('}');
  }

  private emitVariadicParameterPolyfill (): this {
    const { parameters } = this.syntaxNode;

    parameters.forEach(({ isVariadic, name }, index) => {
      if (isVariadic) {
        this.emit(`${name} = Array.prototype.slice.call(arguments, ${index});`);
      }
    });

    return this;
  }
}
