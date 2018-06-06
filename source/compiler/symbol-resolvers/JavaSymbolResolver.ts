import AbstractSymbolResolver from './common/AbstractSymbolResolver';
import { ArrayType } from './common/array-type';
import { FunctionType } from './common/function-type';
import { Implements } from 'trampoline-framework';
import { IObjectMember, ISymbol, ObjectCategory, ObjectMemberVisibility, Primitive, TypeDefinition, Void } from './common/types';
import { JavaConstants } from '../../parser/java/java-constants';
import { JavaSyntax } from '../../parser/java/java-syntax';
import { ObjectType } from './common/object-type';

export default class JavaSymbolResolver extends AbstractSymbolResolver {
  @Implements public resolve (javaSyntaxTree: JavaSyntax.IJavaSyntaxTree): void {
    const { nodes: syntaxNodes } = javaSyntaxTree;

    syntaxNodes.forEach(syntaxNode => {
      switch (syntaxNode.node) {
        case JavaSyntax.JavaSyntaxNode.CLASS:
          const classNode = syntaxNode as JavaSyntax.IJavaClass;
          const classSymbol = this.resolveClassSymbol(classNode);

          this.defineSymbol(classSymbol);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          const interfaceNode = syntaxNode as JavaSyntax.IJavaInterface;
          const interfaceSymbol = this.resolveInterfaceSymbol(syntaxNode as JavaSyntax.IJavaInterface);

          this.defineSymbol(interfaceSymbol);
          break;
      }
    });
  }

  private getObjectMemberVisibility (access: JavaSyntax.JavaAccessModifier): ObjectMemberVisibility {
    const { ALL, DERIVED, SELF } = ObjectMemberVisibility;

    return (
      access === JavaSyntax.JavaAccessModifier.PUBLIC
        ? ALL :
      access === JavaSyntax.JavaAccessModifier.PROTECTED
        ? DERIVED :
      access === JavaSyntax.JavaAccessModifier.PRIVATE
        ? SELF :
      null
    );
  }

  /**
   * Creates and returns an array type definition, using recursion
   * to define the element type of the array as the original type
   * with one less array dimension on each cycle until the array
   * dimensions reach 0.
   */
  private createArrayTypeDefinition (type: JavaSyntax.IJavaType): TypeDefinition {
    const { arrayDimensions } = type;

    if (arrayDimensions > 0) {
      const arrayTypeDefiner = this.createTypeDefiner(ArrayType.Definer);

      const elementTypeDefinition = this.createArrayTypeDefinition({
        ...type,
        arrayDimensions: arrayDimensions - 1
      });

      arrayTypeDefiner.defineElementType(elementTypeDefinition);

      return arrayTypeDefiner;
    } else {
      return this.createTypeDefinition(type);
    }
  }

  private createTypeDefinition (type: JavaSyntax.IJavaType): TypeDefinition {
    const { namespaceChain, arrayDimensions } = type;
    const typeName = namespaceChain.join('.');

    if (arrayDimensions > 0) {
      return this.createArrayTypeDefinition(type);
    }

    switch (typeName) {
      case JavaConstants.Type.STRING:
      case JavaConstants.Type.CHAR:
        return {
          type: Primitive.STRING
        };
      case JavaConstants.Type.INTEGER:
      case JavaConstants.Type.NUMBER:
      case JavaConstants.Type.INT:
      case JavaConstants.Type.FLOAT:
      case JavaConstants.Type.DOUBLE:
      case JavaConstants.Type.LONG:
      case JavaConstants.Type.SHORT:
        return {
          type: Primitive.NUMBER
        };
      case JavaConstants.Type.VOID:
        return {
          type: Void
        };
      case JavaConstants.Type.BOOLEAN_UC:
      case JavaConstants.Type.BOOLEAN_LC:
        return {
          type: Primitive.BOOLEAN
        };
      case JavaConstants.Type.OBJECT:
        return {
          type: Primitive.OBJECT
        };
      default:
        // Where types are not native Java types, we return the name
        // as a symbol identifier so it can be looked up in the symbol
        // dictionary at validation time
        return typeName;
    }
  }

  private resolveAndAddObjectMembers (members: JavaSyntax.JavaObjectMember[], definer: ObjectType.Definer): void {
    members.forEach(member => {
      const resolvedObjectMember: Partial<IObjectMember> = {};

      switch (member.node) {
        case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD: {
          const { access, type, isStatic, isFinal, isAbstract } = member as JavaSyntax.IJavaObjectField;

          resolvedObjectMember.visibility = this.getObjectMemberVisibility(access);
          resolvedObjectMember.isStatic = !!isStatic;
          resolvedObjectMember.isConstant = !!isFinal;
          resolvedObjectMember.requiresImplementation = !!isAbstract;
          resolvedObjectMember.type = this.createTypeDefinition(type);

          break;
        }
        case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD: {
          const { access, isFinal, isStatic, isAbstract, genericTypes, type: returnType, parameters } = member as JavaSyntax.IJavaObjectMethod;
          const functionTypeDefiner = this.createTypeDefiner(FunctionType.Definer);
          const parameterTypeSymbolIdentifiers = parameters.map(({ type }) => this.createTypeDefinition(type));
          const returnTypeSymbolIdentifier = this.createTypeDefinition(returnType);

          functionTypeDefiner.defineReturnType(returnTypeSymbolIdentifier);

          resolvedObjectMember.visibility = this.getObjectMemberVisibility(access);
          resolvedObjectMember.isConstant = !!isFinal;
          resolvedObjectMember.isStatic = !!isStatic;
          resolvedObjectMember.requiresImplementation = !!isAbstract;
          resolvedObjectMember.type = functionTypeDefiner;

          break;
        }
        case JavaSyntax.JavaSyntaxNode.CLASS:
        case JavaSyntax.JavaSyntaxNode.INTERFACE: {
          const { node, access, isFinal, isStatic } = member;
          const isClass = node === JavaSyntax.JavaSyntaxNode.CLASS;

          const { type } = isClass
              ? this.resolveClassSymbol(member as JavaSyntax.IJavaClass)
              : this.resolveInterfaceSymbol(member as JavaSyntax.IJavaInterface);

          resolvedObjectMember.visibility = this.getObjectMemberVisibility(access);
          resolvedObjectMember.isStatic = isStatic;
          resolvedObjectMember.isConstant = isFinal;
          resolvedObjectMember.type = type;

          break;
        }
      }

      definer.addMember(member.name, resolvedObjectMember as IObjectMember);
    });
  }

  private resolveClassSymbol (classNode: JavaSyntax.IJavaClass): ISymbol {
    const { name, extended, implemented, members, access, isFinal, isAbstract, constructors } = classNode;
    const identifier = this.createSymbolIdentifier(name);
    const objectTypeDefiner = this.createTypeDefiner(ObjectType.Definer);

    objectTypeDefiner.category = ObjectCategory.CLASS;
    objectTypeDefiner.isExtensible = !isFinal;
    objectTypeDefiner.requiresImplementation = isAbstract;

    objectTypeDefiner.isConstructable = (
      access === JavaSyntax.JavaAccessModifier.PUBLIC ||
      !isAbstract
    );

    this.enterNamespace(name);

    constructors.forEach(constructor => {
      // @todo
    });

    if (extended.length === 1) {
      objectTypeDefiner.addSupertype(extended[0].namespaceChain.join('.'));
    }

    if (implemented.length > 0) {
      for (const implementation of implemented) {
        objectTypeDefiner.addSupertype(implementation.namespaceChain.join('.'));
      }
    }

    this.resolveAndAddObjectMembers(members, objectTypeDefiner);
    this.exitNamespace();

    return {
      identifier,
      type: objectTypeDefiner
    };
  }

  private resolveInterfaceSymbol (interfaceNode: JavaSyntax.IJavaInterface): ISymbol {
    const { name, members } = interfaceNode;
    const identifier = this.createSymbolIdentifier(name);
    const objectTypeDefiner = this.createTypeDefiner(ObjectType.Definer);

    objectTypeDefiner.category = ObjectCategory.INTERFACE;
    objectTypeDefiner.isExtensible = true;
    // Interfaces are only constructable in the case of anonymous
    // object instantiation, which can only happen in Java code;
    // they are not constructable anywhere else
    objectTypeDefiner.isConstructable = false;

    this.enterNamespace(name);
    this.resolveAndAddObjectMembers(members, objectTypeDefiner);
    this.exitNamespace();

    return {
      identifier,
      type: objectTypeDefiner
    };
  }
}
