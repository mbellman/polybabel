import AbstractParser from '../../common/AbstractParser';
import JavaStatementParser from '../JavaStatementParser';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match } from '../../common/parser-decorators';
import { ParserUtils } from '../../common/parser-utils';

/**
 * Parses instruction statements, finishing after
 * a ; terminator.
 *
 * @example
 *
 *  return ...
 *  throw ...
 *  continue
 *  break
 */
export default class JavaInstructionParser extends AbstractParser<JavaSyntax.IJavaInstruction> {
  @Implements protected getDefault (): JavaSyntax.IJavaInstruction {
    return {
      node: JavaSyntax.JavaSyntaxNode.INSTRUCTION,
      instruction: null,
      value: null
    };
  }

  @Match(JavaConstants.Keyword.RETURN)
  protected onReturn (): void {
    this.parseValuedInstruction(JavaSyntax.JavaInstruction.RETURN);
  }

  @Match(JavaConstants.Keyword.THROW)
  protected onThrow (): void {
    this.parseValuedInstruction(JavaSyntax.JavaInstruction.THROW);
  }

  @Match(JavaConstants.Keyword.CONTINUE)
  protected onContinue (): void {
    this.parsed.instruction = JavaSyntax.JavaInstruction.CONTINUE;

    this.next();
    this.safelyFinishInstruction();
  }

  @Match(JavaConstants.Keyword.BREAK)
  protected onBreak (): void {
    this.parsed.instruction = JavaSyntax.JavaInstruction.BREAK;

    this.next();
    this.safelyFinishInstruction();
  }

  private parseValuedInstruction (instruction: JavaSyntax.JavaInstruction): void {
    this.next();

    this.parsed.instruction = instruction;
    this.parsed.value = this.parseNextWith(JavaStatementParser);

    this.safelyFinishInstruction();
  }

  private safelyFinishInstruction (): void {
    this.assertCurrentTokenMatch(';');
    this.finish();
  }
}
