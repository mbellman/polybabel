import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import AbstractValidator from '../common/AbstractValidator';
import JavaStatementValidator from './JavaStatementValidator';

export default class JavaBlockValidator extends AbstractValidator<JavaSyntax.IJavaBlock> {
  @Implements public validate (): void {
    const { nodes } = this.syntaxNode;

    this.context.scopeManager.enterScope();

    nodes.forEach(statementNode => {
      this.allowAnyType();
      this.validateNodeWith(JavaStatementValidator, statementNode);
    });

    this.context.scopeManager.exitScope();
  }
}
