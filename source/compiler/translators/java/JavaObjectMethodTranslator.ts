import AbstractTranslator from '../common/AbstractTranslator';
import JavaBlockTranslator from './JavaBlockTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaObjectMethodTranslator extends AbstractTranslator<JavaSyntax.IJavaObjectMethod> {
  @Implements protected translate (): void {
    const { parameters, block, isConstructor } = this.syntaxNode;
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
      .newlineIf(isConstructor && block.nodes.length > 0)
      .emit(isConstructor ? 'return this;' : '')
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
