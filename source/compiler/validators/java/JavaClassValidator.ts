import AbstractValidator from '../../common/AbstractValidator';
import { Callback } from '../../../system/types';
import { Implements, Bound } from 'trampoline-framework';
import { ISymbol, ObjectCategory, TypeDefinition } from '../../symbol-resolution/types';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolution/object-type';
import { TypeUtils } from '../../symbol-resolution/type-utils';

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
      this.validateType(extended[0], this.assertIsValidSuperclass);
    }

    if (implemented.length > 0) {
      for (const implementedType of implemented) {
        this.validateType(implementedType, this.assertIsValidImplementedInterface);
      }
    }
  }

  private validateType ({ namespaceChain }: JavaSyntax.IJavaType, validate: TypeValidator): void {
    const outerNamespace = namespaceChain[0];
    const symbolIdentifier = namespaceChain.join('.');
    const isOuterNamespaceInScope = this.scopeManager.isInScope(outerNamespace);

    this.assertAndContinue(
      isOuterNamespaceInScope,
      `Unknown identifier '${outerNamespace}'`
    );

    const outerNamespaceSymbol = this.symbolDictionary.getSymbol(outerNamespace);
    const { type, identifier } = outerNamespaceSymbol;

    if (namespaceChain.length === 1) {
      validate(type, identifier);
    } else {
      const memberChain = namespaceChain.slice(1);
      const objectMember = this.findDeepObjectMember(outerNamespaceSymbol as ISymbol<ObjectType.Definition>, memberChain);

      if (objectMember) {
        validate(objectMember.type, symbolIdentifier);
      }
    }
  }

  @Bound private assertIsValidSuperclass (typeDefinition: TypeDefinition, superclassName: string): void {
    if (TypeUtils.isDynamic(typeDefinition)) {
      // If the superclass type is dynamic, it likely comes
      // from a project-external import, so we can't rule
      // out its extensibility.
      return;
    }

    if (typeDefinition instanceof ObjectType.Definition) {
      if (typeDefinition.category !== ObjectCategory.CLASS) {
        this.report(`Class '${this.className}' cannot extend non-class '${superclassName}'`);
      } else if (!typeDefinition.isExtensible) {
        this.report(`Class '${superclassName}' cannot be extended by '${this.className}'`);
      }
    } else {
      this.report(`Class '${this.className}' cannot extend non-class '${superclassName}'`);
    }
  }

  @Bound private assertIsValidImplementedInterface (typeDefinition: TypeDefinition, interfaceName: string): void {
    if (TypeUtils.isDynamic(typeDefinition)) {
      // If the interface type is dynamic, it likely comes
      // from a project-external import, so we can't rule
      // out that it can be implemented.
      return;
    }

    this.assertAndContinue(
      typeDefinition instanceof ObjectType.Definition &&
      typeDefinition.category === ObjectCategory.INTERFACE,
      `Class '${this.className}' cannot implement non-interface '${interfaceName}'`
    );
  }
}
