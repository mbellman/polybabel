import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import JavaObjectValidator from './JavaObjectValidator';

export default class JavaInterfaceValidator extends AbstractValidator<JavaSyntax.IJavaInterface> {
  @Implements public validate (): void {
    const { name } = this.syntaxNode;

    this.validateNodeWith(JavaObjectValidator, this.syntaxNode);
  }
}
