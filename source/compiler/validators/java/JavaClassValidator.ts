import AbstractValidator from '../common/AbstractValidator';
import JavaObjectMethodValidator from './JavaObjectMethodValidator';
import JavaObjectValidator from './JavaObjectValidator';
import { Dynamic } from '../../symbol-resolvers/common/types';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaClassValidator extends AbstractValidator<JavaSyntax.IJavaClass> {
  /**
   * Keeps track of the class' object type definition so it
   * needn't be searched again by name.
   */
  private ownTypeDefinition: ObjectType.Definition;

  @Implements public validate (): void {
    const { objectVisitor } = this.context;
    const { name, extended, implemented, constructors } = this.syntaxNode;

    this.ownTypeDefinition = this.findTypeDefinitionByName(name) as ObjectType.Definition;

    if (extended.length !== 0) {
      this.validateSuperclass(extended[0]);
    }

    if (implemented.length > 0) {
      this.validateImplementations(implemented);
    }

    objectVisitor.visitObject(this.ownTypeDefinition);

    constructors.forEach(constructor => {
      this.validateNodeWith(JavaObjectMethodValidator, constructor);
    });

    this.validateNodeWith(JavaObjectValidator, this.syntaxNode);

    objectVisitor.leaveObject();
  }

  private isAbstractClass (): boolean {
    return this.ownTypeDefinition.requiresImplementation;
  }

  private validateImplementations (implementations: JavaSyntax.IJavaType[]): void {
    for (const implementation of implementations) {
      this.focusToken(implementation.token);

      const interfaceTypeDefinition = this.findTypeDefinition(implementation.namespaceChain) as ObjectType.Definition;
      const interfaceName = implementation.namespaceChain.join('.');

      if (ValidatorUtils.isInterfaceType(interfaceTypeDefinition)) {
        interfaceTypeDefinition.forEachMember(interfaceMember => {
          this.check(
            this.ownTypeDefinition.hasEquivalentMember(interfaceMember),
            `Class '${this.syntaxNode.name}' does not correctly implement '${interfaceName}.${interfaceMember.name}'`
          );
        });
      } else {
        this.report(`Class '${this.syntaxNode.name}' cannot implement non-interface '${interfaceName}'`);
      }
    }
  }

  private validateSuperclass (superclassType: JavaSyntax.IJavaType): void {
    this.focusToken(superclassType.token);

    const superTypeDefinition = this.findTypeDefinition(superclassType.namespaceChain);
    const supertypeName = superclassType.namespaceChain.join('.');
    const supertypeIsClass = ValidatorUtils.isClassType(superTypeDefinition);

    this.check(
      this.ownTypeDefinition !== superTypeDefinition,
      `Class '${this.syntaxNode.name}' cannot extend itself`
    );

    this.check(
      ValidatorUtils.isSimpleTypeOf(Dynamic, superTypeDefinition) || supertypeIsClass,
      `Class '${this.syntaxNode.name}' cannot extend non-class '${supertypeName}'`
    );

    this.check(
      supertypeIsClass
        ? (superTypeDefinition as ObjectType.Definition).isExtensible
        : true,
      `Class '${supertypeName}' is not extensible`
    );

    if (supertypeIsClass) {
      (superTypeDefinition as ObjectType.Definition).forEachMember((superObjectMember, memberName) => {
        if (superObjectMember.requiresImplementation && !this.isAbstractClass()) {
          this.check(
            this.ownTypeDefinition.hasOwnObjectMember(memberName),
            `Class '${this.syntaxNode.name}' must implement abstract member '${supertypeName}.${memberName}'`
          );
        }

        if (superObjectMember.isConstant) {
          this.check(
            !this.ownTypeDefinition.hasOwnObjectMember(memberName),
            `Class '${this.syntaxNode.name}' cannot override final member '${supertypeName}.${memberName}'`
          );
        }
      });
    }
  }
}
