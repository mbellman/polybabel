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

    this.ownTypeDefinition = this.getTypeDefinitionInCurrentNamespace(name) as ObjectType.Definition;

    this.scopeManager.addToScope(name);

    if (extended.length !== 0) {
      this.validateSupertypeExtension(extended[0]);
    }

    if (implemented.length > 0) {
      this.validateImplementations(implemented);
    }

    this.validateNodeWith(JavaObjectBodyValidator, this.syntaxNode);
  }

  private getOwnName (): string {
    return this.syntaxNode.name;
  }

  private isAbstractClass (): boolean {
    return this.ownTypeDefinition.requiresImplementation;
  }

  private validateImplementations (implementations: JavaSyntax.IJavaType[]): void {
    const validateImplementation = (typeDefinition: TypeDefinition, interfaceName: string) => {
      this.assertAndContinue(
        ValidationUtils.isDynamicType(typeDefinition) ||
        ValidationUtils.isInterfaceType(typeDefinition),
        `Class '${this.syntaxNode.name}' cannot implement non-interface '${interfaceName}'`
      );
    };

    for (const implementation of implementations) {
      this.validateType(implementation.namespaceChain, validateImplementation);
    }
  }

  private validateSupertypeExtension (supertype: JavaSyntax.IJavaType): void {
    this.validateType(supertype.namespaceChain, (supertypeDefinition, superclassName) => {
      const supertypeIsClass = ValidationUtils.isClassType(supertypeDefinition);

      this.assertAndContinue(
        ValidationUtils.isDynamicType(supertypeDefinition) || supertypeIsClass,
        `Class '${this.getOwnName()}' cannot extend non-class '${superclassName}'`
      );

      this.assertAndContinue(
        supertypeIsClass
          ? (supertypeDefinition as ObjectType.Definition).isExtensible
          : true,
        `Class '${superclassName}' is not extensible`
      );

      if (supertypeIsClass) {
        (supertypeDefinition as ObjectType.Definition).forEachMember((memberName, objectMember) => {
          if (objectMember.requiresImplementation && !this.isAbstractClass()) {
            this.assertAndContinue(
              this.ownTypeDefinition.hasOwnObjectMember(memberName),
              `Class '${this.getOwnName()}' must implement abstract member '${superclassName}.${memberName}'`
            );
          }

          if (objectMember.isConstant) {
            this.assertAndContinue(
              !this.ownTypeDefinition.hasOwnObjectMember(memberName),
              `Class '${this.getOwnName()}' cannot override final member '${superclassName}.${memberName}'`
            );
          }
        });
      }
    });
  }
}
