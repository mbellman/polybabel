import AbstractValidator from '../common/AbstractValidator';
import JavaExpressionStatementValidator from './JavaExpressionStatementValidator';
import JavaForLoopValidator from './JavaForLoopValidator';
import JavaIfElseValidator from './JavaIfElseValidator';
import JavaWhileLoopValidator from './JavaWhileLoopValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';

export default class JavaBlockValidator extends AbstractValidator<JavaSyntax.IJavaBlock> {
  @Implements public validate (): void {
    const { nodes } = this.syntaxNode;

    this.context.scopeManager.enterScope();

    this.setFlags({
      didReturnInCurrentBlock: false,
      didReportUnreachableCode: false
    });

    nodes.forEach(statementNode => {
      const { leftSide } = statementNode;

      this.setFlags({
        shouldAllowAnyType: true
      });

      if (leftSide) {
        switch (leftSide.node) {
          case JavaSyntax.JavaSyntaxNode.IF_ELSE:
            this.validateNodeWith(JavaIfElseValidator, leftSide as JavaSyntax.IJavaIfElse);
            break;
          case JavaSyntax.JavaSyntaxNode.FOR_LOOP:
            this.validateNodeWith(JavaForLoopValidator, leftSide as JavaSyntax.IJavaForLoop);
            break;
          case JavaSyntax.JavaSyntaxNode.WHILE_LOOP:
            this.validateNodeWith(JavaWhileLoopValidator, leftSide as JavaSyntax.IJavaWhileLoop);
            break;
          default:
            this.validateNodeWith(JavaExpressionStatementValidator, statementNode);
            break;
        }
      } else {
        this.validateNodeWith(JavaExpressionStatementValidator, statementNode);
      }
    });

    this.setFlags({
      didReturnInCurrentBlock: false,
      didReportUnreachableCode: false
    });

    this.context.scopeManager.exitScope();
  }
}
