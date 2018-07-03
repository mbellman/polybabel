import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaForLoopValidator extends AbstractValidator<JavaSyntax.IJavaForLoop> {
  @Implements public validate (): void {

  }
}
