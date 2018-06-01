import AbstractValidator from '../../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectCategory, TypeDefinition } from '../../symbol-resolution/types';
import { ObjectType } from '../../symbol-resolution/object-type';

export default class JavaClassValidator extends AbstractValidator<JavaSyntax.IJavaClass> {
  private className: string;

  @Implements public validate (javaClass: JavaSyntax.IJavaClass): void {
    const { name, extended, implemented } = javaClass;

    this.className = name;

    this.scopeManager.addToScope(name);

    if (extended.length !== 0) {
      this.validateSuperclassType(extended[0]);
    }
  }

  private validateSuperclassType ({ namespaceChain }: JavaSyntax.IJavaType): void {
    const outerNamespace = namespaceChain[0];
    const symbolIdentifier = namespaceChain.join('.');
    const isNamespaceInScope = this.scopeManager.isInScope(outerNamespace);

    this.assert(
      isNamespaceInScope,
      `Unidentified superclass '${symbolIdentifier}'`
    );

    const typeDefinition = this.symbolDictionary.getSymbolType(outerNamespace);

    if (!this.isDynamic(typeDefinition)) {
      this.assert(
        typeDefinition instanceof ObjectType.Definition,
        `Class '${this.className}' cannot extend non-object type '${outerNamespace}'`
      );

      if (namespaceChain.length === 1) {
        this.assertIsValidSuperclass(typeDefinition);
      } else {
        const objectMember = (typeDefinition as ObjectType.Definition).findNestedObjectMember(namespaceChain.slice(1));

        this.assert(
          !!objectMember,
          `Invalid member '${symbolIdentifier}'`
        );

        this.assertIsValidSuperclass(objectMember.type);
      }
    }
  }

  private assertIsValidSuperclass (typeDefinition: TypeDefinition): void {
    this.assert(
      typeDefinition instanceof ObjectType.Definition &&
      typeDefinition.category === ObjectCategory.CLASS,
      `Class '${this.className}' can only extend other classes`
    );
  }
}
