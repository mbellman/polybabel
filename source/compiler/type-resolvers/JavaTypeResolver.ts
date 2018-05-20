import AbstractTypeResolver from '../common/AbstractTypeResolver';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../parser/java/java-syntax';
import { TypeResolution } from '../common/compiler-types';

export default class JavaTypeResolver extends AbstractTypeResolver {
  @Implements public resolve (javaSyntaxTree: JavaSyntax.IJavaSyntaxTree): TypeResolution.ResolvedType[] {
    const resolvedTypes: TypeResolution.ResolvedType[] = [];
    const { nodes: syntaxNodes } = javaSyntaxTree;

    syntaxNodes.forEach(syntaxNode => {
      switch (syntaxNode.node) {
        case JavaSyntax.JavaSyntaxNode.CLASS:
          const classType = this.resolveClassType(syntaxNode as JavaSyntax.IJavaClass);

          resolvedTypes.push(classType);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          const interfaceType = this.resolveInterfaceType(syntaxNode as JavaSyntax.IJavaInterface);

          resolvedTypes.push(interfaceType);
          break;
      }
    });

    return resolvedTypes;
  }

  private getVisibilityByAccess (access: JavaSyntax.JavaAccessModifier): TypeResolution.ObjectMemberVisibility {
    const { ALL, SUPERS, SELF } = TypeResolution.ObjectMemberVisibility;

    return (
      access === JavaSyntax.JavaAccessModifier.PUBLIC ? ALL :
      access === JavaSyntax.JavaAccessModifier.PROTECTED ? SUPERS :
      access === JavaSyntax.JavaAccessModifier.PRIVATE ? SELF :
      null
    );
  }

  private resolveClassType (classNode: JavaSyntax.IJavaClass): TypeResolution.IObjectType {
    const { name, members, access, isFinal, isAbstract, constructors } = classNode;

    return {
      category: TypeResolution.TypeCategory.OBJECT,
      name,
      staticMemberMap: {},
      instanceMemberMap: {},
      isExtensible: !isFinal,
      isConstructable: !isAbstract,
      constructors: []
    };
  }

  private resolveInterfaceType ({ name }: JavaSyntax.IJavaInterface): TypeResolution.IObjectType {
    return {
      category: TypeResolution.TypeCategory.OBJECT,
      name,
      staticMemberMap: {},
      instanceMemberMap: {},
      isExtensible: true,
      // Interfaces are technically constructable in the case of
      // anonymous object instantiation, so Java validation will have
      // to account for this contingency. Otherwise, other languages
      // should not be able to instantiate Java interfaces.
      isConstructable: false,
      constructors: []
    };
  }
}
