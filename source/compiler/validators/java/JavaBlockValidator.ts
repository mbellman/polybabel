import AbstractValidator from '../common/AbstractValidator';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaValidatorUtils } from './java-validator-utils';
import { TypeDefinition, Void } from '../../symbol-resolvers/common/types';
import { TypeValidation } from '../common/type-validation';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaBlockValidator extends AbstractValidator<JavaSyntax.IJavaBlock> {
  private parentMethodNode: JavaSyntax.IJavaObjectMethod;

  @Implements public validate (): void {
    const { nodes } = this.syntaxNode;

    // TODO: Improve accuracy, e.g. in the case of initializers
    // of anonymous classes within object method blocks
    this.parentMethodNode = this.findParentNode(JavaSyntax.JavaSyntaxNode.OBJECT_METHOD) as JavaSyntax.IJavaObjectMethod;

    this.context.scopeManager.enterScope();

    nodes.forEach(statementNode => {
      // TODO: Validate statement node

      const { leftSide } = statementNode;

      switch (leftSide.node) {
        case JavaSyntax.JavaSyntaxNode.INSTRUCTION:
          const { type: instructionType, value: returnValue } = leftSide as JavaSyntax.IJavaInstruction;
          const isReturnInstruction = instructionType === JavaSyntax.JavaInstructionType.RETURN;

          if (isReturnInstruction && returnValue) {
            this.validateReturnStatement(returnValue);
          }
          break;
      }
    });

    this.context.scopeManager.exitScope();
  }

  private validateReturnStatement (returnStatement: JavaSyntax.IJavaStatement): void {
    const isInsideInitializer = this.parentMethodNode === null;

    this.focusToken(returnStatement.token);

    if (isInsideInitializer) {
      this.report(`Initializer blocks cannot return values.`);
    } else {
      const parentMethodIdentifier = this.getNamespacedIdentifier(this.parentMethodNode.name);
      const { type: parentMethodReturnType } = this.context.getCurrentExpectedType();
      const isVoidMethod = ValidatorUtils.isSimpleTypeOf(Void, parentMethodReturnType);

      if (isVoidMethod) {
        this.report(`Void method '${parentMethodIdentifier}' cannot return a value`);
      } else {
        const returnStatementType = JavaValidatorUtils.getStatementType(returnStatement, this.validatorHelper);

        this.checkIfTypeMatchesExpected(returnStatementType);
      }
    }
  }
}
