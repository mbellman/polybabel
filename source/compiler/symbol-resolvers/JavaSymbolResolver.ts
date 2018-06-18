import AbstractSymbolResolver from './common/AbstractSymbolResolver';
import { ArrayType } from './common/array-type';
import { FunctionType } from './common/function-type';
import { Implements } from 'trampoline-framework';
import { IObjectMember, ISymbol, ObjectCategory, ObjectMemberVisibility, TypeDefinition } from './common/types';
import { JavaSyntax } from '../../parser/java/java-syntax';
import { ObjectType } from './common/object-type';

export default class JavaSymbolResolver extends AbstractSymbolResolver {
  @Implements public resolve (javaSyntaxTree: JavaSyntax.IJavaSyntaxTree): void {
    const { nodes: syntaxNodes } = javaSyntaxTree;

    syntaxNodes.forEach(syntaxNode => {
      switch (syntaxNode.node) {
        case JavaSyntax.JavaSyntaxNode.IMPORT:
          const { paths, defaultImport, nonDefaultImports } = syntaxNode as JavaSyntax.IJavaImport;
          const sourceFile = paths.join('/');

          if (defaultImport) {
            this.mapImportToSourceFile(defaultImport, sourceFile);
          }

          nonDefaultImports.forEach(nonDefaultImport => {
            this.mapImportToSourceFile(nonDefaultImport, sourceFile);
          });
          break;
        case JavaSyntax.JavaSyntaxNode.CLASS:
          const classNode = syntaxNode as JavaSyntax.IJavaClass;
          const classSymbol = this.resolveClassSymbol(classNode);

          this.symbolDictionary.addSymbol(classSymbol);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          const interfaceNode = syntaxNode as JavaSyntax.IJavaInterface;
          const interfaceSymbol = this.resolveInterfaceSymbol(syntaxNode as JavaSyntax.IJavaInterface);

          this.symbolDictionary.addSymbol(interfaceSymbol);
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
      return this.javaTypeToTypeDefinition(type);
    }
  }

  /**
   * @todo @description
   */
  private javaTypeToTypeDefinition (type: JavaSyntax.IJavaType): TypeDefinition {
    const { namespaceChain, arrayDimensions } = type;
    const typeName = namespaceChain.join('.');

    if (arrayDimensions > 0) {
      return this.createArrayTypeDefinition(type);
    }

    return (
      this.nativeTypeMap[typeName] ||
      this.getPossibleSymbolIdentifiers(typeName)
    );
  }

  private resolveAndAddObjectMembers (members: JavaSyntax.JavaObjectMember[], definer: ObjectType.Definer): void {
    members.forEach(member => {
      const resolvedObjectMember: Partial<IObjectMember> = {};

      switch (member.node) {
        case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD: {
          const { name, access, type: fieldType, isStatic, isFinal, isAbstract } = member as JavaSyntax.IJavaObjectField;

          resolvedObjectMember.name = name;
          resolvedObjectMember.visibility = this.getObjectMemberVisibility(access);
          resolvedObjectMember.isStatic = !!isStatic;
          resolvedObjectMember.isConstant = !!isFinal;
          resolvedObjectMember.requiresImplementation = !!isAbstract;
          resolvedObjectMember.type = this.javaTypeToTypeDefinition(fieldType);

          break;
        }
        case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD: {
          const { name, access, isFinal, isStatic, isAbstract, genericTypes, type: returnType, parameters } = member as JavaSyntax.IJavaObjectMethod;
          const functionTypeDefiner = this.createTypeDefiner(FunctionType.Definer);
          const returnTypeDefinition = this.javaTypeToTypeDefinition(returnType);

          parameters.forEach(({ type }) => {
            const parameterTypeDefinition = this.javaTypeToTypeDefinition(type);

            functionTypeDefiner.addParameterType(parameterTypeDefinition);
          });

          // TODO: Add generic parameters
          functionTypeDefiner.defineReturnType(returnTypeDefinition);

          resolvedObjectMember.name = name;
          resolvedObjectMember.visibility = this.getObjectMemberVisibility(access);
          resolvedObjectMember.isConstant = !!isFinal;
          resolvedObjectMember.isStatic = !!isStatic;
          resolvedObjectMember.requiresImplementation = !!isAbstract;
          resolvedObjectMember.type = functionTypeDefiner;

          break;
        }
        case JavaSyntax.JavaSyntaxNode.CLASS:
        case JavaSyntax.JavaSyntaxNode.INTERFACE: {
          const { name, node, access, isFinal, isStatic } = member;
          const isClass = node === JavaSyntax.JavaSyntaxNode.CLASS;

          const nestedObjectSymbol = isClass
              ? this.resolveClassSymbol(member as JavaSyntax.IJavaClass)
              : this.resolveInterfaceSymbol(member as JavaSyntax.IJavaInterface);

          resolvedObjectMember.name = name;
          resolvedObjectMember.visibility = this.getObjectMemberVisibility(access);
          resolvedObjectMember.isStatic = isStatic;
          resolvedObjectMember.isConstant = isFinal;
          resolvedObjectMember.type = nestedObjectSymbol.type;

          this.symbolDictionary.addSymbol(nestedObjectSymbol);

          break;
        }
      }

      // TODO: Differentiate method overloads
      definer.addMember(member.name, resolvedObjectMember as IObjectMember);
    });
  }

  private resolveClassSymbol (classNode: JavaSyntax.IJavaClass): ISymbol {
    const { name, extended, implemented, members, access, isFinal, isAbstract, constructors } = classNode;
    const identifier = this.createSymbolIdentifier(name);
    const classType = this.createTypeDefiner(ObjectType.Definer);

    // TODO: Add generic parameters
    classType.name = name;
    classType.category = ObjectCategory.CLASS;
    classType.isConstructable = !isAbstract;
    classType.isExtensible = !isFinal;
    classType.requiresImplementation = isAbstract;

    classType.isConstructable = (
      access === JavaSyntax.JavaAccessModifier.PUBLIC ||
      !isAbstract
    );

    if (extended.length === 1) {
      const superclassName = extended[0].namespaceChain.join('.');
      const possibleSuperclassSymbolIdentifiers = this.getPossibleSymbolIdentifiers(superclassName);

      classType.addSupertype(possibleSuperclassSymbolIdentifiers);
    }

    if (implemented.length > 0) {
      for (const implementation of implemented) {
        const interfaceName = implementation.namespaceChain.join('.');
        const possibleInterfaceSymbolIdentifiers = this.getPossibleSymbolIdentifiers(interfaceName);

        classType.addSupertype(possibleInterfaceSymbolIdentifiers);
      }
    }

    constructors.forEach(({ parameters, access: constructorAccess }) => {
      const constructorType = this.createTypeDefiner(FunctionType.Definer);

      constructorType.defineReturnType(classType);

      parameters.forEach(parameter => {
        constructorType.addParameterType(this.javaTypeToTypeDefinition(parameter.type));
      });

      classType.addConstructor({
        name,
        type: constructorType,
        visibility: this.getObjectMemberVisibility(constructorAccess)
      });
    });

    this.enterNamespace(name);
    this.resolveAndAddObjectMembers(members, classType);
    this.exitNamespace();

    return {
      identifier,
      name,
      type: classType
    };
  }

  private resolveInterfaceSymbol (interfaceNode: JavaSyntax.IJavaInterface): ISymbol {
    const { name, members } = interfaceNode;
    const identifier = this.createSymbolIdentifier(name);
    const objectTypeDefiner = this.createTypeDefiner(ObjectType.Definer);

    // TODO: Add generic parameters
    objectTypeDefiner.name = name;
    objectTypeDefiner.category = ObjectCategory.INTERFACE;
    objectTypeDefiner.isExtensible = true;
    objectTypeDefiner.isConstructable = false;

    this.enterNamespace(name);
    this.resolveAndAddObjectMembers(members, objectTypeDefiner);
    this.exitNamespace();

    return {
      identifier,
      name,
      type: objectTypeDefiner
    };
  }
}
