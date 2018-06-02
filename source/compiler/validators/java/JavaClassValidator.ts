import AbstractValidator from '../common/AbstractValidator';
import { Bound, Implements } from 'trampoline-framework';
import { Callback } from '../../../system/types';
import { ISymbol, ObjectCategory, TypeDefinition } from '../../symbol-resolvers/common/types';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ValidationUtils } from '../common/validation-utils';

/**
 * @internal
 */
type TypeValidator = (typeDefinition: TypeDefinition, identifier: string) => void;

export default class JavaClassValidator extends AbstractValidator<JavaSyntax.IJavaClass> {
  private className: string;

  @Implements public validate (javaClass: JavaSyntax.IJavaClass): void {
    const { name, extended, implemented } = javaClass;

    this.className = name;

    this.scopeManager.addToScope(name);

    if (extended.length !== 0) {
      this.validateDeepObjectMemberType(extended[0].namespaceChain, this.validateSuperclass);
    }

    if (implemented.length > 0) {
      for (const implementedType of implemented) {
        this.validateDeepObjectMemberType(implementedType.namespaceChain, this.validateImplementedInterface);
      }
    }
  }

  @Bound private validateImplementedInterface (typeDefinition: TypeDefinition, interfaceName: string): void {
    this.assertAndContinue(
      ValidationUtils.isDynamicType(typeDefinition) ||
      ValidationUtils.isInterfaceType(typeDefinition),
      `Class '${this.className}' cannot implement non-interface '${interfaceName}'`
    );
  }

  @Bound private validateSuperclass (typeDefinition: TypeDefinition, superclassName: string): void {
    const isClassType = ValidationUtils.isClassType(typeDefinition);

    this.assertAndContinue(
      ValidationUtils.isDynamicType(typeDefinition) || isClassType,
      `Class '${this.className}' cannot extend non-class '${superclassName}'`
    );

    this.assertAndContinue(
      isClassType ? (typeDefinition as ObjectType.Definition).isExtensible : true,
      `Class '${superclassName}' cannot be extended by class '${this.className}'`
    );
  }
}
