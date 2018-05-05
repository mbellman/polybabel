import AbstractParser from '../../common/AbstractParser';
import JavaBlockParser from '../JavaBlockParser';
import JavaStatementParser from '../JavaStatementParser';
import { Implements, Override } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';
import { Match, Eat } from '../../common/parser-decorators';

/**
 * Parses switch statements and stops after completion.
 *
 * @example
 *
 *  switch (value) {
 *    case 1:
 *      ...
 *    case 2:
 *      ...
 *    default:
 *      ...
 *  }
 */
export default class JavaSwitchParser extends AbstractParser<JavaSyntax.IJavaSwitch> {
  @Implements protected getDefault (): JavaSyntax.IJavaSwitch {
    return {
      node: JavaSyntax.JavaSyntaxNode.SWITCH,
      value: null,
      cases: [],
      blocks: [],
      defaultBlock: null
    };
  }

  @Eat(JavaConstants.Keyword.SWITCH)
  protected onSwitch (): void {
    this.next();
  }

  @Eat('(')
  protected onStartSwitchValue (): void {
    this.next();

    this.parsed.value = this.parseNextWith(JavaStatementParser);
  }

  @Eat(')')
  protected onEndSwitchValue (): void {
    this.next();
  }

  @Eat('{')
  protected onEnterSwitchBlock (): void {
    this.assert(this.parsed.value !== null);
    this.next();
  }

  @Match(JavaConstants.Keyword.CASE)
  protected onCase (): void {
    this.next();
    this.assertCurrentTokenMatch(/[^:]/);

    const caseValue = this.parseNextWith(JavaStatementParser);

    this.parsed.cases.push(caseValue);
  }

  @Match(':')
  protected onEnterCaseBlock (): void {
    const hasCorrespondingCase = this.parsed.cases.length === this.parsed.blocks.length + 1;

    this.assert(hasCorrespondingCase);
    this.next();

    const block = this.parseNextWith(JavaBlockParser);

    this.parsed.blocks.push(block);
  }

  @Match(JavaConstants.Keyword.DEFAULT)
  protected onDefault (): void {
    this.assert(
      this.parsed.defaultBlock === null &&
      this.nextToken.value === ':'
    );

    // Skip the tokens 'default' and ':'
    this.next();
    this.next();

    this.parsed.defaultBlock = this.parseNextWith(JavaBlockParser);
  }

  @Match(/./)
  protected onAfterExitSwitch (): void {
    this.stop();
  }
}
