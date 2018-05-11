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
      type: null,
      value: null
    };
  }

  @Match(JavaConstants.Keyword.RETURN)
  protected onReturn (): void {
    this.parseValuedInstruction(JavaSyntax.JavaInstructionType.RETURN);
  }

  @Match(JavaConstants.Keyword.THROW)
  protected onThrow (): void {
    this.parseValuedInstruction(JavaSyntax.JavaInstructionType.THROW);
  }

  @Match(JavaConstants.Keyword.CONTINUE)
  protected onContinue (): void {
    this.parsed.type = JavaSyntax.JavaInstructionType.CONTINUE;

    this.finish();
  }

  @Match(JavaConstants.Keyword.BREAK)
  protected onBreak (): void {
    this.parsed.type = JavaSyntax.JavaInstructionType.BREAK;

    this.finish();
  }

  /**
   * Parses an instruction which potentially includes a statement
   * value, such as a 'return' or 'throw'.
   */
  private parseValuedInstruction (instructionType: JavaSyntax.JavaInstructionType): void {
    this.next();

    this.parsed.type = instructionType;

    if (!this.currentTokenMatches(';')) {
      this.parsed.value = this.parseNextWith(JavaStatementParser);
    }

    this.stop();
  }
}
