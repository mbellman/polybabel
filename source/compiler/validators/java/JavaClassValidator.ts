import AbstractValidator from '../common/AbstractValidator';
import JavaObjectMethodValidator from './JavaObjectMethodValidator';
import JavaObjectValidator from './JavaObjectValidator';
import { Dynamic } from '../../symbol-resolvers/common/types';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { ValidatorUtils } from '../common/validator-utils';
import { FunctionType } from '../../symbol-resolvers/common/function-type';

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
        interfaceTypeDefinition.forEachMemberWhere(
          ({ type }) => type instanceof FunctionType.Definition,
          interfaceMethodMember => {
            this.check(
              this.ownTypeDefinition.hasEquivalentMember(interfaceMethodMember),
              `Class '${this.syntaxNode.name}' does not correctly implement '${interfaceName}.${interfaceMethodMember.name}'`
            );
          });
      } else {
        this.report(`Class '${this.syntaxNode.name}' cannot implement non-interface '${interfaceName}'`);
      }
    }
  }

  private validateSuperclass (superclassType: JavaSyntax.IJavaType): void {
    this.focusToken(superclassType.token);

    const supertypeDefinition = this.findTypeDefinition(superclassType.namespaceChain) as ObjectType.Definition;
    const supertypeName = superclassType.namespaceChain.join('.');
    const supertypeIsClass = ValidatorUtils.isClassType(supertypeDefinition);

    if (supertypeDefinition === this.ownTypeDefinition) {
      this.report(`Class '${this.syntaxNode.name}' cannot extend itself`);

      return;
    }

    this.check(
      ValidatorUtils.isSimpleTypeOf(Dynamic, supertypeDefinition) || supertypeIsClass,
      `Class '${this.syntaxNode.name}' cannot extend non-class '${supertypeName}'`
    );

    if (supertypeIsClass) {
      this.check(
        supertypeDefinition.isExtensible,
        `Class '${supertypeName}' cannot be extended`
      );

      supertypeDefinition.forEachMember((superObjectMember) => {
        const { name: memberName } = superObjectMember;

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
