import AbstractSymbolResolver from './common/AbstractSymbolResolver';
import { FunctionType } from './common/function-type';
import { Implements } from 'trampoline-framework';
import { IObjectMember, ISymbol, ObjectCategory, ObjectMemberVisibility, TypeDefinition, ITypeConstraint } from './common/types';
import { JavaSyntax } from '../../parser/java/java-syntax';
import { ObjectType } from './common/object-type';
import { TypeUtils } from './common/type-utils';

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
          const classSymbol = this.resolveClassSymbol(syntaxNode as JavaSyntax.IJavaClass);

          this.symbolDictionary.addSymbol(classSymbol);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
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
      ALL
    );
  }

  /**
   * @todo @description
   */
  private javaTypeToConstraint (type: JavaSyntax.IJavaType): ITypeConstraint {
    const { namespaceChain, arrayDimensions } = type;
    const typeName = namespaceChain.join('.');
    const nativeTypeConstraint = this.nativeTypeConstraintMap[typeName];

    const typeDefinition = !!nativeTypeConstraint
      ? nativeTypeConstraint.typeDefinition
      : this.getPossibleSymbolIdentifiers(typeName);

    const typeConstraint: ITypeConstraint = {
      typeDefinition
    };

    return arrayDimensions > 0
      ? TypeUtils.createArrayTypeConstraint(this.symbolDictionary, typeConstraint, arrayDimensions)
      : typeConstraint;
  }

  private resolveAndAddObjectMembers (members: JavaSyntax.JavaObjectMember[], objectDefiner: ObjectType.Definer): void {
    members.forEach(member => {
      switch (member.node) {
        case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD: {
          const { name, access, type: fieldType, isStatic, isFinal, isAbstract } = member as JavaSyntax.IJavaObjectField;

          objectDefiner.addMember({
            name,
            visibility: this.getObjectMemberVisibility(access),
            isConstant: !!isFinal,
            isStatic: !!isStatic,
            requiresImplementation: !!isAbstract,
            constraint: this.javaTypeToConstraint(fieldType)
          });

          break;
        }
        case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD: {
          const { name, access, isFinal, isStatic, isAbstract, genericTypes, type: returnType, parameters } = member as JavaSyntax.IJavaObjectMethod;
          const functionTypeDefiner = this.createTypeDefiner(FunctionType.Definer);
          const returnTypeConstraint = this.javaTypeToConstraint(returnType);

          parameters.forEach(({ type }) => {
            const parameterTypeConstraint = this.javaTypeToConstraint(type);

            functionTypeDefiner.addParameterTypeConstraint(parameterTypeConstraint);
          });

          // TODO: Add generic parameters
          functionTypeDefiner.defineReturnTypeConstraint(returnTypeConstraint);

          const methodMember: IObjectMember = {
            name,
            visibility: this.getObjectMemberVisibility(access),
            isConstant: !!isFinal,
            isStatic: !!isStatic,
            requiresImplementation: !!isAbstract,
            constraint: {
              typeDefinition: functionTypeDefiner
            }
          };

          if (objectDefiner.hasOwnObjectMember(name)) {
            objectDefiner.addMethodOverload(methodMember as IObjectMember<FunctionType.Constraint>);
          } else {
            objectDefiner.addMember(methodMember);
          }

          break;
        }
        case JavaSyntax.JavaSyntaxNode.CLASS:
        case JavaSyntax.JavaSyntaxNode.INTERFACE: {
          const { name, node, access, isFinal, isStatic } = member;
          const isClass = node === JavaSyntax.JavaSyntaxNode.CLASS;

          const nestedObjectSymbol = isClass
            ? this.resolveClassSymbol(member as JavaSyntax.IJavaClass)
            : this.resolveInterfaceSymbol(member as JavaSyntax.IJavaInterface);

          objectDefiner.addMember({
            name,
            visibility: this.getObjectMemberVisibility(access),
            isConstant: !!isFinal,
            isStatic: !!isStatic,
            constraint: nestedObjectSymbol.constraint
          });

          this.symbolDictionary.addSymbol(nestedObjectSymbol);

          break;
        }
      }
    });
  }

  private resolveClassSymbol (classNode: JavaSyntax.IJavaClass): ISymbol {
    const { name, extended, implemented, members, access, isFinal, isAbstract, constructors } = classNode;
    const identifier = this.createSymbolIdentifier(name);
    const classTypeDefiner = this.createTypeDefiner(ObjectType.Definer);

    const classTypeConstraint: ITypeConstraint = {
      typeDefinition: classTypeDefiner,
      isOriginal: true
    };

    // TODO: Add generic parameters
    classTypeDefiner.name = name;
    classTypeDefiner.category = ObjectCategory.CLASS;
    classTypeDefiner.isConstructable = !isAbstract;
    classTypeDefiner.isExtensible = !isFinal;
    classTypeDefiner.requiresImplementation = isAbstract;
    classTypeDefiner.isConstructable = !isAbstract;

    if (extended.length === 1) {
      classTypeDefiner.addSuper(this.javaTypeToConstraint(extended[0]));
    }

    if (implemented.length > 0) {
      for (const implementation of implemented) {
        classTypeDefiner.addSuper(this.javaTypeToConstraint(implementation));
      }
    }

    constructors.forEach(({ parameters, access: constructorAccess }) => {
      const constructorFunctionDefiner = this.createTypeDefiner(FunctionType.Definer);

      constructorFunctionDefiner.defineReturnTypeConstraint(classTypeConstraint);

      parameters.forEach(parameter => {
        constructorFunctionDefiner.addParameterTypeConstraint(this.javaTypeToConstraint(parameter.type));
      });

      classTypeDefiner.addConstructor({
        name,
        constraint: {
          typeDefinition: constructorFunctionDefiner
        },
        visibility: this.getObjectMemberVisibility(constructorAccess)
      });
    });

    this.enterNamespace(name);
    this.resolveAndAddObjectMembers(members, classTypeDefiner);
    this.exitNamespace();

    return {
      identifier,
      name,
      constraint: classTypeConstraint
    };
  }

  private resolveInterfaceSymbol (interfaceNode: JavaSyntax.IJavaInterface): ISymbol {
    const { name, members, extended } = interfaceNode;
    const identifier = this.createSymbolIdentifier(name);
    const interfaceTypeDefiner = this.createTypeDefiner(ObjectType.Definer);

    // TODO: Add generic parameters
    interfaceTypeDefiner.name = name;
    interfaceTypeDefiner.category = ObjectCategory.INTERFACE;
    interfaceTypeDefiner.isExtensible = true;
    interfaceTypeDefiner.isConstructable = false;

    if (extended.length > 0) {
      extended.forEach(superType => {
        interfaceTypeDefiner.addSuper(this.javaTypeToConstraint(superType));
      });
    }

    this.enterNamespace(name);
    this.resolveAndAddObjectMembers(members, interfaceTypeDefiner);
    this.exitNamespace();

    return {
      identifier,
      name,
      constraint: {
        typeDefinition: interfaceTypeDefiner,
        isOriginal: true
      }
    };
  }
}
