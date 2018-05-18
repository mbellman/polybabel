import AbstractParser from '../../common/AbstractParser';
import JavaStatementParser from '../JavaStatementParser';
import { Allow, Expect } from '../../common/parser-decorators';
import { Implements } from 'trampoline-framework';
import { JavaConstants } from '../java-constants';
import { JavaSyntax } from '../java-syntax';

/**
 * Parses Java assertions, finishing after reaching a ;
 * token at the end of the assertion.
 *
 * @example
 *
 *  assert this.data.value == expectedValue;
 *  assert this.data.value == expectedValue : 'Data value mismatch';
 */
export default class JavaAssertionParser extends AbstractParser<JavaSyntax.IJavaAssertion> {
  @Implements protected getDefault (): JavaSyntax.IJavaAssertion {
    return {
      node: JavaSyntax.JavaSyntaxNode.ASSERTION,
      condition: null
    };
  }

  @Expect(JavaConstants.Keyword.ASSERT)
  protected onAssert (): void {
    this.next();
  }

  @Allow(/./)
  protected onCondition (): void {
    this.parsed.condition = this.parseNextWith(JavaStatementParser);
  }

  @Allow(';')
  protected onEndAssertion (): void {
    this.finish();
  }

  @Allow(':')
  protected onMessageSeparator (): void {
    this.next();
  }

  @Allow(/./)
  protected onMessage (): void {
    this.parsed.message = this.parseNextWith(JavaStatementParser);

    this.eat(';');
    this.stop();
  }
}
