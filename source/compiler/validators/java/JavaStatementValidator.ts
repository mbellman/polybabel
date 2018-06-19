import AbstractValidator from '../common/AbstractValidator';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { Dynamic, IObjectMember, ISimpleType, Primitive, TypeDefinition, Void } from '../../symbol-resolvers/common/types';
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
 *  1. Have a type corresponding to the current expected type if any
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
  /**
   * Determines whether the last member on a property chain is final.
   * Assignment validation depends on characteristics of the statement's
   * left side, and because property chain statements will have already
   * been traversed to ascertain their type, we preserve information
   * relevant to assignment validation for optimization purposes. In
   * this case all we need to know is whether the last member is final,
   * and can therefore be reassigned. Non-string last properties are
   * automatically disqualified.
   */
  private lastPropertyIsFinal: boolean = false;

  @Implements public validate (): void {
    const { didReturnInCurrentBlock, didReportUnreachableCode } = this.context.flags;

    if (didReturnInCurrentBlock && !didReportUnreachableCode) {
      this.reportUnreachableCode();

      this.setFlags({
        didReportUnreachableCode: true
      });
    }

    if (this.isReturnStatement()) {
      this.validateAsReturnStatement();
    } else {
      this.validateAsNonReturnStatement();
    }
  }

  private getPropertyChainType (propertyChain: JavaSyntax.IJavaPropertyChain): TypeDefinition {
    const { token: propertyChainToken, properties } = propertyChain;

    this.focusToken(propertyChainToken);

    const firstProperty = properties[0];
    let currentPropertyLookupType: TypeDefinition;
    let propertyIndex = 0;

    if (typeof firstProperty === 'string') {
      // TODO: Refactor all of this once single-word properties are references
      const currentVisitedObject = this.context.objectVisitor.getCurrentVisitedObject();

      switch (firstProperty) {
        case JavaConstants.Keyword.THIS:
          this.validateInstanceKeyword(firstProperty);

          currentPropertyLookupType = currentVisitedObject;
          break;
        case JavaConstants.Keyword.SUPER:
          const supertype = currentVisitedObject.getSupertypeByIndex(0);

          this.validateInstanceKeyword(firstProperty);

          this.check(
            !!supertype,
            `'${currentVisitedObject.name}' does not have a supertype`
          );

          currentPropertyLookupType = supertype || TypeUtils.createSimpleType(Dynamic);
          break;
        default:
          currentPropertyLookupType = this.findTypeDefinitionByName(firstProperty);
      }
    } else {
      currentPropertyLookupType = this.getSyntaxNodeType(firstProperty);
    }

    if (TypeValidation.isDynamic(currentPropertyLookupType)) {
      return currentPropertyLookupType;
    }

    let incomingProperty = properties[++propertyIndex];
    let currentMember: IObjectMember;

    while (incomingProperty) {
      if (!(currentPropertyLookupType instanceof ObjectType.Definition)) {
        this.report(`'${ValidatorUtils.getTypeDescription(currentPropertyLookupType)}' is not an object`);

        return TypeUtils.createSimpleType(Dynamic);
      }

      if (typeof incomingProperty === 'string') {
        // The next lookup type after a string property is the type
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
          case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL: {
            // The next lookup type after a function call
            // property is its return type
            const { name: functionName } = incomingProperty;

            this.focusToken(incomingProperty.token);

            currentMember = currentPropertyLookupType.getObjectMember(functionName);

            if (!currentMember) {
              this.reportUnknownMember(currentPropertyLookupType.name, functionName);

              return TypeUtils.createSimpleType(Dynamic);
            } else if (!(currentMember.type instanceof FunctionType.Definition)) {
              this.reportNonFunctionCalled(`${currentPropertyLookupType.name}.${functionName}`);

              return TypeUtils.createSimpleType(Dynamic);
            }

            this.validateFunctionCall(incomingProperty, currentMember.type);

            currentPropertyLookupType = currentMember.type.getReturnType();
            break;
          }
          case JavaSyntax.JavaSyntaxNode.INSTANTIATION: {
            // The next lookup type after an instantiation
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

            this.validateInstantiation(incomingProperty, currentPropertyLookupType);
            break;
          }
          case JavaSyntax.JavaSyntaxNode.STATEMENT: {
            // TODO: Number indexes -> array element type
            //
            // We can't know what the computed property name will be,
            // and since Java doesn't have index types, we just return
            // a dynamic type as a fallback
            return TypeUtils.createSimpleType(Dynamic);
          }
        }
      }

      // TODO: Member visibility checks

      incomingProperty = properties[++propertyIndex];
    }

    this.lastPropertyIsFinal = currentMember.isConstant;

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
   * Returns the type of a Java syntax node.
   */
  private getSyntaxNodeType (javaSyntaxNode: JavaSyntax.IJavaSyntaxNode): TypeDefinition {
    switch (javaSyntaxNode.node) {
      case JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION: {
        const { type, name, isFinal } = javaSyntaxNode as JavaSyntax.IJavaVariableDeclaration;
        const typeDefinition = this.findTypeDefinition(type.namespaceChain);

        this.context.scopeManager.addToScope(name, {
          signature: {
            definition: typeDefinition
          },
          isConstant: isFinal
        });

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
        const referenceType = this.findTypeDefinitionByName(referenceName);

        // TODO: Determine this information using a new 'find'
        // API which returns not only type information, but
        // the source of the found reference
        reference.isInstanceFieldReference = this.context.objectVisitor.currentVisitedObjectHasMember(referenceName);

        return referenceType;
      }
      case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL: {
        const functionCall = javaSyntaxNode as JavaSyntax.IJavaFunctionCall;
        const { name } = functionCall;
        const functionType = this.findTypeDefinitionByName(name) as FunctionType.Definition;

        // TODO: this.validateFunctionCall(javaSyntax, functionType)
        // TODO: Determine this information using a new 'find'
        // API, etc. (see the case above)
        functionCall.isInstanceFunction = this.context.objectVisitor.currentVisitedObjectHasMember(name);

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
          this.validateInstantiation(instantiation, constructorType);

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

  private validateOwnAssignment (): void {
    const { leftSide, operator } = this.syntaxNode;

    this.focusToken(operator.token);

    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION:
        return;
      case JavaSyntax.JavaSyntaxNode.REFERENCE:
        const { value } = leftSide as JavaSyntax.IJavaReference;
        const referenceOrMember = this.findReferenceOrMember(value);

        this.check(
          referenceOrMember ? !referenceOrMember.isConstant : true,
          `Cannot reassign final value '${value}'`
        );

        break;
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN:
        const { properties } = leftSide as JavaSyntax.IJavaPropertyChain;
        const lastProperty = properties[properties.length - 1];

        if (typeof lastProperty === 'string') {
          this.check(
            !this.lastPropertyIsFinal,
            `Cannot reassign final member '${lastProperty}'`
          );
        } else {
          this.report('Invalid assignment');
        }

        break;
      default:
        this.report('Invalid assignment');
    }
  }

  private validateFunctionCall (functionCall: JavaSyntax.IJavaFunctionCall, functionType: TypeDefinition | TypeDefinition[]): void {

  }

  private validateInstanceKeyword (keyword: string): void {
    this.check(
      this.context.flags.shouldAllowInstanceKeywords,
      `'${keyword}' is not allowed in static methods or initializers`
    );
  }

  private validateInstantiation (instantiation: JavaSyntax.IJavaInstantiation, objectType: TypeDefinition): void {
    const { constructor, arguments: args } = instantiation;
    const constructorName = constructor.namespaceChain.join('.');
    const constructorArgumentTypes = args.map(argument => this.getStatementType(argument));

    if (objectType instanceof ObjectType.Definition) {
      if (!objectType.isConstructable) {
        this.reportNonConstructableInstantiation(constructorName);
      }

      const constructorOverloadIndex = objectType.getConstructorSignatureIndex(constructorArgumentTypes);

      if (constructorOverloadIndex === -1) {
        const constructorArgumentDescriptions = constructorArgumentTypes.map(type => `'${ValidatorUtils.getTypeDescription(type)}'`);

        this.report(`Invalid constructor arguments ${constructorArgumentDescriptions.join(', ')}`);
      }

      instantiation.overloadIndex = constructorOverloadIndex;
    } else {
      this.reportNonConstructor(constructorName);
    }
  }

  private validateAsNonReturnStatement (): void {
    const statementType = this.getStatementType(this.syntaxNode);
    const { operator } = this.syntaxNode;

    this.checkIfTypeMatchesExpected(statementType);

    if (this.hasRightSide()) {
      const { rightSide } = this.syntaxNode;
      const isAssignment = operator.operation === JavaSyntax.JavaOperation.ASSIGN;
      const expectation = isAssignment ? TypeExpectation.ASSIGNMENT : TypeExpectation.OPERAND;

      if (isAssignment) {
        this.validateOwnAssignment();
      }

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

  private validateAsReturnStatement (): void {
    const { shouldAllowReturn, shouldAllowReturnValue, mustReturnValue } = this.context.flags;

    if (!shouldAllowReturn) {
      this.report('Return statements are not allowed in fields or initializers');

      return;
    }

    const returnInstruction = this.syntaxNode.leftSide as JavaSyntax.IJavaInstruction;
    const { value: returnValue } = returnInstruction;
    const lastExpectedReturnType = this.getLastExpectedTypeFor(TypeExpectation.RETURN);
    const isMissingRequiredReturnValue = !returnValue && mustReturnValue;
    const isConstructorReturn = shouldAllowReturn && !shouldAllowReturnValue;
    const isDisallowedConstructorReturnValue = isConstructorReturn && returnValue;

    returnInstruction.isConstructorReturn = isConstructorReturn;

    if (isMissingRequiredReturnValue) {
      const returnTypeDescription = ValidatorUtils.getTypeDescription(lastExpectedReturnType);

      this.report(`Expected a '${returnTypeDescription}' return value`);

      return;
    }

    if (isDisallowedConstructorReturnValue) {
      this.report('Constructors cannot return values');

      return;
    }

    if (returnValue) {
      this.setFlags({
        shouldAllowReturn: false
      });

      this.expectType({
        type: lastExpectedReturnType,
        expectation: TypeExpectation.RETURN
      });

      this.validateNodeWith(JavaStatementValidator, returnValue);
      this.resetExpectedType();

      this.setFlags({
        shouldAllowReturn: true
      });
    }

    this.setFlags({
      didReturnInCurrentBlock: true
    });
  }
}
