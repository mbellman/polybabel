import AbstractValidator from '../common/AbstractValidator';
import JavaObjectValidator from './JavaObjectValidator';
import { Bound, Implements } from 'trampoline-framework';
import { Callback } from '../../../system/types';
import { ISymbol, ObjectCategory, TypeDefinition, Dynamic } from '../../symbol-resolvers/common/types';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaClassValidator extends AbstractValidator<JavaSyntax.IJavaClass> {
  private ownTypeDefinition: ObjectType.Definition;

  @Implements public validate (): void {
    const { name, extended, implemented, constructors, members } = this.syntaxNode;
    const { scopeManager, file, symbolDictionary, objectVisitor } = this.context;

    this.ownTypeDefinition = this.getTypeInCurrentNamespace(name) as ObjectType.Definition;

    if (extended.length !== 0) {
      this.validateSuperclass(extended[0]);
    }

    if (implemented.length > 0) {
      this.validateImplementations(implemented);
    }

    if (constructors.length > 0) {
      this.validateConstructors(constructors);
    }

    this.validateNodeWith(JavaObjectValidator, this.syntaxNode);
  }

  private isAbstractClass (): boolean {
    return this.ownTypeDefinition.requiresImplementation;
  }

  private validateConstructors (constructors: JavaSyntax.IJavaObjectMethod[]): void {
    // TODO
  }

  private validateImplementations (implementations: JavaSyntax.IJavaType[]): void {
    for (const implementation of implementations) {
      this.focus(implementation);

      const type = this.findTypeDefinition(implementation.namespaceChain);
      const name = implementation.namespaceChain.join('.');

      this.check(
        ValidatorUtils.isSimpleTypeOf(Dynamic, type) ||
        ValidatorUtils.isInterfaceType(type),
        `Class '${this.syntaxNode.name}' cannot implement non-interface '${name}'`
      );

      // TODO: Verify that non-default interface members have implementations
    }
  }

  private validateSuperclass (superclass: JavaSyntax.IJavaType): void {
    this.focus(superclass);

    const supertype = this.findTypeDefinition(superclass.namespaceChain);
    const name = superclass.namespaceChain.join('.');
    const supertypeIsClass = ValidatorUtils.isClassType(supertype);

    this.check(
      ValidatorUtils.isSimpleTypeOf(Dynamic, supertype) || supertypeIsClass,
      `Class '${this.syntaxNode.name}' cannot extend non-class '${name}'`
    );

    this.check(
      supertypeIsClass
        ? (supertype as ObjectType.Definition).isExtensible
        : true,
      `Class '${name}' is not extensible`
    );

    if (supertypeIsClass) {
      (supertype as ObjectType.Definition).forEachMember((superObjectMember, memberName) => {
        if (superObjectMember.requiresImplementation && !this.isAbstractClass()) {
          this.check(
            this.ownTypeDefinition.hasOwnObjectMember(memberName),
            `Class '${this.syntaxNode.name}' must implement abstract member '${name}.${memberName}'`
          );
        }

        if (superObjectMember.isConstant) {
          this.check(
            !this.ownTypeDefinition.hasOwnObjectMember(memberName),
            `Class '${this.syntaxNode.name}' cannot override final member '${name}.${memberName}'`
          );
        }
      });
    }
  }
}
