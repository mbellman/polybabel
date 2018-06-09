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

  private getParentMethodIdentifier (): string {
    return this.getNamespacedIdentifier(this.parentMethodNode.name);
  }

  private getParentMethodReturnType (): TypeDefinition {
    const { objectVisitor } = this.context;
    const parentMethodFunctionType = objectVisitor.findParentObjectMember(this.parentMethodNode.name).type as FunctionType.Definition;

    return parentMethodFunctionType.getReturnType();
  }

  private validateReturnStatement (returnStatement: JavaSyntax.IJavaStatement): void {
    const isInsideInitializer = this.parentMethodNode === null;

    this.focus(returnStatement);

    if (isInsideInitializer) {
      this.report(`Initializer blocks cannot return values.`);
    } else {
      const parentMethodReturnType = this.getParentMethodReturnType();
      const isVoidMethod = ValidatorUtils.isSimpleTypeOf(Void, parentMethodReturnType);

      if (isVoidMethod) {
        this.report(`Void method '${this.getParentMethodIdentifier()}' cannot return a value`);
      } else {
        const returnStatementType = JavaValidatorUtils.getStatementType(returnStatement, this.createValidationHelper());

        if (!TypeValidation.typeMatches(returnStatementType, parentMethodReturnType)) {
          const returnStatementTypeDescription = ValidatorUtils.getTypeDescription(returnStatementType);
          const parentMethodReturnTypeDescription = ValidatorUtils.getTypeDescription(parentMethodReturnType);

          this.report(`Expected method '${this.getParentMethodIdentifier()}' to return '${parentMethodReturnTypeDescription}'; returned '${returnStatementTypeDescription}' instead`);
        }
      }
    }
  }
}
