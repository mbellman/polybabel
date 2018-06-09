import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { ArrayType } from '../../symbol-resolvers/common/array-type';
import { Dynamic, ISimpleType, Primitive, TypeDefinition, Void } from '../../symbol-resolvers/common/types';
import { IValidationHelper } from '../common/types';
import { JavaConstants } from '../../../parser/java/java-constants';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';

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
  export function getStatementType (statement: JavaSyntax.IJavaStatement, validationHelper: IValidationHelper): TypeDefinition {
    const { leftSide, operator, rightSide } = statement;

    if (statement.isParenthetical) {
      return getStatementType(leftSide as JavaSyntax.IJavaStatement, validationHelper);
    } else if (!leftSide && operator) {
      return inferTypeFromLeftOperation(operator.operation);
    }

    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        const literal = leftSide as JavaSyntax.IJavaLiteral;

        if (literal.type === JavaSyntax.JavaLiteralType.ARRAY) {
          const arrayTypeDefiner = new ArrayType.Definer(validationHelper.symbolDictionary);
          const firstElementType = getStatementType(literal.value[0] as JavaSyntax.IJavaStatement, validationHelper);

          arrayTypeDefiner.defineElementType(firstElementType);

          return arrayTypeDefiner;
        } else {
          return getSimpleLiteralType(literal);
        }
      case JavaSyntax.JavaSyntaxNode.REFERENCE:
        const reference = leftSide as JavaSyntax.IJavaReference;
        const { value } = reference;
        const referenceType = validationHelper.findTypeDefinition([ value ]);

        return referenceType;
      case JavaSyntax.JavaSyntaxNode.INSTANTIATION:
        const instantiation = leftSide as JavaSyntax.IJavaInstantiation;
        const { namespaceChain } = instantiation.constructor;
        const isArrayInstantiation = !!instantiation.arrayAllocationSize || !!instantiation.arrayLiteral;

        const constructorType = (
          getNativeType(namespaceChain.join('.')) ||
          validationHelper.findTypeDefinition(namespaceChain)
        );

        if (isArrayInstantiation) {
          const arrayTypeDefiner = new ArrayType.Definer(validationHelper.symbolDictionary);

          arrayTypeDefiner.defineElementType(constructorType);

          return arrayTypeDefiner;
        } else {
          const isAnonymousObjectInstantiation = !!instantiation.anonymousObjectBody;

          // TODO: Resolve anonymous object type for anonymous object instantiations
          // TODO: Resolve constrained generic types
          return constructorType;
        }
      default:
        return TypeUtils.createSimpleType(Dynamic);
    }
  }

  /**
   * Returns a native Java type definition for a given type name,
   * or null if the name does not correspond to any known native
   * types.
   */
  export function getNativeType (typeName: string): TypeDefinition {
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
}
