import AbstractValidator from '../common/AbstractValidator';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { Implements } from 'trampoline-framework';
import { ISimpleType, Primitive, TypeDefinition, Dynamic, IObjectMember } from '../../symbol-resolvers/common/types';
import { JavaCompilerUtils } from '../../utils/java-compiler-utils';
import { JavaConstants } from 'parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { ValidatorUtils } from '../common/validator-utils';
import { FunctionType } from '../../symbol-resolvers/common/function-type';

export default class JavaStatementValidator extends AbstractValidator<JavaSyntax.IJavaStatement> {
  @Implements public validate (): void {
    const type = this.getStatementType(this.syntaxNode);

    this.checkIfTypeMatchesExpected(type);
  }

  private getPropertyChainType (propertyChain: JavaSyntax.IJavaPropertyChain): TypeDefinition {
    const { token, properties } = propertyChain;

    this.focusToken(token);

    const firstProperty = properties[0];
    let currentPropertyLookupType: TypeDefinition;
    let propertyIndex = 0;

    if (typeof firstProperty === 'string') {
      currentPropertyLookupType = this.findTypeDefinitionByName(firstProperty);
    } else {
      currentPropertyLookupType = this.getSyntaxNodeType(firstProperty);
    }

    if (!currentPropertyLookupType) {
      // If there was any problem getting the initial lookup type, it will
      // have been reported within one of the previous calls calls. Since
      // the type itself is unknown, we use a dynamic type fallback.
      return TypeUtils.createSimpleType(Dynamic);
    }

    let incomingProperty = properties[++propertyIndex];
    let currentMember: IObjectMember;

    while (incomingProperty) {
      if (!(currentPropertyLookupType instanceof ObjectType.Definition)) {
        // If the current lookup type isn't an object, we have to report
        // the invalid property chain usage, and return a dynamic type as
        // a fallback
        this.report(`'${ValidatorUtils.getTypeDescription(currentPropertyLookupType)}' is not an object`);

        return TypeUtils.createSimpleType(Dynamic);
      }

      if (typeof incomingProperty === 'string') {
        // The next lookup type of a string property is the type
        // of the member it accesses
        currentMember = currentPropertyLookupType.getObjectMember(incomingProperty);

        if (!currentMember) {
          this.reportUnknownMember(currentPropertyLookupType.name, incomingProperty);

          return TypeUtils.createSimpleType(Dynamic);
        }

        currentPropertyLookupType = currentMember.type;
      } else {
        switch (incomingProperty.node) {
          case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
            // The next lookup type of a function call
            // property is its return type
            const { name: functionName } = incomingProperty;

            currentMember = currentPropertyLookupType.getObjectMember(functionName);

            if (!currentMember) {
              this.reportUnknownMember(currentPropertyLookupType.name, functionName);

              return TypeUtils.createSimpleType(Dynamic);
            }

            if (!(currentMember.type instanceof FunctionType.Definition)) {
              this.report(`'${currentPropertyLookupType.name}.${functionName}' is not a function type`);

              return TypeUtils.createSimpleType(Dynamic);
            }

            currentPropertyLookupType = currentMember.type.getReturnType();
            break;
          case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
            // The next lookup type of an instantiation
            // property is its constructor type
            const { constructor } = incomingProperty;
            const constructorName = constructor.namespaceChain.join('.');

            currentMember = currentPropertyLookupType.getObjectMember(constructorName);

            if (!currentMember) {
              this.reportUnknownMember(currentPropertyLookupType.name, constructorName);

              return TypeUtils.createSimpleType(Dynamic);
            }

            currentPropertyLookupType = currentMember.type;
            break;
          case JavaSyntax.JavaSyntaxNode.STATEMENT:
            // We can't know what the computed property name will be,
            // and since Java doesn't have index types, we just return
            // a dynamic type as a fallback
            return TypeUtils.createSimpleType(Dynamic);
        }
      }

      // TODO: Member visibility checks

      incomingProperty = properties[++propertyIndex];
    }

    return currentMember.type;
  }

  private getSimpleLiteralType (literal: JavaSyntax.IJavaLiteral): ISimpleType {
    switch (literal.type) {
      case JavaSyntax.JavaLiteralType.NUMBER:
        return TypeUtils.createSimpleType(Primitive.NUMBER);
      case JavaSyntax.JavaLiteralType.STRING:
        return TypeUtils.createSimpleType(Primitive.STRING);
      case JavaSyntax.JavaLiteralType.KEYWORD:
        const isBooleanKeyword = (
          literal.value === JavaConstants.Keyword.TRUE ||
          literal.value === JavaConstants.Keyword.FALSE
        );

        // The only valid keyword literals are 'true', 'false', and 'null'
        return isBooleanKeyword
          ? TypeUtils.createSimpleType(Primitive.BOOLEAN)
          : TypeUtils.createSimpleType(Primitive.NULL);
    }
  }

  private getStatementType (statement: JavaSyntax.IJavaStatement): TypeDefinition {
    const { isParenthetical, leftSide, operator, rightSide } = statement;

    if (isParenthetical) {
      return this.getStatementType(leftSide as JavaSyntax.IJavaStatement);
    } else if (!leftSide && operator) {
      return this.inferTypeFromLeftOperation(operator.operation);
    }

    if (!!leftSide) {
      return this.getSyntaxNodeType(leftSide);
    } else {
      return this.inferTypeFromLeftOperation(operator.operation);
    }
  }

  private getSyntaxNodeType (javaSyntaxNode: JavaSyntax.IJavaSyntaxNode): TypeDefinition {
    switch (javaSyntaxNode.node) {
      case JavaSyntax.JavaSyntaxNode.STATEMENT:
        return this.getStatementType(javaSyntaxNode as JavaSyntax.IJavaStatement);
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        const literal = javaSyntaxNode as JavaSyntax.IJavaLiteral;

        if (literal.type === JavaSyntax.JavaLiteralType.ARRAY) {
          const arrayTypeDefiner = new ArrayType.Definer(this.context.symbolDictionary);
          const firstElementType = this.getStatementType(literal.value[0] as JavaSyntax.IJavaStatement);

          arrayTypeDefiner.defineElementType(firstElementType);

          return arrayTypeDefiner;
        } else {
          return this.getSimpleLiteralType(literal);
        }
      case JavaSyntax.JavaSyntaxNode.REFERENCE:
        const reference = javaSyntaxNode as JavaSyntax.IJavaReference;
        const { value } = reference;

        return this.findTypeDefinitionByName(value);
      case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
        const { name } = javaSyntaxNode as JavaSyntax.IJavaFunctionCall;
        const functionType = this.findTypeDefinitionByName(name) as FunctionType.Definition;

        return functionType.getReturnType();
      case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
        const instantiation = javaSyntaxNode as JavaSyntax.IJavaInstantiation;
        const { constructor } = instantiation;
        const isArrayInstantiation = !!instantiation.arrayAllocationSize || !!instantiation.arrayLiteral;

        const constructorType = (
          JavaCompilerUtils.getNativeTypeDefinition(constructor.namespaceChain.join('.')) ||
          this.findTypeDefinition(constructor.namespaceChain)
        );

        if (isArrayInstantiation) {
          const arrayTypeDefiner = new ArrayType.Definer(this.context.symbolDictionary);

          arrayTypeDefiner.defineElementType(constructorType);

          return arrayTypeDefiner;
        } else {
          const isAnonymousObjectInstantiation = !!instantiation.anonymousObjectBody;

          // TODO: Resolve anonymous object type for anonymous object instantiations
          // TODO: Resolve constrained generic types
          return constructorType;
        }
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN:
        return this.getPropertyChainType(javaSyntaxNode as JavaSyntax.IJavaPropertyChain);
      default:
        return TypeUtils.createSimpleType(Dynamic);
    }
  }

  /**
   * Determines the type of a right side-only statement via its
   * preceding operator operation.
   */
  private inferTypeFromLeftOperation (operation: JavaSyntax.JavaOperation): TypeDefinition {
    switch (operation) {
      case JavaSyntax.JavaOperation.NEGATE:
      case JavaSyntax.JavaOperation.DOUBLE_NOT:
        return TypeUtils.createSimpleType(Primitive.BOOLEAN);
      case JavaSyntax.JavaOperation.INCREMENT:
      case JavaSyntax.JavaOperation.DECREMENT:
      case JavaSyntax.JavaOperation.BITWISE_COMPLEMENT:
        return TypeUtils.createSimpleType(Primitive.NUMBER);
    }
  }
}
