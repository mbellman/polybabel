import AbstractValidator from '../common/AbstractValidator';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { Dynamic, IObjectMember, ISimpleType, Primitive, TypeDefinition } from '../../symbol-resolvers/common/types';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ValidatorUtils } from '../common/validator-utils';
import { TypeValidation } from '../common/type-validation';
import { TypeExpectation } from '../common/types';

/**
 * Validates Java statements. The fundamental qualifications for
 * 'valid' Java statements are that they:
 *
 *  1. Have a type corresponding to the current expected type
 *
 *  2. Don't involve invalid property chain access where applicable
 *
 *  3. Aren't located in an invalid spot (e.g. full statements where
 *     only expressions are allowed). Since the Java parser does not
 *     distinguish between statements and expressions in that it only
 *     identifies statement syntax nodes, we have to validate their
 *     type and proper use here.
 *
 * When invoked directly from a block, Java statement validation allows
 * the type of the incoming statement to be any type. However, in the
 * case of return statements or recursively validated operand/assigned
 * statements, we need to ensure that the statement type matches that
 * expected.
 */
export default class JavaStatementValidator extends AbstractValidator<JavaSyntax.IJavaStatement> {
  @Implements public validate (): void {
    if (this.isReturnStatement()) {
      const { value: returnStatement } = this.syntaxNode.leftSide as JavaSyntax.IJavaInstruction;

      this.expectType({
        type: this.getLastExpectedTypeFor(TypeExpectation.RETURN),
        expectation: TypeExpectation.RETURN
      });

      this.validateNodeWith(JavaStatementValidator, returnStatement);
      this.resetExpectedType();
    } else {
      const statementType = this.getStatementType(this.syntaxNode);
      const { operator } = this.syntaxNode;

      this.checkIfTypeMatchesExpected(statementType);

      if (this.hasRightSide()) {
        const { rightSide } = this.syntaxNode;

        const expectation = operator.operation === JavaSyntax.JavaOperation.ASSIGN
          ? TypeExpectation.ASSIGNMENT
          : TypeExpectation.OPERAND;

        this.expectType({
          type: statementType,
          expectation
        });

        this.validateNodeWith(JavaStatementValidator, rightSide);
        this.resetExpectedType();
      } else if (operator) {
        // TODO: Validate that statements with ++ and --
        // operators are references and number types
      }
    }
  }

  private getPropertyChainType (propertyChain: JavaSyntax.IJavaPropertyChain): TypeDefinition {
    const { token: propertyChainToken, properties } = propertyChain;

    this.focusToken(propertyChainToken);

    const firstProperty = properties[0];
    let currentPropertyLookupType: TypeDefinition;
    let propertyIndex = 0;

    if (typeof firstProperty === 'string') {
      currentPropertyLookupType = this.findTypeDefinitionByName(firstProperty);
    } else {
      currentPropertyLookupType = this.getSyntaxNodeType(firstProperty);
    }

    if (TypeValidation.isDynamic(currentPropertyLookupType)) {
      // If there was any problem getting the initial lookup type, it will
      // have been reported within one of the previous calls. If the lookup
      // type was actually resolved and simply corresponds to a dynamic type,
      // the whole property chain is dynamic. In either case, we return a
      // dynamic type as a graceful fallback.
      return currentPropertyLookupType;
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

        const propertyNameToken = ValidatorUtils.findKeywordToken(incomingProperty, propertyChainToken, token => token.nextTextToken);

        this.focusToken(propertyNameToken);

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

            this.focusToken(incomingProperty.token);

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

            this.focusToken(constructor.token);

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

    return currentPropertyLookupType;
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
    const { isParenthetical, leftSide, operator } = statement;

    if (isParenthetical) {
      return this.getStatementType(leftSide as JavaSyntax.IJavaStatement);
    } else if (!!leftSide) {
      return this.getSyntaxNodeType(leftSide);
    } else if (operator) {
      return this.inferTypeFromLeftOperation(operator.operation);
    }
  }

  /**
   * Returns the type of a Java syntax node. This method has side
   * effects, as the process of determining a syntax node type also
   * might involve focusing tokens or adding values to scope, mostly
   * to avoid duplication of effort.
   */
  private getSyntaxNodeType (javaSyntaxNode: JavaSyntax.IJavaSyntaxNode): TypeDefinition {
    switch (javaSyntaxNode.node) {
      case JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION: {
        const { type, name } = javaSyntaxNode as JavaSyntax.IJavaVariableDeclaration;
        const typeDefinition = this.findTypeDefinition(type.namespaceChain);

        this.context.scopeManager.addToScope(name, typeDefinition);

        return typeDefinition;
      }
      case JavaSyntax.JavaSyntaxNode.STATEMENT: {
        return this.getStatementType(javaSyntaxNode as JavaSyntax.IJavaStatement);
      }
      case JavaSyntax.JavaSyntaxNode.LITERAL: {
        const literal = javaSyntaxNode as JavaSyntax.IJavaLiteral;

        if (literal.type === JavaSyntax.JavaLiteralType.ARRAY) {
          const arrayTypeDefiner = new ArrayType.Definer(this.context.symbolDictionary);
          const firstElementType = this.getStatementType(literal.value[0] as JavaSyntax.IJavaStatement);

          arrayTypeDefiner.defineElementType(firstElementType);

          return arrayTypeDefiner;
        } else {
          return this.getSimpleLiteralType(literal);
        }
      }
      case JavaSyntax.JavaSyntaxNode.REFERENCE: {
        const reference = javaSyntaxNode as JavaSyntax.IJavaReference;
        const { value: referenceName } = reference;

        return this.findTypeDefinitionByName(referenceName);
      }
      case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL: {
        const { name } = javaSyntaxNode as JavaSyntax.IJavaFunctionCall;
        const functionType = this.findTypeDefinitionByName(name) as FunctionType.Definition;

        return functionType.getReturnType();
      }
      case JavaSyntax.JavaSyntaxNode.INSTANTIATION: {
        const instantiation = javaSyntaxNode as JavaSyntax.IJavaInstantiation;
        const { constructor } = instantiation;
        const isArrayInstantiation = !!instantiation.arrayAllocationSize || !!instantiation.arrayLiteral;
        const constructorType = this.findTypeDefinition(constructor.namespaceChain);

        this.focusToken(constructor.token);

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
      }
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN: {
        return this.getPropertyChainType(javaSyntaxNode as JavaSyntax.IJavaPropertyChain);
      }
      default:
        return TypeUtils.createSimpleType(Dynamic);
    }
  }

  private hasRightSide (): boolean {
    const { rightSide } = this.syntaxNode;

    return !!rightSide && (
      !!rightSide.leftSide ||
      !!rightSide.rightSide
    );
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

  private isReturnStatement (): boolean {
    const { leftSide } = this.syntaxNode;

    if (!leftSide) {
      return false;
    }

    const { node, type } = leftSide as JavaSyntax.IJavaInstruction;

    return (
      node === JavaSyntax.JavaSyntaxNode.INSTRUCTION &&
      type === JavaSyntax.JavaInstructionType.RETURN
    );
  }
}
