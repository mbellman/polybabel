import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { Callback } from '../../../system/types';
import { Dynamic, ISimpleType, Primitive, TypeDefinition, Void, IObjectMember, ObjectMemberVisibility } from '../../symbol-resolvers/common/types';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { IToken } from '../../../tokenizer/types';
import { IValidatorError, IValidatorHelper } from '../common/types';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TokenUtils } from '../../../tokenizer/token-utils';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';
import { ObjectType } from '../../symbol-resolvers/common/object-type';
import { ValidatorUtils } from '../common/validator-utils';

export namespace JavaValidatorUtils {
  /**
   * Determines the type of a right side-only statement as implied
   * by the operation to its left.
   *
   * @internal
   */
  function inferTypeFromLeftOperation (operation: JavaSyntax.JavaOperation): TypeDefinition {
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

  /**
   * @todo @description
   *
   * @internal
   */
  function getSimpleLiteralType (literal: JavaSyntax.IJavaLiteral): ISimpleType {
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

  /**
   * @todo @description
   *
   * @internal
   */
  function getPropertyChainType ({ properties, token }: JavaSyntax.IJavaPropertyChain, validatorHelper: IValidatorHelper): TypeDefinition {
    function reportUnknownMemberAndReturnDynamicType (objectName: string, memberName: string): ISimpleType {
      validatorHelper.report(`Unknown member '${objectName}.${memberName}`);

      return TypeUtils.createSimpleType(Dynamic);
    }

    validatorHelper.focusToken(token);

    const firstProperty = properties[0];
    let currentPropertyLookupType: TypeDefinition;
    let propertyIndex = 0;

    if (typeof firstProperty === 'string') {
      // The first property may be a plain string, in which
      // case we treat it as a reference to some value. Using
      // findTypeDefinition() we can get the type of that value
      // if its reference is in scope.
      //
      // @see AbstractValidator.findTypeDefinition()
      currentPropertyLookupType = validatorHelper.findTypeDefinition([ firstProperty ]);
    } else {
      // TODO: Retrieve the first property currentPropertyLookupType
      // via a simple getStatementType() call here; add support for
      // the below statement nodes
      switch (firstProperty.node) {
        case JavaSyntax.JavaSyntaxNode.STATEMENT:
          // If the first property is a statement, the lookup type
          // should be that of the statement. Only parenthetical
          // statements can be first properties.
          currentPropertyLookupType = getStatementType(firstProperty, validatorHelper);
          break;
        case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
          // If the first property is a function call, the lookup
          // type should be that of its return type
          const { name } = firstProperty;
          const functionType = validatorHelper.findTypeDefinition([ name ]) as FunctionType.Definition;

          currentPropertyLookupType = functionType.getReturnType();
          break;
        case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
          // If the first property is an instantiation, the lookup
          // type should be that of the constructor
          const { constructor } = firstProperty;

          currentPropertyLookupType = validatorHelper.findTypeDefinition(constructor.namespaceChain);
          break;
        case JavaSyntax.JavaSyntaxNode.LITERAL:
          // The only literal allowed as a first property is a string,
          // so we return the String interface
          // TODO: Native type interfaces; returning a dynamic type for now
          currentPropertyLookupType = TypeUtils.createSimpleType(Dynamic);
          break;
      }
    }

    if (!currentPropertyLookupType) {
      // If there was any problem getting the lookup type, it will have
      // been reported within one of the previous findTypeDefinition()
      // calls, or during validation of the function return type. Since
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
        validatorHelper.report(`'${ValidatorUtils.getTypeDescription(currentPropertyLookupType)}' is not an object`);

        return TypeUtils.createSimpleType(Dynamic);
      }

      if (typeof incomingProperty === 'string') {
        // The next lookup type of a string property is the type
        // of the member it accesses
        currentMember = currentPropertyLookupType.getObjectMember(incomingProperty);

        if (!currentMember) {
          return reportUnknownMemberAndReturnDynamicType(currentPropertyLookupType.name, incomingProperty);
        }

        currentPropertyLookupType = currentMember.type;
      } else {
        switch (incomingProperty.node) {
          case JavaSyntax.JavaSyntaxNode.FUNCTION_CALL:
            // The next lookup type of a function call
            // property is its return type
            const { name } = incomingProperty;

            currentMember = currentPropertyLookupType.getObjectMember(name);

            if (!currentMember) {
              return reportUnknownMemberAndReturnDynamicType(currentPropertyLookupType.name, name);
            }

            if (!(currentMember.type instanceof FunctionType.Definition)) {
              validatorHelper.report(`Property '${name}' is not a function type`);

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
              return reportUnknownMemberAndReturnDynamicType(currentPropertyLookupType.name, constructorName);
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

  /**
   * Resolves the type definition of a Java statement node using
   * its left side. Alternatively, in the case of a right side-only
   * statement with an operator on its left, we return either a
   * simple boolean type (e.g. !, !!) or a simple number type (e.g.
   * ++, --, ~).
   *
   * We take for granted that the statement is type-consistent and
   * does not improperly mix or operate on sides with incompatible
   * types. In order to ensure statement type consistency, we use
   * a JavaStatementValidator separately. This utility should only
   * be used if statement nodes are determined to be valid.
   */
  export function getStatementType (statement: JavaSyntax.IJavaStatement, validatorHelper: IValidatorHelper): TypeDefinition {
    const { leftSide, operator, rightSide } = statement;

    if (statement.isParenthetical) {
      return getStatementType(leftSide as JavaSyntax.IJavaStatement, validatorHelper);
    } else if (!leftSide && operator) {
      return inferTypeFromLeftOperation(operator.operation);
    }

    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        const literal = leftSide as JavaSyntax.IJavaLiteral;

        if (literal.type === JavaSyntax.JavaLiteralType.ARRAY) {
          const arrayTypeDefiner = new ArrayType.Definer(validatorHelper.symbolDictionary);
          const firstElementType = getStatementType(literal.value[0] as JavaSyntax.IJavaStatement, validatorHelper);

          arrayTypeDefiner.defineElementType(firstElementType);

          return arrayTypeDefiner;
        } else {
          return getSimpleLiteralType(literal);
        }
      case JavaSyntax.JavaSyntaxNode.REFERENCE:
        const reference = leftSide as JavaSyntax.IJavaReference;
        const { value } = reference;
        const referenceType = validatorHelper.findTypeDefinition([ value ]);

        return referenceType;
      case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
        const instantiation = leftSide as JavaSyntax.IJavaInstantiation;
        const isArrayInstantiation = !!instantiation.arrayAllocationSize || !!instantiation.arrayLiteral;
        const constructorType = getTypeDefinition(instantiation.constructor, validatorHelper);

        if (isArrayInstantiation) {
          const arrayTypeDefiner = new ArrayType.Definer(validatorHelper.symbolDictionary);

          arrayTypeDefiner.defineElementType(constructorType);

          return arrayTypeDefiner;
        } else {
          const isAnonymousObjectInstantiation = !!instantiation.anonymousObjectBody;

          // TODO: Resolve anonymous object type for anonymous object instantiations
          // TODO: Resolve constrained generic types
          return constructorType;
        }
      case JavaSyntax.JavaSyntaxNode.PROPERTY_CHAIN:
        return getPropertyChainType(leftSide as JavaSyntax.IJavaPropertyChain, validatorHelper);
      default:
        return TypeUtils.createSimpleType(Dynamic);
    }
  }

  /**
   * Returns a type definition for native Java type names,
   * or null if the provided type name doesn't correspond
   * to any.
   */
  export function getNativeTypeDefinition (typeName: string): TypeDefinition {
    switch (typeName) {
      case JavaConstants.Type.STRING:
      case JavaConstants.Type.CHAR:
        return TypeUtils.createSimpleType(Primitive.STRING);
      case JavaConstants.Type.INT:
      case JavaConstants.Type.INTEGER:
      case JavaConstants.Type.NUMBER:
      case JavaConstants.Type.FLOAT:
      case JavaConstants.Type.DOUBLE:
      case JavaConstants.Type.LONG:
      case JavaConstants.Type.SHORT:
        return TypeUtils.createSimpleType(Primitive.NUMBER);
      case JavaConstants.Type.VOID:
        return TypeUtils.createSimpleType(Void);
      case JavaConstants.Type.BOOLEAN_UC:
      case JavaConstants.Type.BOOLEAN_LC:
        return TypeUtils.createSimpleType(Primitive.BOOLEAN);
      case JavaConstants.Type.OBJECT:
        return TypeUtils.createSimpleType(Primitive.OBJECT);
      default:
        return null;
    }
  }

  /**
   * Returns a type definition for a provided Java type syntax node.
   */
  export function getTypeDefinition ({ namespaceChain }: JavaSyntax.IJavaType, validatorHelper: IValidatorHelper): TypeDefinition {
    const typeName = namespaceChain.join('.');

    return (
      getNativeTypeDefinition(typeName) ||
      validatorHelper.findTypeDefinition(namespaceChain)
    );
  }
}
