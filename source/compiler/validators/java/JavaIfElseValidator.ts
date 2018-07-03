import AbstractValidator from '../common/AbstractValidator';
import JavaBlockValidator from './JavaBlockValidator';
import JavaExpressionStatementValidator from './JavaExpressionStatementValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaIfElseValidator extends AbstractValidator<JavaSyntax.IJavaIfElse> {
  @Implements public validate (): void {
    const { conditions, blocks } = this.syntaxNode;

    conditions.forEach(condition => this.validateNodeWith(JavaExpressionStatementValidator, condition));
    blocks.forEach(block => this.validateNodeWith(JavaBlockValidator, block));
  }
}
