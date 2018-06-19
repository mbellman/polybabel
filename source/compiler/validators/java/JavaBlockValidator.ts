import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import AbstractValidator from '../common/AbstractValidator';
import JavaStatementValidator from './JavaStatementValidator';

export default class JavaBlockValidator extends AbstractValidator<JavaSyntax.IJavaBlock> {
  @Implements public validate (): void {
    const { nodes } = this.syntaxNode;

    this.context.scopeManager.enterScope();

    this.setFlags({
      didReturnInCurrentBlock: false,
      didReportUnreachableCode: false
    });

    nodes.forEach(statementNode => {
      this.setFlags({
        shouldAllowAnyType: true
      });

      this.validateNodeWith(JavaStatementValidator, statementNode);
    });

    this.setFlags({
      didReturnInCurrentBlock: false,
      didReportUnreachableCode: false
    });

    this.context.scopeManager.exitScope();
  }
}
