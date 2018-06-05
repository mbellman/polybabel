import AbstractValidator from '../common/AbstractValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { JavaValidatorUtils } from './java-validator-utils';
import { TypeDefinition, Void } from '../../symbol-resolvers/common/types';
import { ValidatorUtils } from '../common/validator-utils';

export default class JavaBlockValidator extends AbstractValidator<JavaSyntax.IJavaBlock> {
  private parentMethod: JavaSyntax.IJavaObjectMethod;

  @Implements public validate (): void {
    const { nodes } = this.syntaxNode;

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
    return this.findResolvedConstructInCurrentNamespace(this.parentMethod.name).type;
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
        const type = JavaValidatorUtils.getStatementType(returnStatement, this.symbolDictionary, this.scopeManager);
      }
    }
  }
}
