import AbstractValidator from '../common/AbstractValidator';
import { FunctionType } from '../../symbol-resolvers/common/function-type';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaValidatorUtils } from './java-validator-utils';
import { TypeDefinition, Void } from '../../symbol-resolvers/common/types';
import { TypeValidation } from '../common/type-validation';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaBlockValidator extends AbstractValidator<JavaSyntax.IJavaBlock> {
  private parentMethod: JavaSyntax.IJavaObjectMethod;

  @Implements public validate (): void {
    const { nodes } = this.syntaxNode;

    // TODO: Improve accuracy, e.g. in the case of initializers
    // of anonymous classes within object method blocks
    this.parentMethod = this.findParentNode(JavaSyntax.JavaSyntaxNode.OBJECT_METHOD) as JavaSyntax.IJavaObjectMethod;

    nodes.forEach(statementNode => {
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
  }

  private getParentMethodIdentifier (): string {
    return this.getNamespacedIdentifier(this.parentMethod.name);
  }

  private getParentMethodReturnType (): TypeDefinition {
    const parentMethodFunctionType = this.findResolvedConstructInCurrentNamespace(this.parentMethod.name).type as FunctionType.Definition;

    return parentMethodFunctionType.getReturnType();
  }

  private validateReturnStatement (returnStatement: JavaSyntax.IJavaStatement): void {
    const isInsideInitializer = this.parentMethod === null;

    if (isInsideInitializer) {
      this.report(`Initializer blocks cannot return values.`);
    } else {
      const parentMethodReturnType = this.getParentMethodReturnType();
      const isVoidMethod = ValidatorUtils.isSimpleTypeOf(Void, parentMethodReturnType);

      if (isVoidMethod) {
        this.report(`Void method '${this.getParentMethodIdentifier()}' cannot return a value`);
      } else {
        const returnStatementType = JavaValidatorUtils.getStatementType(returnStatement, this.symbolDictionary, this.scopeManager);

        // TODO: Generate a more meaningful message describing the mismatched types
        this.check(
          TypeValidation.typeMatches(returnStatementType, parentMethodReturnType),
          `Method '${this.getParentMethodIdentifier()}' cannot return a type different from its return type`
        );
      }
    }
  }
}
