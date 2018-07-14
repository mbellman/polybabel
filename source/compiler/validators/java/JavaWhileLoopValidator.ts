import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import JavaExpressionStatementValidator from './JavaExpressionStatementValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { GlobalTypeConstraintMap } from '../../native-type-constraints/global';
import { TypeExpectation } from '../common/types';

export default class JavaWhileLoopValidator extends AbstractValidator<JavaSyntax.IJavaWhileLoop> {
  @Implements public validate (): void {
    const { condition, block } = this.syntaxNode;

    this.expectType({
      constraint: GlobalTypeConstraintMap.Boolean,
      expectation: TypeExpectation.EXPRESSION
    });

    this.validateNodeWith(JavaExpressionStatementValidator, condition);
    this.validateNodeWith(JavaBlockValidator, block);
  }
}
