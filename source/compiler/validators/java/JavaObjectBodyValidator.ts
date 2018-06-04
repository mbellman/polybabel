import AbstractValidator from '../common/AbstractValidator';
import JavaClassValidator from './JavaClassValidator';
import JavaInterfaceValidator from './JavaInterfaceValidator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../parser/java/java-syntax';
import { ValidationUtils } from '../common/validation-utils';
import { Void } from '../../symbol-resolvers/common/types';
import { FunctionType } from '../../symbol-resolvers/common/function-type';

export default class JavaObjectBodyValidator extends AbstractValidator<JavaSyntax.IJavaObject> {
  @Implements public validate (): void {
    const { members } = this.syntaxNode;

    members.forEach(member => {
      switch (member.node) {
        case JavaSyntax.JavaSyntaxNode.OBJECT_FIELD:
          this.validateObjectField(member as JavaSyntax.IJavaObjectField);
          break;
        case JavaSyntax.JavaSyntaxNode.OBJECT_METHOD:
          this.validateObjectMethod(member as JavaSyntax.IJavaObjectMethod);
          break;
        case JavaSyntax.JavaSyntaxNode.CLASS:
          this.validateNodeWith(JavaClassValidator, member);
          break;
        case JavaSyntax.JavaSyntaxNode.INTERFACE:
          this.validateNodeWith(JavaInterfaceValidator, member);
          break;
      }
    });
  }

  private isClass (): boolean {
    return this.syntaxNode.node === JavaSyntax.JavaSyntaxNode.CLASS;
  }

  private isInterface (): boolean {
    return this.syntaxNode.node === JavaSyntax.JavaSyntaxNode.INTERFACE;
  }

  private getObjectName (): string {
    return this.syntaxNode.name;
  }

  private validateObjectField (objectField: JavaSyntax.IJavaObjectField): void {
    const { type } = objectField;
  }

  private validateObjectMethod (objectMethod: JavaSyntax.IJavaObjectMethod): void {
    const { type: typeNode, name, isAbstract, block } = objectMethod;
    const objectMethodDefinition = this.getTypeDefinitionInCurrentNamespace(name) as FunctionType.Definition;
    const returnType = objectMethodDefinition.getReturnType();

    if (isAbstract) {
      this.assertAndContinue(
        block === null,
        `Abstract method '${this.getObjectName()}.${name}' cannot have an implementation`
      );
    } else {
      this.assertAndContinue(
        block !== null,
        `Non-abstract method '${this.getObjectName()}.${name}' must have an implementation`
      );
    }

    if (!block) {
      return;
    }

    block.nodes.forEach(syntaxNode => {
      const { leftSide } = syntaxNode;

      switch (leftSide.node) {
        case JavaSyntax.JavaSyntaxNode.INSTRUCTION:
          const { type: instructionType, value: returnValue } = leftSide as JavaSyntax.IJavaInstruction;

          if (instructionType === JavaSyntax.JavaInstructionType.RETURN && returnValue) {
            this.assertAndContinue(
              !ValidationUtils.isSimpleTypeOf(returnType, Void),
              `Void method '${this.getObjectName()}.${name}' cannot return a value`
            );
          }
          break;
      }
    });
  }
}
