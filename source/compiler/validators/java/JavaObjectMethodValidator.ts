import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  @Implements public validate (): void {
    const { name, isAbstract, block } = this.syntaxNode;
    const identifier = this.getNamespacedIdentifier(name);

    if (isAbstract) {
      this.check(
        block === null,
        `Abstract method '${identifier}' cannot have an implementation`
      );
    } else {
      this.check(
        block !== null,
        `Non-abstract method '${identifier}' must have an implementation`
      );
    }

    if (block) {
      this.validateNodeWith(JavaBlockValidator, block);
    }
  }
}
