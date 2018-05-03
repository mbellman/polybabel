import AbstractValidator from '../common/AbstractValidator';
import { JavaSyntax } from 'parser/java/java-syntax';
import { Implements } from 'trampoline-framework';

export default class JavaValidator extends AbstractValidator<JavaSyntax.IJavaSyntaxTree> {
  @Implements public validate (): void {

  }
}
