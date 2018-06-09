import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectCategory } from '../../symbol-resolvers/common/types';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { JavaValidatorUtils } from './java-validator-utils';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaObjectMethodValidator extends AbstractValidator<JavaSyntax.IJavaObjectMethod> {
  private identifier: string;

  @Implements public validate (): void {
    const { name, isAbstract, block } = this.syntaxNode;
    const parentObjectType = this.context.objectVisitor.getCurrentVisitedObject();
    const isInterfaceMethod = parentObjectType.category === ObjectCategory.INTERFACE;

    this.identifier = this.getImmediateNamespacedIdentifier(name);

    this.validateReturnType();

    if (isAbstract) {
      this.check(
        !isInterfaceMethod,
        `Interface method '${this.identifier}' cannot be abstract`
      );

      this.check(
        block === null,
        `Abstract method '${this.identifier}' cannot have an implementation`
      );
    } else {
      this.check(
        block !== null || isInterfaceMethod,
        `Non-abstract method '${this.identifier}' must have an implementation`
      );
    }

    if (block) {
      this.validateNodeWith(JavaBlockValidator, block);
    }
  }

  private validateReturnType (): void {
    const { type } = this.syntaxNode;

    this.focus(type);

    const returnTypeDefinition = (
      JavaValidatorUtils.getNativeType(type.namespaceChain.join('.')) ||
      this.findTypeDefinition(type.namespaceChain)
    );

    if (returnTypeDefinition instanceof FunctionType.Definition) {
      const returnTypeDescription = ValidatorUtils.getTypeDescription(returnTypeDefinition);

      this.report(`Method '${this.identifier}' cannot return '${returnTypeDescription}'`);
    }
  }
}
