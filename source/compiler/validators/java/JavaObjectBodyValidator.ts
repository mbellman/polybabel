import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaObjectBodyValidator extends AbstractValidator<JavaSyntax.IJavaObject> {
  @Implements public validate (): void {
    const { members } = this.syntaxNode;
  }
}
