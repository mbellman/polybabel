import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import JavaExpressionStatementValidator from './JavaExpressionStatementValidator';
import { Implements } from 'trampoline-framework';
import { ISyntaxNode } from '../../../parser/common/syntax-types';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { TypeExpectation } from '../common/types';
import { TypeUtils } from '../../symbol-resolvers/common/type-utils';

export default class JavaForLoopValidator extends AbstractValidator<JavaSyntax.IJavaForLoop> {
  @Implements public validate (): void {
    const { statements, block, isEnhanced } = this.syntaxNode;

    if (isEnhanced) {
      const [ iteratorValue, collection ] = statements;
      const { node: iteratorNode } = iteratorValue.leftSide || {} as ISyntaxNode;

      const isValidIteratorValue = (
        iteratorNode === JavaSyntax.JavaSyntaxNode.VARIABLE_DECLARATION ||
        iteratorNode === JavaSyntax.JavaSyntaxNode.REFERENCE
      );

      this.focusToken(iteratorValue.token);

      this.check(
        isValidIteratorValue,
        `Invalid iterator value`
      );

      this.validateNodeWith(JavaExpressionStatementValidator, iteratorValue);

      const { symbolDictionary, lastCheckedTypeConstraint } = this.context;
      const collectionTypeConstraint = TypeUtils.createArrayTypeConstraint(symbolDictionary, lastCheckedTypeConstraint, 1);

      this.expectType({
        expectation: TypeExpectation.STATEMENT,
        constraint: collectionTypeConstraint
      });

      this.validateNodeWith(JavaExpressionStatementValidator, collection);
    } else {
      statements.forEach(statement => {
        if (statement) {
          this.setFlags({
            shouldAllowAnyType: true
          });

          this.validateNodeWith(JavaExpressionStatementValidator, statement);
        }
      });
    }

    this.validateNodeWith(JavaBlockValidator, block);
  }
}
