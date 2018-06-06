import AbstractValidator from '../common/AbstractValidator';
import JavaObjectValidator from './JavaObjectValidator';
import { Bound, Implements } from 'trampoline-framework';
import { Callback } from '../../../system/types';
import { ISymbol, ObjectCategory, TypeDefinition } from '../../symbol-resolvers/common/types';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaClassValidator extends AbstractValidator<JavaSyntax.IJavaClass> {
  private ownTypeDefinition: ObjectType.Definition;

  @Implements public validate (): void {
    const { name, extended, implemented, members } = this.syntaxNode;

    this.scopeManager.addToScope(name);

    this.ownTypeDefinition = this.findResolvedConstructInCurrentNamespace(name).type as ObjectType.Definition;

    if (extended.length !== 0) {
      this.validateSupertypeExtension(extended[0]);
    }

    if (implemented.length > 0) {
      this.validateImplementations(implemented);
    }

    this.enterNamespace(name);
    this.validateNodeWith(JavaObjectValidator, this.syntaxNode);
    this.exitNamespace();
  }

  private getClassIdentifier (): string {
    return this.getNamespacedIdentifier(this.syntaxNode.name);
  }

  private isAbstractClass (): boolean {
    return this.ownTypeDefinition.requiresImplementation;
  }

  private validateImplementations (implementations: JavaSyntax.IJavaType[]): void {
    for (const implementation of implementations) {
      const { type, name } = this.findResolvedConstruct(implementation.namespaceChain);

      this.check(
        ValidatorUtils.isDynamicType(type) ||
        ValidatorUtils.isInterfaceType(type),
        `Class '${this.getClassIdentifier()}' cannot implement non-interface '${name}'`
      );

      // TODO: Verify that non-default interface members have implementations
    }
  }

  private validateSupertypeExtension (supertype: JavaSyntax.IJavaType): void {
    const { type, name } = this.findResolvedConstruct(supertype.namespaceChain);
    const supertypeIsClass = ValidatorUtils.isClassType(type);

    this.check(
      ValidatorUtils.isDynamicType(type) || supertypeIsClass,
      `Class '${this.getClassIdentifier()}' cannot extend non-class '${name}'`
    );

    this.check(
      supertypeIsClass
        ? (type as ObjectType.Definition).isExtensible
        : true,
      `Class '${name}' is not extensible`
    );

    if (supertypeIsClass) {
      (type as ObjectType.Definition).forEachMember((superObjectMember, memberName) => {
        if (superObjectMember.requiresImplementation && !this.isAbstractClass()) {
          this.check(
            this.ownTypeDefinition.hasOwnObjectMember(memberName),
            `Class '${this.getClassIdentifier()}' must implement abstract member '${name}.${memberName}'`
          );
        }

        if (superObjectMember.isConstant) {
          this.check(
            !this.ownTypeDefinition.hasOwnObjectMember(memberName),
            `Class '${this.getClassIdentifier()}' cannot override final member '${name}.${memberName}'`
          );
        }
      });
    }
  }
}
