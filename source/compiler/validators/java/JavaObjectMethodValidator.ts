import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectCategory } from '../../symbol-resolvers/common/types';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  @Implements public validate (): void {
    const { name, isAbstract, block } = this.syntaxNode;
    const identifier = this.getImmediateNamespacedIdentifier(name);
    const parentObjectType = this.context.objectVisitor.getCurrentVisitedObject();
    const isInterface = parentObjectType.category === ObjectCategory.INTERFACE;

    if (isAbstract) {
      this.check(
        !isInterface,
        `Interface method '${identifier}' cannot be abstract`
      );

      this.check(
        block === null,
        `Abstract method '${identifier}' cannot have an implementation`
      );
    } else {
      this.check(
        block !== null || isInterface,
        `Non-abstract method '${identifier}' must have an implementation`
      );
    }

    if (block) {
      this.validateNodeWith(JavaBlockValidator, block);
    }
  }
}
