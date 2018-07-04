import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import JavaExpressionStatementValidator from './JavaExpressionStatementValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaWhileLoopValidator extends AbstractValidator<JavaSyntax.IJavaWhileLoop> {
  @Implements public validate (): void {
    const { condition, block } = this.syntaxNode;

    this.setFlags({
      shouldAllowAnyType: true
    });

    this.validateNodeWith(JavaExpressionStatementValidator, condition);
    this.validateNodeWith(JavaBlockValidator, block);
  }
}
