import AbstractValidator from '../common/AbstractValidator';
import JavaObjectBodyValidator from './JavaObjectBodyValidator';
import { Bound, Implements } from 'trampoline-framework';
import { Callback } from '../../../system/types';
import { ISymbol, ObjectCategory, TypeDefinition } from '../../symbol-resolvers/common/types';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ValidationUtils } from '../common/validation-utils';

export default class JavaClassValidator extends AbstractValidator<JavaSyntax.IJavaClass> {
  private ownTypeDefinition: ObjectType.Definition;

  @Implements public validate (): void {
    const { name, extended, implemented, members } = this.syntaxNode;

    this.scopeManager.addToScope(name);

    this.ownTypeDefinition = this.getTypeDefinitionInCurrentNamespace(name) as ObjectType.Definition;

    if (extended.length !== 0) {
      this.validateSupertypeExtension(extended[0]);
    }

    if (implemented.length > 0) {
      this.validateImplementations(implemented);
    }

    this.enterNamespace(name);
    this.validateNodeWith(JavaObjectBodyValidator, this.syntaxNode);
    this.exitNamespace();
  }

  private getOwnName (): string {
    return this.syntaxNode.name;
  }

  private isAbstractClass (): boolean {
    return this.ownTypeDefinition.requiresImplementation;
  }

  private validateImplementations (implementations: JavaSyntax.IJavaType[]): void {
    for (const implementation of implementations) {
      const { type, name } = this.findType(implementation.namespaceChain);

      this.assertAndContinue(
        ValidationUtils.isDynamicType(type) ||
        ValidationUtils.isInterfaceType(type),
        `Class '${this.getOwnName()}' cannot implement non-interface '${name}'`
      );
    }
  }

  private validateSupertypeExtension (supertype: JavaSyntax.IJavaType): void {
    const { type, name } = this.findType(supertype.namespaceChain);
    const supertypeIsClass = ValidationUtils.isClassType(type);

    this.assertAndContinue(
      ValidationUtils.isDynamicType(type) || supertypeIsClass,
      `Class '${this.getOwnName()}' cannot extend non-class '${name}'`
    );

    this.assertAndContinue(
      supertypeIsClass
        ? (type as ObjectType.Definition).isExtensible
        : true,
      `Class '${name}' is not extensible`
    );

    if (supertypeIsClass) {
      (type as ObjectType.Definition).forEachMember((memberName, objectMember) => {
        if (objectMember.requiresImplementation && !this.isAbstractClass()) {
          this.assertAndContinue(
            this.ownTypeDefinition.hasOwnObjectMember(memberName),
            `Class '${this.getOwnName()}' must implement abstract member '${name}.${memberName}'`
          );
        }

        if (objectMember.isConstant) {
          this.assertAndContinue(
            !this.ownTypeDefinition.hasOwnObjectMember(memberName),
            `Class '${this.getOwnName()}' cannot override final member '${name}.${memberName}'`
          );
        }
      });
    }
  }
}
