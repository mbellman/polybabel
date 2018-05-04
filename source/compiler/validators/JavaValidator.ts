import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../parser/java/java-syntax';

export default class JavaValidator extends AbstractValidator<JavaSyntax.IJavaSyntaxTree> {
  @Implements public validate (): void {

  }
}
