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

  /**
   * @todo Refactor this ASAP.
   */
  private validateSuperclassType ({ namespaceChain }: JavaSyntax.IJavaType): void {
    if (namespaceChain.length === 1) {
      const superclassName = namespaceChain[0];
      const isSuperclassInScope = this.scopeManager.isInScope(superclassName);

      this.assert(
        isSuperclassInScope,
        `Unidentified superclass '${superclassName}'`
      );

      if (isSuperclassInScope) {
        const typeDefinition = this.symbolDictionary.getSymbolType(superclassName);

        this.assertIsValidSuperclass(typeDefinition);
      }
    } else {
      const outerNamespace = namespaceChain[0];
      const symbolIdentifier = namespaceChain.join('.');
      const isNamespaceInScope = this.scopeManager.isInScope(outerNamespace);

      this.assert(
        isNamespaceInScope,
        `Unidentified superclass '${symbolIdentifier}'`
      );

      if (isNamespaceInScope) {
        let typeDefinition = this.symbolDictionary.getSymbolType(outerNamespace);
        let namespaceIndex = 0;

        while ((typeDefinition instanceof ObjectType.Definition) && namespaceIndex < namespaceChain.length - 1) {
          const memberName = namespaceChain[++namespaceIndex];
          const objectMember = typeDefinition.getObjectMember(memberName);

          this.assert(
            !!objectMember,
            `Could not find member '${namespaceChain.slice(0, namespaceIndex + 1).join('.')}'`
          );

          const { type } = objectMember;

          typeDefinition = type;
        }

        this.assertIsValidSuperclass(typeDefinition);
      }
    }
  }

  private assertIsValidSuperclass (typeDefinition: TypeDefinition): void {
    this.assert(
      this.isDynamic(typeDefinition) ||
      typeDefinition instanceof ObjectType.Definition &&
      typeDefinition.category === ObjectCategory.CLASS,
      `Class '${this.className}' can only extend other classes`
    );
  }
}
