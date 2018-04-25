import AbstractParser from '../../common/AbstractParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match } from '../../common/parser-decorators';
import JavaStatementParser from '../JavaStatementParser';
import JavaBlockParser from '../JavaBlockParser';
import { ParserUtils } from '../../common/parser-utils';

/**
 * @todo @description
 */
export default class JavaIfElseParser extends AbstractParser<JavaSyntax.IJavaIfElse> {
  @Implements protected getDefault (): JavaSyntax.IJavaIfElse {
    return {
      node: JavaSyntax.JavaSyntaxNode.IF_ELSE,
      conditions: [],
      blocks: []
    };
  }

  @Override protected onFirstToken (): void {
    this.assertCurrentTokenMatch(JavaConstants.Keyword.IF);
    this.next();
  }

  @Match('(')
  protected onConditionalStatement (): void {
    this.next();

    const conditionalStatement = this.parseNextWith(JavaStatementParser);

    this.parsed.conditions.push(conditionalStatement);
    this.assertCurrentTokenMatch(')');
    this.next();
  }

  @Match('{')
  protected onConditionalBlock (): void {
    this.assert(this.parsed.conditions.length > 0);

    const block = this.parseNextWith(JavaBlockParser);

    this.parsed.blocks.push(block);
  }

  @Match(JavaConstants.Keyword.ELSE)
  protected onElse (): void {
    this.next();

    const isElseIf = this.currentTokenMatches(JavaConstants.Keyword.IF);

    if (isElseIf) {
      const elseIf = this.parseNextWith(JavaIfElseParser);
      const { blocks, conditions } = this.parsed;

      this.parsed.blocks = [ ...blocks, ...elseIf.blocks ];
      this.parsed.conditions = [ ...conditions, ...elseIf.conditions ];
    } else {
      this.assertCurrentTokenMatch('{');
      this.onConditionalBlock();
    }

    this.stop();
  }

  @Match(/./)
  protected onEnd (): void {
    this.stop();
  }
}
