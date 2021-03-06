import AbstractValidator from '../common/AbstractValidator';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { DynamicTypeConstraint, GlobalTypeConstraintMap, NullTypeConstraint } from '../../native-type-constraints/global';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { Implements, IHashMap } from 'trampoline-framework';
import { IObjectMember, ITypeConstraint, ObjectMemberVisibility, TypeDefinition } from '../../symbol-resolvers/common/types';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { TypeExpectation } from '../common/types';
import { TypeValidation } from '../common/type-validation';
import { ValidatorUtils } from '../common/validator-utils';

/**
 * Validates Java expression statements, e.g. those which can potentially
 * be written on either side of a parent statement. These include:
 *
 *  - Function calls
 *  - Instantiations
 *  - Instructions
 *  - Literals
 *  - Property chains
 *  - References
 *  - Variable declarations
 *  - Lambda expressions (@todo)
 *
 * While it would be ideal to have individual validator classes for each
 * of these expression types, property chains complicate the matter. For
 * purposes of optimization, expressions are validated in the same pass
 * as their type constraints are determined, which makes expression
 * validation a two-fold procedure. Since function calls and instantiations
 * include argument type constraint and overload checks in their validation
 * requirements, function calls and instantiations as properties in a
 * property chain also require these validations. However, an isolated
 * JavaFunctionCallValidator or JavaInstantiationValidator would neither
 * be capable of, nor would its name nominally imply, validation as part
 * of a property chain, without information being unnaturally relayed
 * between the parent JavaPropertyChainValidator and child validators.
 * Thus there would either be a significant degree of code duplication,
 * or there would have to be a mechanism of 'preloading' a validator
 * with type constraint and contextual information about the syntax
 * node being validated, and enabling broader communication and control
 * between parent and child validators, muddling their responsibilities.
 *
 * While tricky to maintain and incorporating a lot of complex validation
 * logic, a unified 'expression statement validator' avoids the need
 * for contrived changes to the AbstractValidator API and/or problems
 * associated with designing individual validators to handle property
 * chain-specific scenarios.
 */
export default class JavaExpressionStatementValidator extends AbstractValidator<JavaSyntax.IJavaStatement> {
  /**
   * A map of Java operations to the type constraints expected as their
   * operands. Null values indicate that the expected type constraint
   * should be the current expected as denoted by the validator context.
   */
  private static ExpectedOperandMap: IHashMap<ITypeConstraint> = {
    [JavaSyntax.JavaOperation.ADD]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.ASSIGN]: null,
    [JavaSyntax.JavaOperation.BITWISE_AND]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.BITWISE_COMPLEMENT]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.BITWISE_EXCLUSIVE_OR]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.BITWISE_INCLUSIVE_OR]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.CONDITIONAL_AND]: GlobalTypeConstraintMap.Boolean,
    [JavaSyntax.JavaOperation.CONDITIONAL_OR]: GlobalTypeConstraintMap.Boolean,
    [JavaSyntax.JavaOperation.DECREMENT]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.DIVIDE]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.DOUBLE_NOT]: DynamicTypeConstraint,
    [JavaSyntax.JavaOperation.ELVIS]: null,
    [JavaSyntax.JavaOperation.EQUAL_TO]: null,
    [JavaSyntax.JavaOperation.GREATER_THAN]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.GREATER_THAN_OR_EQUAL_TO]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.INCREMENT]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.INSTANCEOF]: DynamicTypeConstraint,
    [JavaSyntax.JavaOperation.LESS_THAN]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.LESS_THAN_OR_EQUAL_TO]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.MULTIPLY]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.NEGATE]: DynamicTypeConstraint,
    [JavaSyntax.JavaOperation.NOT_EQUAL_TO]: DynamicTypeConstraint,
    [JavaSyntax.JavaOperation.REMAINDER]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.SIGNED_LEFT_SHIFT]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.SIGNED_RIGHT_SHIFT]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.SUBTRACT]: GlobalTypeConstraintMap.Number,
    [JavaSyntax.JavaOperation.UNSIGNED_RIGHT_SHIFT]: GlobalTypeConstraintMap.Number
  };

  /**
   * A set of operations which, present between two expressions, automatically
   * designates their parent statement as having a boolean type constraint.
   * We keep the list in hash map form for faster lookups.
   */
  private static BooleanOperationMap: IHashMap<any> = {
    [JavaSyntax.JavaOperation.CONDITIONAL_AND]: null,
    [JavaSyntax.JavaOperation.CONDITIONAL_OR]: null,
    [JavaSyntax.JavaOperation.GREATER_THAN]: null,
    [JavaSyntax.JavaOperation.GREATER_THAN_OR_EQUAL_TO]: null,
    [JavaSyntax.JavaOperation.LESS_THAN]: null,
    [JavaSyntax.JavaOperation.LESS_THAN_OR_EQUAL_TO]: null,
    [JavaSyntax.JavaOperation.EQUAL_TO]: null,
    [JavaSyntax.JavaOperation.NOT_EQUAL_TO]: null
  };

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

  /**
   * @todo @description
   */
  private leftSideTypeConstraint: ITypeConstraint;

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

  /**
   * Returns the transformed name of a reference or function prefixed
   * with instance or constructor keywords to turn the name into an
   * instance or static member identifier, respectively.
   */
  private getClassPrefixedMemberName (name: string, isStatic: boolean) {
    const prefix = isStatic ? 'this.constructor' : 'this';

    return `${prefix}.${name}`;
  }

  private getFunctionCallReturnTypeConstraint (functionCall: JavaSyntax.IJavaFunctionCall, sourceObjectType?: ObjectType.Definition): ITypeConstraint {
    this.focusTokenRange(functionCall.tokenRange);

    const { name: functionName, arguments: args } = functionCall;
    const argumentTypeConstraints = args.map(argument => this.getStatementTypeConstraint(argument));

    if (!sourceObjectType) {
      // If no source object is provided, we first have to attempt
      // to resolve the function as a scoped reference, since scoped
      // references take priority over current visited object members
      const scopedReference = this.context.scopeManager.getScopedReference(functionName);

      if (scopedReference) {
        const { typeDefinition, isOriginal } = scopedReference.constraint;

        if (typeDefinition instanceof FunctionType.Definition) {
          this.check(
            !isOriginal,
            `Invalid call to original function type definition '${functionName}'`
          );

          if (!TypeValidation.allTypeConstraintsMatch(argumentTypeConstraints, typeDefinition.getParameterTypeConstraints())) {
            this.reportInvalidFunctionArguments(functionName, argumentTypeConstraints);

            return DynamicTypeConstraint;
          }

          return typeDefinition.getReturnTypeConstraint();
        } else {
          this.reportNonFunctionCalled(functionName);
        }
      }
    }

    // Next, we try to find the function name as a method on the
    // provided source object, or the current visited object if
    // no source object is provided
    const lookupType = sourceObjectType || this.context.objectVisitor.getCurrentVisitedObject();
    const matchingMethodMember = lookupType.getMatchingMethodMember(functionName, argumentTypeConstraints);

    if (matchingMethodMember) {
      const { name, isStatic, constraint } = matchingMethodMember;

      // We need to transform overloaded function call names to that
      // of the matching method member. If a plain, non-overloaded
      // constraint is matched, the name will not actually change.
      functionCall.name = name;

      if (!sourceObjectType) {
        // Furthermore, we need to prefix the function call name with
        // 'this' or 'this.constructor' if it was called by itself and
        // ended up matching a current visited object method or overload
        functionCall.name = this.getClassPrefixedMemberName(functionCall.name, isStatic);

        this.check(
          !this.context.flags.shouldAllowInstanceKeywords
            ? matchingMethodMember.isStatic
            : true,
          `Instance methods cannot be called in static methods or initializers`
        );
      }

      return constraint.typeDefinition.getReturnTypeConstraint();
    }

    // @todo @description
    if (this.isInsideConstructor()) {
      const currentVisitedObject = this.context.objectVisitor.getCurrentVisitedObject();
      const isOwnConstructorCall = functionName === JavaConstants.Keyword.THIS;
      const isSuperConstructorCall = functionName === JavaConstants.Keyword.SUPER;

      if (isOwnConstructorCall) {
        const constructorOverloadIndex = this.safelyGetConstructorOverloadIndex(currentVisitedObject, argumentTypeConstraints);
        const isOverloaded = typeof constructorOverloadIndex === 'number';

        if (isOverloaded) {
          functionCall.name = `this.${currentVisitedObject.name}_${constructorOverloadIndex}`;
        }

        return {
          typeDefinition: currentVisitedObject
        };
      } else if (isSuperConstructorCall) {
        const { typeDefinition: superObject } = (
          currentVisitedObject.getSuperTypeConstraintByIndex(0) as ObjectType.Constraint ||
          {} as ObjectType.Constraint
        );

        if (superObject) {
          const constructorOverloadIndex = this.safelyGetConstructorOverloadIndex(superObject, argumentTypeConstraints);
          const isOverloaded = typeof constructorOverloadIndex === 'number';

          if (isOverloaded) {
            functionCall.name = `this.${superObject.name}_${constructorOverloadIndex}`;
          }

          return {
            typeDefinition: superObject
          };
        } else {
          this.report(`'${currentVisitedObject.name}' does not have any super types`);
        }
      }
    }

    // If we get to this point, the function call constraint was incorrect,
    // so an error is guaranteed. However, we still need to determine the
    // cause of the error to accurately report it.
    const objectMember = lookupType.getObjectMember(functionName);

    if (objectMember) {
      const { typeDefinition } = objectMember.constraint;

      if (typeDefinition instanceof FunctionType.Definition) {
        this.reportInvalidFunctionArguments(functionName, argumentTypeConstraints);

        return typeDefinition.getReturnTypeConstraint();
      } else {
        this.reportNonFunctionCalled(functionName);

        return DynamicTypeConstraint;
      }
    }

    this.reportUnknownIdentifier(functionName);

    return DynamicTypeConstraint;
  }

  private getPropertyChainTypeConstraint (propertyChain: JavaSyntax.IJavaPropertyChain): ITypeConstraint {
    const { tokenRange: propertyChainTokenRange, properties } = propertyChain;
    const firstProperty = properties[0];
    let currentLookupTypeConstraint: ITypeConstraint;
    let propertyIndex = 0;

    this.focusTokenRange(propertyChainTokenRange);

    currentLookupTypeConstraint = this.getSyntaxNodeTypeConstraint(firstProperty);

    if (TypeValidation.isDynamicType(currentLookupTypeConstraint.typeDefinition)) {
      // We can't verify whether any of the additional properties are
      // valid or what their type constraints are, so we simply return
      // a dynamic type constraint
      return ValidatorUtils.getNonOriginalTypeConstraint(DynamicTypeConstraint);
    }

    let incomingProperty = properties[++propertyIndex];
    let currentMember: IObjectMember;

    while (incomingProperty) {
      const { typeDefinition: lookupTypeDefinition } = currentLookupTypeConstraint;
      const previousLookupTypeConstraint = currentLookupTypeConstraint;

      this.focusTokenRange(incomingProperty.tokenRange);

      if (lookupTypeDefinition instanceof ObjectType.Definition) {
        switch (incomingProperty.node) {
          case JavaSyntax.JavaSyntaxNode.REFERENCE: {
            // The next lookup type after a reference property
            // is the type of the member it accesses
            const { name } = incomingProperty;

            currentMember = lookupTypeDefinition.getObjectMember(name);

            if (!currentMember) {
              this.reportUnknownMember(lookupTypeDefinition.name, name);

              return DynamicTypeConstraint;
            } else if (currentMember.isStatic && !previousLookupTypeConstraint.isOriginal) {
              // Static members accessed on instances must be prefixed
              // appropriately to ensure proper value resolution
              incomingProperty.name = `constructor.${name}`;
            }

            currentLookupTypeConstraint = currentMember.constraint;
            break;
          }
          case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL: {
            // The next lookup type after a function call
            // property is its return type
            const { name: functionName } = incomingProperty;

            currentMember = lookupTypeDefinition.getObjectMember(functionName);

            if (!currentMember) {
              this.reportUnknownMember(lookupTypeDefinition.name, functionName);

              return DynamicTypeConstraint;
            }

            currentLookupTypeConstraint = this.getFunctionCallReturnTypeConstraint(incomingProperty, lookupTypeDefinition);

            if (currentMember.isStatic && !previousLookupTypeConstraint.isOriginal) {
              // Static function properties accessed on instances must be
              // prefixed appropriately to ensure proper value resolution
              incomingProperty.name = `constructor.${incomingProperty.name}`;
            }

            break;
          }
          case JavaSyntax.JavaSyntaxNode.INSTANTIATION: {
            // The next lookup type after an instantiation
            // property is its constructor type
            const { constructor } = incomingProperty;
            const constructorName = constructor.namespaceChain.join('.');

            this.focusTokenRange(constructor.tokenRange);

            currentMember = lookupTypeDefinition.getObjectMember(constructorName);

            if (!currentMember) {
              this.reportUnknownMember(lookupTypeDefinition.name, constructorName);

              return DynamicTypeConstraint;
            }

            this.validateInstantiation(incomingProperty, currentMember.constraint.typeDefinition);

            currentLookupTypeConstraint = currentMember.constraint;
            break;
          }
          default: {
            return DynamicTypeConstraint;
          }
        }

        this.validateMemberAccess(currentMember, previousLookupTypeConstraint);
      } else if (
        lookupTypeDefinition instanceof ArrayType.Definition &&
        incomingProperty.node === JavaSyntax.JavaSyntaxNode.STATEMENT
      ) {
        // Array types can only be followed by a property if they are
        // numerically-indexed element accessors
        //
        // TODO: Support native Array methods (requires architectural
        // support for generics)
        const statementTypeConstraint = this.getStatementTypeConstraint(incomingProperty);
        const { typeDefinition } = currentLookupTypeConstraint;
        const isArrayIndexProperty = TypeValidation.typeConstraintMatches(statementTypeConstraint, GlobalTypeConstraintMap.Number);

        if (isArrayIndexProperty) {
          currentLookupTypeConstraint = (typeDefinition as ArrayType.Definition).getElementTypeConstraint();
        } else {
          const indexTypeDescription = ValidatorUtils.getTypeConstraintDescription(statementTypeConstraint);

          this.report(`Invalid array index type '${indexTypeDescription}'`);

          return DynamicTypeConstraint;
        }
      } else {
        this.report(`'${ValidatorUtils.getTypeConstraintDescription(currentLookupTypeConstraint)}' does not have any properties`);

        return DynamicTypeConstraint;
      }

      incomingProperty = properties[++propertyIndex];
    }

    this.lastPropertyIsFinal = (
      !!currentMember &&
      currentMember.isConstant
    );

    return currentLookupTypeConstraint;
  }

  private getSimpleLiteralTypeConstraint (literal: JavaSyntax.IJavaLiteral): ITypeConstraint {
    let constraint: ITypeConstraint;

    switch (literal.type) {
      case JavaSyntax.JavaLiteralType.NUMBER:
        constraint = GlobalTypeConstraintMap.Number;
        break;
      case JavaSyntax.JavaLiteralType.STRING:
        constraint = GlobalTypeConstraintMap.String;
        break;
      case JavaSyntax.JavaLiteralType.KEYWORD:
        const isBooleanKeyword = (
          literal.value === JavaConstants.Keyword.TRUE ||
          literal.value === JavaConstants.Keyword.FALSE
        );

        // The only valid keyword literals are 'true', 'false', and 'null'
        constraint = isBooleanKeyword
          ? GlobalTypeConstraintMap.Boolean
          : NullTypeConstraint;
        break;
      default:
        constraint = DynamicTypeConstraint;
    }

    return ValidatorUtils.getNonOriginalTypeConstraint(constraint);
  }

  private getStatementTypeConstraint (statement: JavaSyntax.IJavaStatement): ITypeConstraint {
    if (!statement) {
      return DynamicTypeConstraint;
    }

    const { isParenthetical, leftSide, operator, cast } = statement;

    if (!!leftSide) {
      const isParentheticalStatement = (
        isParenthetical &&
        leftSide.node === JavaSyntax.JavaSyntaxNode.STATEMENT
      );

      this.leftSideTypeConstraint = isParentheticalStatement
        ? this.getStatementTypeConstraint(leftSide as JavaSyntax.IJavaStatement)
        : this.getSyntaxNodeTypeConstraint(leftSide);

      if (operator) {
        // While we have the left side type constraint in scope,
        // and if it is part of an operation, we have to validate
        // that its type constraint matches that expected for
        // the operator
        const { shouldAllowAnyType } = this.context.flags;

        const expectedOperandTypeConstraint = (
          ValidatorUtils.getNonOriginalTypeConstraint(JavaExpressionStatementValidator.ExpectedOperandMap[operator.operation]) ||
          this.leftSideTypeConstraint
        );

        this.expectType({
          constraint: expectedOperandTypeConstraint,
          expectation: TypeExpectation.OPERAND
        });

        this.checkIfTypeConstraintMatchesExpected(this.leftSideTypeConstraint);
        this.resetExpectedType();
        this.setFlags({ shouldAllowAnyType });
      }

      if (cast) {
        const originalCastTypeConstraint = this.findOriginalTypeConstraint(cast.namespaceChain);
        const castTypeConstraint = ValidatorUtils.getNonOriginalTypeConstraint(originalCastTypeConstraint);

        const isValidCast = (
          // Downcast
          TypeValidation.typeConstraintMatches(castTypeConstraint, this.leftSideTypeConstraint) ||
          // Upcast
          TypeValidation.typeConstraintMatches(this.leftSideTypeConstraint, castTypeConstraint)
        );

        this.check(
          isValidCast,
          `Cannot cast '${ValidatorUtils.getTypeConstraintDescription(this.leftSideTypeConstraint)}' to '${ValidatorUtils.getTypeConstraintDescription(castTypeConstraint)}'`
        );

        return castTypeConstraint;
      } else if (operator && this.isBooleanOperation(operator.operation)) {
        return {
          typeDefinition: GlobalTypeConstraintMap.Boolean.typeDefinition
        };
      } else {
        return this.leftSideTypeConstraint;
      }
    } else if (operator) {
      return this.inferTypeConstraintFromLeftOperation(operator.operation);
    } else {
      return {
        typeDefinition: DynamicTypeConstraint.typeDefinition
      };
    }
  }

  /**
   * Returns the type of a Java syntax node.
   */
  private getSyntaxNodeTypeConstraint (javaSyntaxNode: JavaSyntax.IJavaSyntaxNode): ITypeConstraint {
    if (!javaSyntaxNode) {
      return {
        typeDefinition: DynamicTypeConstraint.typeDefinition
      };
    }

    switch (javaSyntaxNode.node) {
      case JavaSyntax.JavaSyntaxNode.REFERENCE: {
        const reference = javaSyntaxNode as JavaSyntax.IJavaReference;
        const { name } = reference;
        const currentVisitedObject = this.context.objectVisitor.getCurrentVisitedObject();

        switch (name) {
          case JavaConstants.Keyword.THIS:
            this.validateInstanceKeyword(name);

            return {
              typeDefinition: currentVisitedObject
            };
          case JavaConstants.Keyword.SUPER:
            this.validateInstanceKeyword(name);

            const superTypeConstraint = currentVisitedObject.getSuperTypeConstraintByIndex(0);

            this.check(
              !!superTypeConstraint,
              `'${currentVisitedObject.name}' doesn't have any supertypes`
            );

            return superTypeConstraint || DynamicTypeConstraint;
          default:
            const referenceMember = currentVisitedObject.getObjectMember(name);
            const isInScope = this.context.scopeManager.isInScope(name);

            if (referenceMember && !isInScope) {
              reference.name = this.getClassPrefixedMemberName(name, referenceMember.isStatic);
            }

            return this.findTypeConstraintByName(name);
        }
      }
      case JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION: {
        const { type, name, isFinal } = javaSyntaxNode as JavaSyntax.IJavaVariableDeclaration;
        const variableTypeConstraint = this.createTypeConstraint(type.namespaceChain, type.arrayDimensions);

        this.context.scopeManager.addToScope(name, {
          constraint: variableTypeConstraint,
          isConstant: isFinal
        });

        return variableTypeConstraint;
      }
      case JavaSyntax.JavaSyntaxNode.STATEMENT: {
        return this.getStatementTypeConstraint(javaSyntaxNode as JavaSyntax.IJavaStatement);
      }
      case JavaSyntax.JavaSyntaxNode.LITERAL: {
        const literal = javaSyntaxNode as JavaSyntax.IJavaLiteral;

        if (literal.type === JavaSyntax.JavaLiteralType.ARRAY) {
          const arrayTypeDefiner = new ArrayType.Definer(this.context.symbolDictionary);
          const firstElementTypeConstraint = this.getStatementTypeConstraint(literal.value[0] as JavaSyntax.IJavaStatement);

          arrayTypeDefiner.defineElementTypeConstraint(firstElementTypeConstraint);

          return {
            typeDefinition: arrayTypeDefiner
          };
        } else {
          return this.getSimpleLiteralTypeConstraint(literal);
        }
      }
      case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL: {
        return this.getFunctionCallReturnTypeConstraint(javaSyntaxNode as JavaSyntax.IJavaFunctionCall);
      }
      case JavaSyntax.JavaSyntaxNode.INSTANTIATION: {
        const instantiation = javaSyntaxNode as JavaSyntax.IJavaInstantiation;
        const { constructor } = instantiation;
        const isArrayInstantiation = !!instantiation.arrayAllocationSize || !!instantiation.arrayLiteral;

        this.focusTokenRange(constructor.tokenRange);

        const constructorTypeConstraint = this.findOriginalTypeConstraint(constructor.namespaceChain);

        if (isArrayInstantiation) {
          const arrayTypeDefiner = new ArrayType.Definer(this.context.symbolDictionary);

          arrayTypeDefiner.defineElementTypeConstraint(constructorTypeConstraint);

          return {
            typeDefinition: arrayTypeDefiner
          };
        } else {
          const isAnonymousObjectInstantiation = !!instantiation.anonymousObjectBody;
          const { typeDefinition: constructorTypeDefinition } = constructorTypeConstraint;

          // TODO: Resolve anonymous object type for anonymous object instantiations
          // TODO: Resolve constrained generic types
          this.validateInstantiation(instantiation, constructorTypeDefinition);

          return {
            typeDefinition: constructorTypeDefinition
          };
        }
      }
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN: {
        return this.getPropertyChainTypeConstraint(javaSyntaxNode as JavaSyntax.IJavaPropertyChain);
      }
      case JavaSyntax.JavaSyntaxNode.INSTRUCTION: {
        return {
          typeDefinition: DynamicTypeConstraint.typeDefinition
        };
      }
      default:
        this.report(`Invalid expression`);

        return DynamicTypeConstraint;
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
   * Determines the type constraint of a right side-only statement
   * via its preceding operator operation.
   */
  private inferTypeConstraintFromLeftOperation (operation: JavaSyntax.JavaOperation): ITypeConstraint {
    let constraint: ITypeConstraint;

    switch (operation) {
      case JavaSyntax.JavaOperation.NEGATE:
      case JavaSyntax.JavaOperation.DOUBLE_NOT:
        constraint = GlobalTypeConstraintMap.Boolean;
        break;
      case JavaSyntax.JavaOperation.INCREMENT:
      case JavaSyntax.JavaOperation.DECREMENT:
      case JavaSyntax.JavaOperation.BITWISE_COMPLEMENT:
      case JavaSyntax.JavaOperation.ADD:
      case JavaSyntax.JavaOperation.SUBTRACT:
        constraint = GlobalTypeConstraintMap.Number;
        break;
      default:
        constraint = DynamicTypeConstraint;
    }

    return {
      typeDefinition: constraint.typeDefinition
    };
  }

  private isBooleanOperation (operation: JavaSyntax.JavaOperation): boolean {
    return operation in JavaExpressionStatementValidator.BooleanOperationMap;
  }

  private isIncrementOrDecrement (): boolean {
    const { operator } = this.syntaxNode;

    if (operator) {
      const { operation } = operator;

      return (
        operation === JavaSyntax.JavaOperation.INCREMENT ||
        operation === JavaSyntax.JavaOperation.DECREMENT
      );
    }

    return false;
  }

  private isInsideConstructor (): boolean {
    const { shouldAllowReturn, shouldAllowReturnValue } = this.context.flags;

    return shouldAllowReturn && !shouldAllowReturnValue;
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

  /**
   * @todo Move into AbstractValidator
   * @todo @description
   */
  private safelyGetConstructorOverloadIndex (objectType: ObjectType.Definition, argumentTypeConstraints: ITypeConstraint[]): number {
    let constructorOverloadIndex: number = null;

    if (objectType.hasConstructors() || argumentTypeConstraints.length > 0) {
      constructorOverloadIndex = objectType.getMatchingConstructorIndex(argumentTypeConstraints);

      if (constructorOverloadIndex === null) {
        const constructorArgumentDescriptions = argumentTypeConstraints.map(constraint => `'${ValidatorUtils.getTypeConstraintDescription(constraint)}'`);

        this.report(`Invalid constructor arguments ${constructorArgumentDescriptions.join(', ')}`);
      }
    }

    return constructorOverloadIndex;
  }

  private validateAsNonReturnStatement (): void {
    const statementTypeConstraint = this.getStatementTypeConstraint(this.syntaxNode);
    const { operator } = this.syntaxNode;

    this.checkIfTypeConstraintMatchesExpected(statementTypeConstraint);

    if (this.isIncrementOrDecrement()) {
      this.validateIncrementOrDecrement();
    }

    if (this.hasRightSide()) {
      const { rightSide } = this.syntaxNode;
      const { operation } = operator;
      const isAssignment = operation === JavaSyntax.JavaOperation.ASSIGN;
      const rightSideExpectation = isAssignment ? TypeExpectation.ASSIGNMENT : TypeExpectation.OPERAND;

      const expectedOperandTypeConstraint = (
        ValidatorUtils.getNonOriginalTypeConstraint(JavaExpressionStatementValidator.ExpectedOperandMap[operation]) ||
        this.leftSideTypeConstraint
      );

      if (isAssignment) {
        this.validateLeftSideOfAssignment();
      }

      this.expectType({
        constraint: expectedOperandTypeConstraint,
        expectation: rightSideExpectation
      });

      this.validateNodeWith(JavaExpressionStatementValidator, rightSide);
      this.resetExpectedType();
    }
  }

  private validateAsReturnStatement (): void {
    const { shouldAllowReturn, mustReturnValue } = this.context.flags;

    if (!shouldAllowReturn) {
      this.report('Unexpected return');

      return;
    }

    const returnInstruction = this.syntaxNode.leftSide as JavaSyntax.IJavaInstruction;
    const { value: returnValueStatement } = returnInstruction;
    const lastExpectedReturnTypeConstraint = this.getLastExpectedTypeConstraintFor(TypeExpectation.RETURN);
    const isMissingRequiredReturnValue = !returnValueStatement && mustReturnValue;
    const isConstructorReturn = this.isInsideConstructor();
    const isDisallowedConstructorReturnValue = isConstructorReturn && !!returnValueStatement;

    returnInstruction.isConstructorReturn = isConstructorReturn;

    if (isMissingRequiredReturnValue) {
      const returnTypeDescription = ValidatorUtils.getTypeConstraintDescription(lastExpectedReturnTypeConstraint);

      this.report(`Expected a return type of '${returnTypeDescription}'`);

      return;
    }

    if (isDisallowedConstructorReturnValue) {
      this.report('Constructors cannot return values');

      return;
    }

    if (returnValueStatement) {
      this.setFlags({
        shouldAllowReturn: false
      });

      this.expectType({
        constraint: lastExpectedReturnTypeConstraint,
        expectation: TypeExpectation.RETURN
      });

      this.validateNodeWith(JavaExpressionStatementValidator, returnValueStatement);
      this.resetExpectedType();

      this.setFlags({
        shouldAllowReturn: true
      });
    }

    this.setFlags({
      didReturnInCurrentBlock: true
    });
  }

  /**
   * The ++ and -- operators require special validations asserting that
   * their operands are Java reference nodes.
   */
  private validateIncrementOrDecrement (): void {
    const { leftSide, rightSide } = this.syntaxNode;
    const hasRightSide = this.hasRightSide();

    const hasValidOperands = (
      (!!leftSide ? leftSide.node === JavaSyntax.JavaSyntaxNode.REFERENCE : true) &&
      (this.hasRightSide() ? rightSide.leftSide.node === JavaSyntax.JavaSyntaxNode.REFERENCE : true)
    );

    if (hasRightSide) {
      this.focusTokenRange(rightSide.leftSide.tokenRange);
    }

    this.check(
      hasValidOperands,
      `Invalid non-reference operand`
    );
  }

  private validateInstanceKeyword (keyword: string): void {
    this.check(
      this.context.flags.shouldAllowInstanceKeywords,
      `'${keyword}' is not allowed in static methods or initializers`
    );
  }

  private validateInstantiation (instantiation: JavaSyntax.IJavaInstantiation, constructorType: TypeDefinition): void {
    const { constructor, arguments: args } = instantiation;
    const constructorName = constructor.namespaceChain.join('.');
    const constructorArgumentTypeConstraints = args.map(argument => this.getStatementTypeConstraint(argument));

    if (constructorType instanceof ObjectType.Definition) {
      if (!constructorType.isConstructable) {
        this.reportNonConstructableInstantiation(constructorName);
      }

      const constructorOverloadIndex = this.safelyGetConstructorOverloadIndex(constructorType, constructorArgumentTypeConstraints);

      if (constructorType.shouldOverload) {
        instantiation.overloadIndex = constructorOverloadIndex;
      }
    } else if (!TypeValidation.isDynamicType(constructorType)) {
      this.reportNonConstructor(constructorName);
    }
  }

  private validateMemberAccess (member: IObjectMember, sourceObjectTypeConstraint: ITypeConstraint): void {
    const { objectVisitor } = this.context;
    const { name, parent: parentTypeConstraint } = member;
    const { typeDefinition: parentTypeDefinition } = parentTypeConstraint;

    if (sourceObjectTypeConstraint.isOriginal) {
      const { typeDefinition } = sourceObjectTypeConstraint as ObjectType.Constraint;

      this.check(
        member.isStatic,
        `Instance member '${typeDefinition.name}.${member.name}' cannot be accessed on static class '${typeDefinition.name}'`
      );
    }

    switch (member.visibility) {
      case ObjectMemberVisibility.SELF:
        this.check(
          objectVisitor.isInsideObject(parentTypeDefinition),
          `Private member '${name}' is only accessible inside '${parentTypeDefinition.name}'`
        );
        break;
      case ObjectMemberVisibility.DERIVED:
        this.check(
          objectVisitor.isInsideObject(parentTypeDefinition) || objectVisitor.isInsideSubtypeOf(parentTypeDefinition),
          `Protected member '${name}' is only accessible inside '${parentTypeDefinition.name}' and its subclasses`
        );
        break;
    }
  }

  /**
   * Validates the current statement as the left side of an
   * assignment operation. Only a small range of statements
   * can actually be assigned; otherwise we report an error.
   */
  private validateLeftSideOfAssignment (): void {
    const { leftSide, operator } = this.syntaxNode;

    this.focusTokenRange(operator.tokenRange);

    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION:
        return;
      case JavaSyntax.JavaSyntaxNode.REFERENCE:
        const { name } = leftSide as JavaSyntax.IJavaReference;
        const referenceOrMember = this.findReferenceOrMember(name);

        this.check(
          referenceOrMember ? !referenceOrMember.isConstant : true,
          `Cannot reassign final value '${name}'`
        );

        return;
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN:
        const { properties } = leftSide as JavaSyntax.IJavaPropertyChain;
        const lastProperty = properties[properties.length - 1];

        if (lastProperty.node === JavaSyntax.JavaSyntaxNode.REFERENCE) {
          this.check(
            !this.lastPropertyIsFinal,
            `Cannot reassign final member '${lastProperty}'`
          );

          return;
        }

        break;
      default:
        this.report('Invalid assignment');
    }
  }
}
