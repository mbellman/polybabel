import AbstractValidator from '../common/AbstractValidator';
import ScopeManager from '../../ScopeManager';
import SymbolDictionary from '../../symbol-resolvers/common/SymbolDictionary';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { Primitive, TypeDefinition } from '../../symbol-resolvers/common/types';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';

export namespace JavaValidatorUtils {
  /**
   * Determines the type of a right side-only statement as implied
   * by the operation on its left.
   *
   * @internal
   */
  function inferTypeFromOperation (operation: JavaSyntax.JavaOperation): TypeDefinition {
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

  function getLiteralType (literal: JavaSyntax.IJavaLiteral): TypeDefinition {
    switch (literal.type) {
      case JavaSyntax.JavaLiteralType.NUMBER:
        return TypeUtils.createSimpleType(Primitive.NUMBER);
      case JavaSyntax.JavaLiteralType.STRING:
        return TypeUtils.createSimpleType(Primitive.STRING);
      case JavaSyntax.JavaLiteralType.KEYWORD:
        // TODO
        break;
    }
  }

  /**
   * Resolves the type definition of a Java statement node using
   * its left side. Alternatively, in the case of a right side-only
   * statement with an operator on the left, we return either a
   * simple boolean type (!, !!) or a simple number type (++, --,
   * ~).
   *
   * In the context of this utility, we take for granted that the
   * statement is type-consistent and does not improperly mix or
   * operate on sides with incompatible types. In order to ensure
   * statement type consistency, JavaStatementValidator is used
   * separately. This utility should only be used if statement
   * nodes are determined to be valid.
   *
   * @see JavaStatementValidator
   */
  export function getStatementType (statement: JavaSyntax.IJavaStatement, symbolDictionary: SymbolDictionary, scopeManager: ScopeManager): TypeDefinition {
    const { leftSide, operator, rightSide } = statement;

    if (statement.isParenthetical) {
      return getStatementType(leftSide as JavaSyntax.IJavaStatement, symbolDictionary, scopeManager);
    } else if (!leftSide && operator) {
      return inferTypeFromOperation(operator.operation);
    }

    switch (leftSide.node) {
      case JavaSyntax.JavaSyntaxNode.LITERAL:
        return getLiteralType(leftSide as JavaSyntax.IJavaLiteral);
    }
  }
}
