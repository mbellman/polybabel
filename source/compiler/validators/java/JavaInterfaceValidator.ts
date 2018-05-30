import AbstractValidator from '../../common/AbstractValidator';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { Implements } from 'trampoline-framework';

export default class JavaInterfaceValidator extends AbstractValidator<JavaSyntax.IJavaInterface> {
  @Implements public validate (javaInterface: JavaSyntax.IJavaInterface): void {
    const { name } = javaInterface;

    this.scopeManager.addToScope(name);
  }
}
