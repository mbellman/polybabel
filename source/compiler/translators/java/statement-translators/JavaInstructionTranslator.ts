import AbstractTranslator from '../../common/AbstractTranslator';
import JavaStatementTranslator from '../JavaStatementTranslator';
import { Implements } from 'trampoline-framework';
import { JavaSyntax } from '../../../../parser/java/java-syntax';

export default class JavaInstructionTranslator extends AbstractTranslator<JavaSyntax.IJavaInstruction> {
  @Implements protected translate (): void {
    switch (this.syntaxNode.type) {
      case JavaSyntax.JavaInstructionType.RETURN:
      case JavaSyntax.JavaInstructionType.THROW:
        this.emitReturnOrThrow();
        break;
      case JavaSyntax.JavaInstructionType.CONTINUE:
        this.emit('continue');
        break;
      case JavaSyntax.JavaInstructionType.BREAK:
        this.emit('break');
        break;
    }
  }

  private emitReturnOrThrow (): void {
    const { type, value, isConstructorReturn } = this.syntaxNode;
    const isReturn = type === JavaSyntax.JavaInstructionType.RETURN;

    this.emit(isReturn ? 'return' : 'throw');

    if (value && !isConstructorReturn) {
      this.emit(' ')
        .emitNodeWith(JavaStatementTranslator, value);
    } else if (isReturn && isConstructorReturn) {
      this.emit(' this');
    }
  }
}
