import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Allow, Eat, Match } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';

/**
 * Parses Java if-else statements, and stops when the end
 * of a conditional block or an unknown token after a
 * solitary if block is reached.
 *
 * @example
 *
 *  if (...) {
 *    ...
 *  } else if (...) {
 *    ...
 *  } else {
 *    ...
 *  }
 */
export default class JavaIfElseParser extends AbstractParser<JavaSyntax.IJavaIfElse> {
  @Implements protected getDefault (): JavaSyntax.IJavaIfElse {
    return {
      node: JavaSyntax.JavaSyntaxNode.IF_ELSE,
      conditions: [],
      blocks: []
    };
  }

  @Eat(JavaConstants.Keyword.IF)
  protected onIf (): void {
    this.next();
  }

  @Eat('(')
  protected onStartConditionalStatement (): void {
    this.next();

    const conditionalStatement = this.parseNextWith(JavaStatementParser);

    this.parsed.conditions.push(conditionalStatement);
  }

  @Eat(')')
  protected onEndConditionalStatement (): void {
    this.next();
  }

  /**
   * @todo Allow inline/single-line if/else statements
   */
  @Allow('{')
  protected onConditionalBlock (): void {
    this.assert(this.parsed.conditions.length > 0);

    const block = this.parseNextWith(JavaBlockParser);

    this.parsed.blocks.push(block);
  }

  @Allow(JavaConstants.Keyword.ELSE)
  protected onElse (): void {
    this.next();
  }

  @Allow(JavaConstants.Keyword.IF)
  protected onElseIf (): void {
    const elseIf = this.parseNextWith(JavaIfElseParser);
    const { blocks, conditions } = this.parsed;

    this.parsed.blocks = [ ...blocks, ...elseIf.blocks ];
    this.parsed.conditions = [ ...conditions, ...elseIf.conditions ];

    this.stop();
  }

  @Allow('{')
  protected onElseBlock (): void {
    this.onConditionalBlock();
    this.stop();
  }

  @Match(/./)
  protected onEnd (): void {
    this.stop();
  }
}
